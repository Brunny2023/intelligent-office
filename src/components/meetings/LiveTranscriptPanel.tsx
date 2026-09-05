import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Mic, MicOff, Loader2, X } from "lucide-react";
import { publishUtterance } from "@/lib/liveTranscript";
import { AiCaptioner } from "@/lib/aiCaptions";

interface Props {
  onClose: () => void;
  /** Names/terms spoken in this meeting — improves recognition accuracy. */
  vocabularyHint?: string;
}

/**
 * Live transcript for every participant in any meeting room.
 * Audio is captured locally, split into complete utterances and transcribed by
 * the platform's speech-to-text service (far more accurate than browser
 * recognition), then broadcast on the in-page bus so panels like the Founder
 * Copilot can react to what is being said.
 */
export default function LiveTranscriptPanel({ onClose, vocabularyHint }: Props) {
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState<"listening" | "transcribing" | "idle">("idle");
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<Array<{ t: string; text: string }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const captionerRef = useRef<AiCaptioner | null>(null);

  const onUtterance = useCallback((text: string) => {
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLines((prev) => [...prev.slice(-199), { t, text }]);
    publishUtterance(text);
  }, []);

  useEffect(() => {
    if (!enabled) {
      captionerRef.current?.stop();
      captionerRef.current = null;
      return;
    }
    const captioner = new AiCaptioner({
      onUtterance,
      onStatus: setStatus,
      onError: (message) => setError(message),
      vocabularyHint,
    });
    captionerRef.current = captioner;
    void captioner.start().then((ok) => { if (ok) setError(null); });
    return () => { captioner.stop(); captionerRef.current = null; };
  }, [enabled, onUtterance, vocabularyHint]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const download = () => {
    const body = lines.map((l) => `[${l.t}] ${l.text}`).join("\n");
    const url = URL.createObjectURL(new Blob([body || "No transcript captured."], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `live-transcript-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.aside
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute left-4 bottom-24 z-40 w-[340px] max-w-[calc(100vw-2rem)] flex flex-col gap-2"
    >
      <div className="flex items-center justify-between rounded-xl bg-black/70 border border-white/10 px-3 py-2 backdrop-blur">
        <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Live transcript</span>
        <div className="flex gap-1">
          <button onClick={download} className="p-1.5 rounded hover:bg-white/10 text-white/70" title="Download transcript">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/10 text-white/70" title="Close transcript">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setEnabled((v) => !v)}
          className={`p-2 rounded-full ${enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/60"}`}
          title={enabled ? "Pause captions" : "Start captions"}
        >
          {enabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>
        <div className="flex-1 text-sm text-white/70 truncate flex items-center gap-2">
          {status === "transcribing" && enabled && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/50" />}
          {error ? error : !enabled ? "Captions paused" : status === "transcribing" ? "Transcribing…" : "Listening…"}
        </div>
      </div>

      <div ref={scrollRef} className="max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-black/60 px-3 py-2 space-y-1.5 backdrop-blur">
        {lines.length === 0 ? (
          <p className="text-xs text-white/40">Spoken words appear here as the meeting runs.</p>
        ) : (
          lines.map((l, i) => (
            <p key={i} className="text-xs text-white/80 leading-relaxed">
              <span className="text-white/35 mr-2">{l.t}</span>{l.text}
            </p>
          ))
        )}
      </div>
    </motion.aside>
  );
}
