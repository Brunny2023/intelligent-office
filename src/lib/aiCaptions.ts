/**
 * High-accuracy live captions.
 *
 * Captures microphone audio with the Web Audio API, splits it into complete
 * utterances using a simple energy-based voice activity detector, encodes each
 * utterance as a 16 kHz mono WAV file and sends it to the `transcribe-audio`
 * backend function (Lovable AI speech-to-text). Far more accurate than the
 * browser's built-in speech recognition, and works in browsers that have none.
 */

const SAMPLE_RATE = 16000;
const MIN_UTTERANCE_MS = 900;
const MAX_UTTERANCE_MS = 14000;
const SILENCE_HANG_MS = 700;
const SPEECH_RMS = 0.012;

export interface CaptionOptions {
  onUtterance: (text: string) => void;
  onStatus?: (status: "listening" | "transcribing" | "idle") => void;
  onError?: (message: string) => void;
  /** Vocabulary hint (names, product terms) that sharpens recognition. */
  vocabularyHint?: string;
  language?: string;
}

function encodeWav(chunks: Float32Array[], length: number): Blob {
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  writeStr(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, length * 2, true);
  let offset = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      const s = Math.max(-1, Math.min(1, chunk[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function downsample(input: Float32Array, inRate: number): Float32Array {
  if (inRate === SAMPLE_RATE) return input;
  const ratio = inRate / SAMPLE_RATE;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

export class AiCaptioner {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private node: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private buffer: Float32Array[] = [];
  private bufferLen = 0;
  private speaking = false;
  private lastVoiceAt = 0;
  private stopped = false;
  private recentText = "";

  constructor(private opts: CaptionOptions) {}

  async start() {
    this.stopped = false;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      this.opts.onError?.("Microphone access is needed for live captions.");
      return false;
    }
    const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AC();
    if (this.ctx.state === "suspended") await this.ctx.resume().catch(() => undefined);
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.node = this.ctx.createScriptProcessor(4096, 1, 1);
    const inRate = this.ctx.sampleRate;

    this.node.onaudioprocess = (e) => {
      if (this.stopped) return;
      const raw = e.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < raw.length; i++) sum += raw[i] * raw[i];
      const rms = Math.sqrt(sum / raw.length);
      const now = performance.now();

      if (rms > SPEECH_RMS) {
        if (!this.speaking) { this.speaking = true; this.buffer = []; this.bufferLen = 0; }
        this.lastVoiceAt = now;
      }

      if (this.speaking) {
        const chunk = downsample(new Float32Array(raw), inRate);
        this.buffer.push(chunk);
        this.bufferLen += chunk.length;
        const durationMs = (this.bufferLen / SAMPLE_RATE) * 1000;
        const silent = now - this.lastVoiceAt > SILENCE_HANG_MS;
        if ((silent && durationMs > MIN_UTTERANCE_MS) || durationMs > MAX_UTTERANCE_MS) {
          this.flush();
        } else if (silent) {
          this.speaking = false;
          this.buffer = [];
          this.bufferLen = 0;
        }
      }
    };

    this.source.connect(this.node);
    // Muted sink keeps the processor running without echoing audio back.
    const sink = this.ctx.createGain();
    sink.gain.value = 0;
    this.node.connect(sink);
    sink.connect(this.ctx.destination);
    this.opts.onStatus?.("listening");
    return true;
  }

  private flush() {
    const chunks = this.buffer;
    const len = this.bufferLen;
    this.buffer = [];
    this.bufferLen = 0;
    this.speaking = false;
    if (len < SAMPLE_RATE * 0.6) return;
    const blob = encodeWav(chunks, len);
    void this.transcribe(blob);
  }

  private async transcribe(blob: Blob) {
    this.opts.onStatus?.("transcribing");
    try {
      const form = new FormData();
      form.append("file", blob, "segment.wav");
      if (this.opts.language) form.append("language", this.opts.language);
      const hint = [this.opts.vocabularyHint, this.recentText].filter(Boolean).join(" ").slice(-800);
      if (hint) form.append("prompt", hint);

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`;
      const res = await fetch(url, {
        method: "POST",
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
        body: form,
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        this.opts.onError?.(res.status === 429 ? "Captions are rate limited — retrying shortly." : `Captions unavailable: ${detail.slice(0, 140) || res.status}`);
        return;
      }

      // SSE: concatenate transcript deltas, prefer the terminal full text.
      const reader = res.body?.getReader();
      let text = "";
      let pending = "";
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pending += decoder.decode(value, { stream: true });
          const lines = pending.split("\n");
          pending = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const evt = JSON.parse(payload);
              if (evt.type === "transcript.text.delta" && evt.delta) text += evt.delta;
              else if (evt.type === "transcript.text.done" && evt.text) text = evt.text;
            } catch { /* partial frame */ }
          }
        }
      }

      const clean = text.trim();
      if (clean && clean.length > 1) {
        this.recentText = `${this.recentText} ${clean}`.trim().slice(-600);
        this.opts.onUtterance(clean);
      }
    } catch {
      this.opts.onError?.("Captions connection interrupted.");
    } finally {
      if (!this.stopped) this.opts.onStatus?.("listening");
    }
  }

  stop() {
    this.stopped = true;
    try { this.node?.disconnect(); } catch { /* noop */ }
    try { this.source?.disconnect(); } catch { /* noop */ }
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close().catch(() => undefined);
    this.node = null; this.source = null; this.stream = null; this.ctx = null;
    this.buffer = []; this.bufferLen = 0; this.speaking = false;
    this.opts.onStatus?.("idle");
  }
}
