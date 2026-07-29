import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2, Pause, Play } from "lucide-react";
import { MockupShell, type MockView } from "@/components/mockups/shell";
import { VIEW_META } from "@/components/mockups/views";

const GOLD = "#B8892E";

const TOUR: MockView[] = [
  "dashboard", "executive", "kpi", "graph", "ai",
  "attendance", "planning", "tasks", "meetings",
  "messages", "announcements", "workflows", "hr", "finance", "team",
];
const STEP_MS = 4600;

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(" ");

/**
 * Auto-looping walkthrough of the platform. Used on both the investor page
 * and the public landing page to keep the visual story identical.
 */
export default function EmbeddedTour({ className }: { className?: string }) {
  const [view, setView] = useState<MockView>("dashboard");
  const [autoplay, setAutoplay] = useState(true);
  const [progress, setProgress] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autoplay) return;
    const start = Date.now();
    const tick = setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - start) / STEP_MS) * 100));
    }, 80);
    const next = setTimeout(() => {
      const idx = TOUR.indexOf(view);
      setView(TOUR[(idx + 1) % TOUR.length]);
      setProgress(0);
    }, STEP_MS);
    return () => { clearInterval(tick); clearTimeout(next); };
  }, [view, autoplay]);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = async () => {
    if (!wrapRef.current) return;
    if (!document.fullscreenElement) {
      await wrapRef.current.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  };

  const meta = VIEW_META[view];
  const Comp = meta.Component;

  return (
    <div
      ref={wrapRef}
      className={cx(
        "relative overflow-hidden border shadow-2xl bg-white mx-auto",
        fullscreen ? "w-screen h-screen rounded-none" : "rounded-xl aspect-[16/10] w-full max-w-5xl",
        className,
      )}
      style={{ borderColor: `${GOLD}44` }}
    >
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <button
          onClick={() => setAutoplay((a) => !a)}
          className="w-8 h-8 rounded-md bg-black/60 backdrop-blur text-white hover:bg-black/80 flex items-center justify-center transition"
          aria-label={autoplay ? "Pause tour" : "Play tour"}
        >
          {autoplay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={toggleFullscreen}
          className="w-8 h-8 rounded-md bg-black/60 backdrop-blur text-white hover:bg-black/80 flex items-center justify-center transition"
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="absolute top-0 left-0 right-0 h-0.5 bg-black/10 z-20">
        <div className="h-full transition-all duration-100" style={{ width: `${progress}%`, background: GOLD }} />
      </div>

      <div className="absolute inset-0">
        <MockupShell
          view={view}
          onNav={(v) => { setAutoplay(false); setView(v); setProgress(0); }}
          pageTitle={meta.title}
          pageSubtitle={meta.subtitle}
          headerIcon={meta.Icon ? <meta.Icon className="w-6 h-6 text-svo-gold" /> : undefined}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <Comp />
            </motion.div>
          </AnimatePresence>
        </MockupShell>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {TOUR.map((v) => (
          <button
            key={v}
            onClick={() => { setAutoplay(false); setView(v); setProgress(0); }}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: v === view ? 20 : 6,
              background: v === view ? GOLD : "rgba(255,255,255,0.5)",
            }}
            aria-label={`Go to ${v}`}
          />
        ))}
      </div>
    </div>
  );
}