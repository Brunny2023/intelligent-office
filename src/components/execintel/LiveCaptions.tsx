import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

interface Props {
  onUtterance: (text: string) => void;
  onInterim?: (text: string) => void;
  enabled: boolean;
  onToggle: () => void;
}

export default function LiveCaptions({ onUtterance, onInterim, enabled, onToggle }: Props) {
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const recogRef = useRef<any>(null);
  const restartRef = useRef(false);

  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    if (!enabled) {
      if (recogRef.current) { restartRef.current = false; try { recogRef.current.stop(); } catch { /* noop */ } }
      setInterim("");
      return;
    }

    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";
    recogRef.current = recog;
    restartRef.current = true;

    recog.onresult = (e: any) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript as string;
        if (e.results[i].isFinal) {
          const clean = t.trim();
          if (clean.length > 2) onUtterance(clean);
        } else {
          interimText += t;
        }
      }
      setInterim(interimText);
      onInterim?.(interimText);
    };
    recog.onerror = () => { /* noop */ };
    recog.onend = () => { if (restartRef.current) { try { recog.start(); } catch { /* noop */ } } };

    try { recog.start(); } catch { /* noop */ }

    return () => { restartRef.current = false; try { recog.stop(); } catch { /* noop */ } };
  }, [enabled, onUtterance, onInterim]);

  return (
    <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 flex items-center gap-3">
      <button
        onClick={onToggle}
        disabled={!supported}
        className={`p-2 rounded-full ${enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/60"} disabled:opacity-40`}
        title={supported ? (enabled ? "Pause captions" : "Start captions") : "Captions not supported in this browser"}
      >
        {enabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
      </button>
      <div className="flex-1 text-sm text-white/70 truncate">
        {!supported ? "Captions unavailable — use manual ask." : interim || (enabled ? "Listening…" : "Captions paused")}
      </div>
    </div>
  );
}