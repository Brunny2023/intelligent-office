import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import AnswerCard, { CopilotAnswer } from "./AnswerCard";
import FollowUpsRail from "./FollowUpsRail";
import { subscribeUtterances } from "@/lib/liveTranscript";
import { Send, X, Minimize2, Maximize2 } from "lucide-react";

interface Props {
  meetingId: string | null;
  roomName: string;
  onOpenSource?: (ref: string) => void;
}

export default function FounderCopilotPanel({ meetingId, roomName, onOpenSource }: Props) {
  const [answer, setAnswer] = useState<CopilotAnswer>({ mode: "idle" });
  const [followUps, setFollowUps] = useState<string[]>([]);
  
  const [manualQ, setManualQ] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const historyRef = useRef<Array<{ role: string; text: string }>>([]);
  const inflight = useRef<AbortController | null>(null);

  const ask = useCallback(async (utterance: string) => {
    if (!utterance || utterance.length < 3) return;
    inflight.current?.abort();
    const ctrl = new AbortController();
    inflight.current = ctrl;
    setAnswer({ mode: "loading" });
    historyRef.current.push({ role: "investor", text: utterance });
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/exec-intel-copilot`, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ utterance, meetingId, roomName, history: historyRef.current.slice(-8) }),
      });
      const data = await res.json();
      if (data?.mode) {
        setAnswer(data);
        setFollowUps(Array.isArray(data.followUps) ? data.followUps : []);
        historyRef.current.push({ role: "copilot", text: JSON.stringify({ mode: data.mode, headline: data.headline, question: data.question }) });
      } else {
        setAnswer({ mode: "manual", hint: data?.error ? `Copilot error: ${data.error}` : "Answer manually." });
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setAnswer({ mode: "manual", hint: "Network hiccup — answer manually." });
    }
  }, [meetingId, roomName]);

  const utteranceTimer = useRef<number | null>(null);
  const onUtterance = useCallback((text: string) => {
    if (utteranceTimer.current) window.clearTimeout(utteranceTimer.current);
    utteranceTimer.current = window.setTimeout(() => ask(text), 250);
  }, [ask]);

  // The shared meeting room owns the live transcript now; the copilot simply
  // listens to the utterances it publishes.
  useEffect(() => subscribeUtterances(onUtterance), [onUtterance]);

  useEffect(() => () => { if (utteranceTimer.current) window.clearTimeout(utteranceTimer.current); }, []);

  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        className="fixed right-4 bottom-24 z-40 px-4 py-2 rounded-full bg-amber-500 text-black font-medium text-xs shadow-2xl"
      >
        Show Copilot
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        className={`fixed right-4 top-20 bottom-24 z-40 flex flex-col gap-3 ${collapsed ? "w-14" : "w-[380px]"}`}
      >
        <div className="flex items-center justify-between rounded-xl bg-black/70 border border-amber-500/30 px-3 py-2 backdrop-blur">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-medium text-amber-300 tracking-wider uppercase">Executive Intelligence</span>
            </div>
          )}
          <div className="flex gap-1 ml-auto">
            <button onClick={() => setCollapsed((v) => !v)} className="p-1.5 rounded hover:bg-white/10 text-white/70" title="Collapse">
              {collapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setHidden(true)} className="p-1.5 rounded hover:bg-white/10 text-white/70" title="Hide">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            <p className="text-[11px] text-white/40 px-1">
              Listening to the room&apos;s live transcript — toggle it from the meeting controls.
            </p>

            <div className="flex-1 min-h-0 overflow-auto space-y-3">
              <AnswerCard answer={answer} onOpenSource={onOpenSource} />
              <FollowUpsRail items={followUps} onPick={(q) => ask(q)} />
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); if (manualQ.trim()) { ask(manualQ.trim()); setManualQ(""); } }}
              className="flex gap-2"
            >
              <input
                value={manualQ}
                onChange={(e) => setManualQ(e.target.value)}
                placeholder="Ask copilot silently…"
                className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50"
              />
              <button type="submit" className="p-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}