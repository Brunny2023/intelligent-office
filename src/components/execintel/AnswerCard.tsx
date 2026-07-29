import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, HelpCircle, Sparkles } from "lucide-react";
import { useState } from "react";

export type CopilotAnswer =
  | { mode: "answer"; headline: string; source?: { label: string; ref: string }; expand?: { metrics?: string[]; talking_points?: string[] }; latency_ms?: number }
  | { mode: "clarify"; question: string; latency_ms?: number }
  | { mode: "manual"; hint: string; latency_ms?: number }
  | { mode: "loading" }
  | { mode: "idle" };

export default function AnswerCard({ answer, onOpenSource }: { answer: CopilotAnswer; onOpenSource?: (ref: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  if (answer.mode === "idle") {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-white/40 text-sm">
        Listening. Ask a question or wait for the investor to speak.
      </div>
    );
  }

  if (answer.mode === "loading") {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-white/60 text-sm flex items-center gap-2">
        <Sparkles className="w-4 h-4 animate-pulse" /> Thinking…
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={JSON.stringify(answer)}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        className="rounded-2xl border border-amber-400/30 bg-gradient-to-b from-slate-900 to-black p-6 shadow-2xl"
      >
        {answer.mode === "answer" && (
          <>
            <div className="text-3xl md:text-4xl font-medium text-white leading-tight tracking-tight">
              {answer.headline}
            </div>
            <div className="flex items-center justify-between mt-4">
              {answer.source ? (
                <button
                  onClick={() => answer.source && onOpenSource?.(answer.source.ref)}
                  className="text-[11px] uppercase tracking-widest text-amber-400/80 hover:text-amber-300 flex items-center gap-1"
                >
                  {answer.source.label} <ExternalLink className="w-3 h-3" />
                </button>
              ) : <span />}
              {answer.expand && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-[11px] uppercase tracking-widest text-white/50 hover:text-white"
                >
                  {expanded ? "Collapse" : "Expand"}
                </button>
              )}
            </div>
            {expanded && answer.expand && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 border-t border-white/10 pt-4 space-y-3"
              >
                {answer.expand.metrics && answer.expand.metrics.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Adjacent metrics</div>
                    <ul className="text-sm text-white/80 space-y-1">
                      {answer.expand.metrics.map((m, i) => <li key={i}>• {m}</li>)}
                    </ul>
                  </div>
                )}
                {answer.expand.talking_points && answer.expand.talking_points.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Say this</div>
                    <ul className="text-sm text-white/90 space-y-1">
                      {answer.expand.talking_points.map((m, i) => <li key={i}>&ldquo;{m}&rdquo;</li>)}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}

        {answer.mode === "clarify" && (
          <div className="flex items-start gap-3">
            <HelpCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-amber-400/80 mb-2">Ask the investor</div>
              <div className="text-xl text-white font-medium leading-snug">{answer.question}</div>
            </div>
          </div>
        )}

        {answer.mode === "manual" && (
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Answer manually</div>
            <div className="text-base text-white/90">{answer.hint}</div>
          </div>
        )}

        {"latency_ms" in answer && typeof answer.latency_ms === "number" && (
          <div className="mt-3 text-[10px] text-white/30 text-right">{answer.latency_ms}ms</div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}