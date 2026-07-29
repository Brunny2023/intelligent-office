import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MousePointer2, Pause, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MockupShell, type MockView } from "@/components/mockups/shell";
import { VIEW_META } from "@/components/mockups/views";

const TOUR: MockView[] = [
  "dashboard", "executive", "kpi", "graph", "ai",
  "attendance", "planning", "tasks", "meetings",
  "messages", "announcements", "workflows", "hr", "finance", "team",
];
const STEP_MS = 4600;

const Demo = () => {
  const [view, setView] = useState<MockView>("dashboard");
  const [autoplay, setAutoplay] = useState(true);
  const [progress, setProgress] = useState(0);
  const [cursor, setCursor] = useState({ x: 50, y: 50, click: false });
  const navRefs = useRef<Partial<Record<MockView, HTMLButtonElement | null>>>({});
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Auto-cycle
  useEffect(() => {
    if (!autoplay) return;
    const start = Date.now();
    const tick = setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - start) / STEP_MS) * 100));
    }, 60);
    const next = setTimeout(() => {
      const idx = TOUR.indexOf(view);
      setView(TOUR[(idx + 1) % TOUR.length]);
      setProgress(0);
    }, STEP_MS);
    return () => { clearInterval(tick); clearTimeout(next); };
  }, [view, autoplay]);

  // Cursor animation toward active nav item
  useEffect(() => {
    if (!autoplay) return;
    const target = navRefs.current[view];
    const stage = stageRef.current;
    if (!target || !stage) return;
    const t = target.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const x = ((t.left + t.width / 2 - s.left) / s.width) * 100;
    const y = ((t.top + t.height / 2 - s.top) / s.height) * 100;
    setCursor({ x, y, click: false });
    const c1 = setTimeout(() => setCursor((c) => ({ ...c, click: true })), 700);
    const c2 = setTimeout(() => setCursor((c) => ({ ...c, click: false })), 1100);
    return () => { clearTimeout(c1); clearTimeout(c2); };
  }, [view, autoplay]);

  const onNav = (v: MockView) => { setAutoplay(false); setView(v); setProgress(0); };
  const meta = VIEW_META[view];
  const Comp = meta.Component;

  return (
    <div className="min-h-screen bg-svo-navy flex flex-col" ref={stageRef}>
      {/* Banner */}
      <div className="bg-svo-gold text-svo-navy px-4 py-2 flex items-center justify-between text-sm flex-wrap gap-2 z-30 relative">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="w-4 h-4" />
          Live animated tour of Global Office · sample org "Aurora Labs"
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setAutoplay((a) => !a)} className="h-8 text-svo-navy hover:bg-svo-navy/10">
            {autoplay ? <><Pause className="w-3 h-3 mr-1" /> Pause tour</> : <><Play className="w-3 h-3 mr-1" /> Resume</>}
          </Button>
          <Link to="/">
            <Button size="sm" variant="ghost" className="h-8 text-svo-navy hover:bg-svo-navy/10">
              <ArrowLeft className="w-3 h-3 mr-1" /> Back to site
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="h-8 bg-svo-navy text-svo-gold hover:bg-svo-navy/90 border-none">
              Start free trial
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress */}
      {autoplay && (
        <div className="h-0.5 bg-white/10 relative z-30">
          <div className="absolute left-0 top-0 h-full bg-svo-gold transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Stage */}
      <div className="flex-1 min-h-0 p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-[1280px] h-[720px] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative bg-white">
          <MockupShell
            view={view}
            onNav={onNav}
            navRef={(v, el) => { navRefs.current[v] = el; }}
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
      </div>

      {/* Cursor */}
      {autoplay && (
        <motion.div
          className="pointer-events-none fixed z-50 hidden md:block"
          animate={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <div className="relative">
            <MousePointer2 className="w-5 h-5 text-svo-navy drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" fill="hsl(38 80% 55%)" />
            {cursor.click && (
              <motion.div
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.55 }}
                className="absolute -inset-1 rounded-full bg-svo-gold"
              />
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Demo;