// Shared transcript bus for meeting rooms. The captions layer captures speech
// once and publishes here, so any panel (live transcript, Founder Copilot) can
// consume the same stream without owning a microphone.
export interface TranscriptLine {
  t: string;
  speaker: string;
  text: string;
}

type Listener = (text: string) => void;
type LineListener = (lines: TranscriptLine[]) => void;

const listeners = new Set<Listener>();
const lineListeners = new Set<LineListener>();
let lines: TranscriptLine[] = [];

export function publishUtterance(text: string, speaker = "You") {
  const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  lines = [...lines.slice(-199), { t, speaker, text }];
  lineListeners.forEach((l) => { try { l(lines); } catch { /* noop */ } });
  listeners.forEach((l) => { try { l(text); } catch { /* noop */ } });
}

export function subscribeUtterances(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function subscribeTranscript(listener: LineListener): () => void {
  lineListeners.add(listener);
  listener(lines);
  return () => { lineListeners.delete(listener); };
}

export function getTranscript() {
  return lines;
}

export function resetTranscript() {
  lines = [];
  lineListeners.forEach((l) => { try { l(lines); } catch { /* noop */ } });
}
