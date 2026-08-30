// Tiny pub/sub so any panel (e.g. the Founder Copilot) can consume the live
// transcript produced by the shared meeting room without owning the recognizer.
type Listener = (text: string) => void;

const listeners = new Set<Listener>();

export function publishUtterance(text: string) {
  listeners.forEach((l) => {
    try { l(text); } catch { /* noop */ }
  });
}

export function subscribeUtterances(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
