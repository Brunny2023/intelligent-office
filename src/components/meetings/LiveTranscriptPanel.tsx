import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, X } from "lucide-react";
import LiveCaptions from "@/components/execintel/LiveCaptions";
import { publishUtterance } from "@/lib/liveTranscript";

interface Props {
  onClose: () => void;
}

/**
 * Live transcript for every participant in any meeting room.
 * Captions are produced locally (browser speech recognition) and broadcast on
 * the in-page bus so panels like the Founder Copilot can react to them.
 */
export default function LiveTranscriptPanel({ onClose }: Props) {
  const [enabled, setEnabled] = useState(true);
  const [lines, setLines] = useState<Array<{ t: string; text: string }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onUtterance = useCallback((text: string) => {
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLines((prev) => [...prev.slice(-199), { t, text }]);
    publishUtterance(text);
  }, []);

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

      <LiveCaptions enabled={enabled} onToggle={() => setEnabled((v) => !v)} onUtterance={onUtterance} />

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
