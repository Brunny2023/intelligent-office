import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MousePointer2, Clock, CheckSquare, MessageSquare, BarChart3, Users, Bell, Search, Plus, Send } from "lucide-react";

type Step = {
  cursor: { x: number; y: number };
  click?: boolean;
  view: "dashboard" | "attendance" | "tasks" | "messages";
  caption: string;
  duration: number; // ms
  typing?: string;
};

const script: Step[] = [
  { cursor: { x: 50, y: 50 }, view: "dashboard", caption: "Welcome to your Intelligent Office dashboard", duration: 1400 },
  { cursor: { x: 12, y: 28 }, view: "dashboard", caption: "Navigate to any module instantly", duration: 1200 },
  { cursor: { x: 12, y: 38 }, view: "dashboard", caption: "Let's check Attendance", duration: 700 },
  { cursor: { x: 12, y: 38 }, click: true, view: "dashboard", caption: "Let's check Attendance", duration: 400 },
  { cursor: { x: 50, y: 45 }, view: "attendance", caption: "Live workforce presence — 127 staff online", duration: 1600 },
  { cursor: { x: 78, y: 35 }, view: "attendance", caption: "One-click clock-in with geo-validation", duration: 1200 },
  { cursor: { x: 78, y: 35 }, click: true, view: "attendance", caption: "Clocked in at 09:01 AM", duration: 800 },
  { cursor: { x: 12, y: 48 }, view: "attendance", caption: "Now let's see Execution", duration: 900 },
  { cursor: { x: 12, y: 48 }, click: true, view: "attendance", caption: "Opening Tasks", duration: 400 },
  { cursor: { x: 55, y: 50 }, view: "tasks", caption: "Kanban tasks with AI priority scoring", duration: 1500 },
  { cursor: { x: 88, y: 18 }, view: "tasks", caption: "Add new task in seconds", duration: 1000 },
  { cursor: { x: 88, y: 18 }, click: true, view: "tasks", caption: "Creating task...", duration: 600 },
  { cursor: { x: 12, y: 58 }, view: "tasks", caption: "Time to message the team", duration: 900 },
  { cursor: { x: 12, y: 58 }, click: true, view: "tasks", caption: "Opening Messages", duration: 400 },
  { cursor: { x: 60, y: 75 }, view: "messages", caption: "Real-time team channels", duration: 1300, typing: "Standup in 5 minutes 👋" },
  { cursor: { x: 92, y: 88 }, view: "messages", caption: "Sent.", duration: 700 },
  { cursor: { x: 92, y: 88 }, click: true, view: "messages", caption: "Sent.", duration: 600 },
  { cursor: { x: 50, y: 50 }, view: "messages", caption: "One platform. Your entire company.", duration: 2000 },
];

const DemoModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep(0);
      return;
    }
    const t = setTimeout(() => {
      setStep((s) => (s + 1) % script.length);
    }, script[step].duration);
    return () => clearTimeout(t);
  }, [open, step]);

  const current = script[step];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-svo-navy border-svo-gold/20">
        <DialogTitle className="sr-only">Intelligent Office product demo</DialogTitle>
        <DialogDescription className="sr-only">
          Animated walkthrough of the Intelligent Office platform showing attendance, tasks and messaging modules.
        </DialogDescription>
        <div className="relative aspect-video w-full bg-gradient-to-br from-svo-navy via-svo-navy to-[#0a1428] overflow-hidden">
          {/* Mock browser chrome */}
          <div className="flex items-center gap-2 px-4 h-9 bg-black/30 border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <div className="w-3 h-3 rounded-full bg-green-400/70" />
            </div>
            <div className="flex-1 mx-4 h-5 rounded bg-white/5 border border-white/5 flex items-center px-2 text-[10px] text-white/40">
              acme.intelligent-office.example/{current.view}
            </div>
          </div>

          {/* App layout */}
          <div className="flex h-[calc(100%-2.25rem)]">
            {/* Sidebar */}
            <div className="w-[18%] border-r border-white/5 bg-black/20 p-2 flex flex-col gap-1">
              <div className="flex items-center gap-2 px-2 py-2 mb-2">
                <img src="/favicon.png" alt="" className="w-5 h-5" />
                <span className="text-white text-[10px] font-bold">Intelligent Office</span>
              </div>
              {[
                { icon: BarChart3, label: "Dashboard", v: "dashboard" },
                { icon: Clock, label: "Attendance", v: "attendance" },
                { icon: CheckSquare, label: "Tasks", v: "tasks" },
                { icon: MessageSquare, label: "Messages", v: "messages" },
                { icon: Users, label: "Team", v: "team" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-[10px] transition-colors ${
                    current.view === item.v ? "bg-svo-gold/15 text-svo-gold" : "text-white/50"
                  }`}
                >
                  <item.icon className="w-3 h-3" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Main area */}
            <div className="flex-1 p-4 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.view}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {current.view === "dashboard" && <DashboardView />}
                  {current.view === "attendance" && <AttendanceView />}
                  {current.view === "tasks" && <TasksView />}
                  {current.view === "messages" && <MessagesView typing={current.typing} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Animated cursor */}
          <motion.div
            className="absolute pointer-events-none z-50"
            animate={{ left: `${current.cursor.x}%`, top: `${current.cursor.y}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <MousePointer2 className="w-5 h-5 text-svo-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] -translate-x-1 -translate-y-1" fill="hsl(38 80% 55%)" />
            {current.click && (
              <motion.div
                key={step}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute top-0 left-0 w-6 h-6 rounded-full bg-svo-gold/40 -translate-x-1/2 -translate-y-1/2"
              />
            )}
          </motion.div>

          {/* Caption */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/70 border border-svo-gold/30 backdrop-blur-md">
            <AnimatePresence mode="wait">
              <motion.p
                key={current.caption}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-xs md:text-sm font-medium text-white whitespace-nowrap"
              >
                {current.caption}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress */}
          <div className="absolute top-9 left-0 right-0 h-0.5 bg-white/5">
            <motion.div
              className="h-full bg-svo-gold"
              animate={{ width: `${((step + 1) / script.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DashboardView = () => (
  <div className="grid grid-cols-3 gap-2 h-full">
    {[
      { label: "Active staff", value: "127", icon: Users },
      { label: "Tasks today", value: "48", icon: CheckSquare },
      { label: "Efficiency", value: "94%", icon: BarChart3 },
    ].map((s) => (
      <div key={s.label} className="rounded-lg bg-white/5 border border-white/5 p-3">
        <s.icon className="w-3 h-3 text-svo-gold mb-2" />
        <div className="text-white text-lg font-bold">{s.value}</div>
        <div className="text-white/40 text-[9px]">{s.label}</div>
      </div>
    ))}
    <div className="col-span-3 rounded-lg bg-white/5 border border-white/5 p-3 flex-1">
      <div className="text-white/60 text-[10px] mb-2">Team activity</div>
      <div className="space-y-1.5">
        {["Sarah clocked in", "Mike completed 'Q2 Report'", "Ana sent message in #design", "Tom requested leave"].map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px] text-white/70">
            <div className="w-1 h-1 rounded-full bg-svo-gold" />
            {a}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AttendanceView = () => (
  <div className="space-y-2 h-full">
    <div className="flex items-center justify-between">
      <div className="text-white text-sm font-bold">Attendance — Today</div>
      <div className="px-3 py-1 rounded bg-svo-gold text-svo-navy text-[10px] font-semibold">Clock In</div>
    </div>
    <div className="grid grid-cols-4 gap-2">
      {["Present 119", "Late 8", "On leave 4", "Remote 42"].map((s) => (
        <div key={s} className="rounded bg-white/5 border border-white/5 px-2 py-2 text-[10px] text-white/70">{s}</div>
      ))}
    </div>
    <div className="rounded-lg bg-white/5 border border-white/5 p-2">
      <div className="text-white/60 text-[10px] mb-1.5">Recent check-ins</div>
      {["Sarah Chen — 09:01", "Marcus Lee — 09:03", "Ana Costa — 09:04", "Tom Park — 09:07"].map((n) => (
        <div key={n} className="flex items-center justify-between py-1 text-[10px] border-t border-white/5">
          <span className="text-white/80">{n}</span>
          <span className="text-green-400">on time</span>
        </div>
      ))}
    </div>
  </div>
);

const TasksView = () => (
  <div className="h-full">
    <div className="flex items-center justify-between mb-2">
      <div className="text-white text-sm font-bold">Tasks</div>
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-svo-gold text-svo-navy text-[10px] font-semibold">
        <Plus className="w-2.5 h-2.5" /> New
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[
        { c: "To Do", items: ["Review Q2 OKRs", "Brief design team"], color: "text-white/60" },
        { c: "In Progress", items: ["Q2 financial report", "Hiring round"], color: "text-blue-300" },
        { c: "Done", items: ["Sprint review", "Onboard 3 staff"], color: "text-green-300" },
      ].map((col) => (
        <div key={col.c} className="rounded-lg bg-white/5 border border-white/5 p-2">
          <div className={`text-[10px] mb-2 font-semibold ${col.color}`}>{col.c}</div>
          {col.items.map((i) => (
            <div key={i} className="rounded bg-white/5 p-1.5 mb-1.5 text-[9px] text-white/80">{i}</div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const MessagesView = ({ typing }: { typing?: string }) => (
  <div className="flex h-full gap-2">
    <div className="w-1/3 rounded-lg bg-white/5 border border-white/5 p-2">
      <div className="text-[10px] text-white/40 mb-1.5">Channels</div>
      {["# general", "# design", "# leadership", "# random"].map((c, i) => (
        <div key={c} className={`px-1.5 py-1 rounded text-[10px] ${i === 0 ? "bg-svo-gold/15 text-svo-gold" : "text-white/60"}`}>{c}</div>
      ))}
    </div>
    <div className="flex-1 rounded-lg bg-white/5 border border-white/5 p-2 flex flex-col">
      <div className="text-white text-xs font-bold mb-2"># general</div>
      <div className="flex-1 space-y-1.5 overflow-hidden">
        <div className="text-[10px]"><span className="text-svo-gold font-semibold">Sarah:</span> <span className="text-white/80">Morning everyone!</span></div>
        <div className="text-[10px]"><span className="text-svo-gold font-semibold">Marcus:</span> <span className="text-white/80">Standup at 10?</span></div>
        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px]">
            <span className="text-svo-gold font-semibold">You:</span> <span className="text-white/80">{typing}</span>
          </motion.div>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded bg-white/5 border border-white/10">
        <div className="flex-1 text-[10px] text-white/40">{typing || "Type a message..."}</div>
        <Send className="w-3 h-3 text-svo-gold" />
      </div>
    </div>
  </div>
);

export default DemoModal;