import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Clock, CheckSquare, MessageSquare, BarChart3,
  Home, Users, Megaphone, Brain, Crown, Send, Plus,
  TrendingUp, AlertTriangle, Sparkles, ArrowLeft, Search, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------- Fixture data (no backend calls) ----------
const TEAM = [
  { id: "u1", name: "Sarah Chen", role: "Head of Design", status: "online", initials: "SC" },
  { id: "u2", name: "Marcus Lee", role: "Engineering Lead", status: "online", initials: "ML" },
  { id: "u3", name: "Ana Costa", role: "Marketing", status: "online", initials: "AC" },
  { id: "u4", name: "Tom Park", role: "Finance", status: "away", initials: "TP" },
  { id: "u5", name: "Jade Wright", role: "People Ops", status: "online", initials: "JW" },
  { id: "u6", name: "Daniel Osei", role: "Sales", status: "offline", initials: "DO" },
];

const ATTENDANCE = [
  { name: "Sarah Chen", time: "09:01", state: "On time" },
  { name: "Marcus Lee", time: "09:03", state: "On time" },
  { name: "Ana Costa", time: "09:04", state: "On time" },
  { name: "Tom Park", time: "09:18", state: "Late" },
  { name: "Jade Wright", time: "09:05", state: "On time" },
];

const initialTasks = {
  todo: [
    { id: "t1", title: "Review Q2 OKRs", owner: "Sarah", priority: "High" },
    { id: "t2", title: "Brief design team", owner: "Marcus", priority: "Med" },
  ],
  doing: [
    { id: "t3", title: "Q2 financial report", owner: "Tom", priority: "High" },
    { id: "t4", title: "Hiring round — engineering", owner: "Jade", priority: "Med" },
  ],
  done: [
    { id: "t5", title: "Sprint review", owner: "Marcus", priority: "Med" },
    { id: "t6", title: "Onboard 3 new staff", owner: "Jade", priority: "Low" },
  ],
};

const initialMessages = [
  { id: "m1", who: "Sarah", text: "Morning everyone 👋", mine: false },
  { id: "m2", who: "Marcus", text: "Standup at 10? Got a quick demo to share.", mine: false },
  { id: "m3", who: "Ana", text: "Will join from the road, audio only.", mine: false },
];

const NAV = [
  { icon: Home, label: "Dashboard", v: "dashboard" },
  { icon: Clock, label: "Attendance", v: "attendance" },
  { icon: CheckSquare, label: "Execution", v: "tasks" },
  { icon: MessageSquare, label: "Messages", v: "messages" },
  { icon: Users, label: "Team", v: "team" },
  { icon: Brain, label: "AI Insights", v: "ai" },
  { icon: Crown, label: "Executive", v: "exec" },
  { icon: Megaphone, label: "Announcements", v: "announcements" },
] as const;

type View = typeof NAV[number]["v"];

const Demo = () => {
  const [view, setView] = useState<View>("dashboard");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Demo banner */}
      <div className="bg-svo-gold text-svo-navy px-4 py-2 flex items-center justify-between text-sm flex-wrap gap-2">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="w-4 h-4" />
          You're viewing a live, read-only demo of Global Office with sample data.
        </div>
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button size="sm" variant="ghost" className="h-8 text-svo-navy hover:bg-svo-navy/10">
              <ArrowLeft className="w-3 h-3 mr-1" /> Back to site
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="h-8 bg-svo-navy text-svo-gold hover:bg-svo-navy/90">
              Start free trial
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 hidden md:flex flex-col bg-sidebar border-r border-sidebar-border">
          <div className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border">
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-sidebar-foreground">Acme Corp</p>
              <p className="text-[10px] text-sidebar-foreground/60">Demo workspace</p>
            </div>
          </div>
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
            {NAV.map((item) => (
              <button
                key={item.v}
                onClick={() => setView(item.v)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                  view === item.v
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-sidebar-border">
            <p className="text-xs font-medium text-sidebar-foreground">Demo User</p>
            <p className="text-[10px] text-sidebar-foreground/50">Executive</p>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto">
          {/* Topbar */}
          <div className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 bg-background/80 backdrop-blur z-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="md:hidden font-semibold text-foreground">Acme Corp</span>
              <span className="hidden md:inline">Acme Corp /</span>
              <span className="capitalize text-foreground font-medium">{view}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground">
                <Search className="w-3 h-3" /> Search…
              </div>
              <Bell className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Mobile nav pills */}
          <div className="md:hidden flex gap-2 overflow-x-auto px-4 py-3 border-b border-border">
            {NAV.map((item) => (
              <button
                key={item.v}
                onClick={() => setView(item.v)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5",
                  view === item.v ? "bg-svo-gold text-svo-navy font-semibold" : "bg-muted text-muted-foreground"
                )}
              >
                <item.icon className="w-3 h-3" />
                {item.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="p-4 md:p-6"
            >
              {view === "dashboard" && <DashboardView />}
              {view === "attendance" && <AttendanceView />}
              {view === "tasks" && <TasksView />}
              {view === "messages" && <MessagesView />}
              {view === "team" && <TeamView />}
              {view === "ai" && <AIView />}
              {view === "exec" && <ExecView />}
              {view === "announcements" && <AnnouncementsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

// ---------- Views ----------

const StatCard = ({ icon: Icon, label, value, sub }: any) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="flex items-center justify-between mb-3">
      <div className="w-9 h-9 rounded-lg bg-svo-gold/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-svo-gold" />
      </div>
      <span className="text-[10px] text-green-500 font-semibold">{sub}</span>
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

const DashboardView = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Good morning, Demo 👋</h1>
      <p className="text-sm text-muted-foreground">Here's what's happening across Acme Corp today.</p>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard icon={Users} label="Active staff" value="127" sub="+4 vs yesterday" />
      <StatCard icon={CheckSquare} label="Tasks today" value="48" sub="92% on track" />
      <StatCard icon={BarChart3} label="Efficiency" value="94%" sub="+2% WoW" />
      <StatCard icon={TrendingUp} label="Health Score" value="A−" sub="Stable" />
    </div>
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Team activity</h3>
        <div className="space-y-2">
          {[
            "Sarah Chen clocked in at 09:01",
            "Marcus Lee completed 'Sprint review'",
            "Ana Costa posted in #design-launch",
            "Tom Park requested 2 days leave",
            "Jade Wright onboarded 3 new staff",
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-sm py-2 border-b border-border last:border-0">
              <div className="w-1.5 h-1.5 rounded-full bg-svo-gold" />
              <span className="text-foreground">{a}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Brain className="w-4 h-4 text-svo-gold" /> AI Insight</h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-600 font-medium mb-1"><AlertTriangle className="w-3.5 h-3.5" /> Burnout risk</div>
            <p className="text-xs text-muted-foreground">Engineering averaged 53h last week. Consider redistributing.</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-600 font-medium mb-1"><TrendingUp className="w-3.5 h-3.5" /> Velocity up</div>
            <p className="text-xs text-muted-foreground">Design ships 22% faster after kanban switch.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AttendanceView = () => {
  const [clocked, setClocked] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground">Today · {new Date().toLocaleDateString()}</p>
        </div>
        <Button
          onClick={() => setClocked((s) => !s)}
          className={cn(clocked ? "bg-muted text-foreground" : "bg-svo-gold text-svo-navy hover:bg-svo-gold/90")}
        >
          <Clock className="w-4 h-4 mr-2" />
          {clocked ? "Clock Out" : "Clock In"}
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Present", v: "119", c: "text-green-500" },
          { l: "Late", v: "8", c: "text-amber-500" },
          { l: "On leave", v: "4", c: "text-blue-500" },
          { l: "Remote", v: "42", c: "text-purple-500" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card p-4">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-semibold">Recent check-ins</div>
        {ATTENDANCE.map((a) => (
          <div key={a.name} className="px-4 py-3 flex items-center justify-between border-b border-border last:border-0">
            <div>
              <div className="text-sm font-medium">{a.name}</div>
              <div className="text-xs text-muted-foreground">Checked in at {a.time}</div>
            </div>
            <span className={cn("text-xs font-semibold", a.state === "Late" ? "text-amber-500" : "text-green-500")}>{a.state}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TasksView = () => {
  const [cols, setCols] = useState(initialTasks);
  const addTask = () => {
    const title = `New task ${cols.todo.length + 1}`;
    setCols({ ...cols, todo: [...cols.todo, { id: crypto.randomUUID(), title, owner: "You", priority: "Med" }] });
  };
  const move = (id: string, from: keyof typeof cols, to: keyof typeof cols) => {
    const task = cols[from].find((t) => t.id === id);
    if (!task) return;
    setCols({ ...cols, [from]: cols[from].filter((t) => t.id !== id), [to]: [...cols[to], task] });
  };
  const columns: Array<{ key: keyof typeof cols; label: string; next?: keyof typeof cols; prev?: keyof typeof cols }> = [
    { key: "todo", label: "To Do", next: "doing" },
    { key: "doing", label: "In Progress", next: "done", prev: "todo" },
    { key: "done", label: "Done", prev: "doing" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Execution</h1>
          <p className="text-sm text-muted-foreground">Kanban board · click a task to move it forward</p>
        </div>
        <Button onClick={addTask} className="bg-svo-gold text-svo-navy hover:bg-svo-gold/90">
          <Plus className="w-4 h-4 mr-1" /> New Task
        </Button>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {columns.map((col) => (
          <div key={col.key} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{cols[col.key].length}</span>
            </div>
            <div className="space-y-2 min-h-[80px]">
              {cols[col.key].map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  onClick={() => col.next && move(t.id, col.key, col.next)}
                  className="p-3 rounded-lg bg-background border border-border hover:border-svo-gold/40 cursor-pointer transition-colors"
                >
                  <div className="text-sm font-medium mb-1">{t.title}</div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{t.owner}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-semibold",
                      t.priority === "High" ? "bg-red-500/10 text-red-500" :
                      t.priority === "Med" ? "bg-amber-500/10 text-amber-500" : "bg-muted"
                    )}>{t.priority}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MessagesView = () => {
  const [channel, setChannel] = useState("general");
  const [msgs, setMsgs] = useState(initialMessages);
  const [input, setInput] = useState("");
  const send = () => {
    if (!input.trim()) return;
    setMsgs([...msgs, { id: crypto.randomUUID(), who: "You", text: input, mine: true }]);
    setInput("");
  };
  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      <div className="w-48 hidden md:block rounded-xl border border-border bg-card p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Channels</div>
        {["general", "design", "leadership", "random"].map((c) => (
          <button
            key={c}
            onClick={() => setChannel(c)}
            className={cn(
              "w-full text-left px-2 py-1.5 rounded text-sm",
              channel === c ? "bg-svo-gold/15 text-svo-gold font-semibold" : "text-muted-foreground hover:bg-muted"
            )}
          >
            # {c}
          </button>
        ))}
      </div>
      <div className="flex-1 rounded-xl border border-border bg-card flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-semibold"># {channel}</div>
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {msgs.map((m) => (
            <div key={m.id} className={cn("flex flex-col", m.mine ? "items-end" : "items-start")}>
              <span className="text-[10px] text-muted-foreground mb-0.5">{m.who}</span>
              <div className={cn(
                "px-3 py-2 rounded-2xl max-w-[75%] text-sm",
                m.mine ? "bg-svo-gold text-svo-navy" : "bg-muted"
              )}>{m.text}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-border p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Message # ${channel}`}
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-svo-gold"
          />
          <Button onClick={send} size="sm" className="bg-svo-gold text-svo-navy hover:bg-svo-gold/90">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const TeamView = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Team</h1>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {TEAM.map((u) => (
        <div key={u.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-svo-gold/15 flex items-center justify-center text-svo-gold font-bold">
              {u.initials}
            </div>
            <span className={cn(
              "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card",
              u.status === "online" ? "bg-green-500" : u.status === "away" ? "bg-amber-500" : "bg-muted-foreground"
            )} />
          </div>
          <div>
            <div className="font-medium text-sm">{u.name}</div>
            <div className="text-xs text-muted-foreground">{u.role}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AIView = () => (
  <div className="space-y-4">
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="w-6 h-6 text-svo-gold" /> AI Insights</h1>
      <p className="text-sm text-muted-foreground">Predictive alerts across your organization.</p>
    </div>
    <div className="grid md:grid-cols-2 gap-3">
      {[
        { t: "Hiring gap detected", d: "Engineering velocity will drop 18% by Q3 without 2 new hires.", c: "amber" },
        { t: "Retention risk", d: "3 high-performers show declining engagement signals this month.", c: "red" },
        { t: "Budget on track", d: "Q2 spend 6% under plan. Suggest reallocating to marketing.", c: "green" },
        { t: "Process bottleneck", d: "Approval workflow averages 4.2 days. Suggest auto-route.", c: "amber" },
      ].map((i) => (
        <div key={i.t} className={cn(
          "rounded-xl border p-4",
          i.c === "red" ? "border-red-500/30 bg-red-500/5" :
          i.c === "amber" ? "border-amber-500/30 bg-amber-500/5" :
          "border-green-500/30 bg-green-500/5"
        )}>
          <div className="font-semibold text-sm mb-1">{i.t}</div>
          <div className="text-xs text-muted-foreground">{i.d}</div>
        </div>
      ))}
    </div>
  </div>
);

const ExecView = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Executive Control Center</h1>
    <div className="grid md:grid-cols-3 gap-3">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="text-xs text-muted-foreground mb-2">Organizational Health</div>
        <div className="text-5xl font-bold text-svo-gold">A−</div>
        <div className="text-xs text-muted-foreground mt-2">Weighted score across 7 dimensions</div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="text-xs text-muted-foreground mb-2">Revenue (MTD)</div>
        <div className="text-3xl font-bold">$842K</div>
        <div className="text-xs text-green-500 mt-2">+12% vs target</div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="text-xs text-muted-foreground mb-2">Headcount</div>
        <div className="text-3xl font-bold">127</div>
        <div className="text-xs text-muted-foreground mt-2">8 hiring · 2 open reqs</div>
      </div>
    </div>
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-sm font-semibold mb-3">Department snapshots</div>
      {[
        { d: "Engineering", h: 32, e: 88 },
        { d: "Design", h: 14, e: 94 },
        { d: "Sales", h: 22, e: 81 },
        { d: "Marketing", h: 12, e: 90 },
      ].map((r) => (
        <div key={r.d} className="grid grid-cols-3 py-2 border-b border-border last:border-0 text-sm">
          <span>{r.d}</span>
          <span className="text-muted-foreground">{r.h} people</span>
          <span className="text-right font-semibold">{r.e}% efficient</span>
        </div>
      ))}
    </div>
  </div>
);

const AnnouncementsView = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Announcements</h1>
    {[
      { t: "Q2 All-Hands this Friday", b: "Join us at 3pm for the quarterly review. Drinks after.", by: "Sarah Chen" },
      { t: "New hybrid policy live", b: "Effective Monday: 3 days in office, 2 remote. See HR for details.", by: "Jade Wright" },
      { t: "Partner launch: Vertex Labs", b: "We're now integrated with Vertex via Partner Connect.", by: "Marcus Lee" },
    ].map((a) => (
      <div key={a.t} className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold">{a.t}</h3>
          <span className="text-[10px] text-muted-foreground">2h ago</span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{a.b}</p>
        <span className="text-xs text-svo-gold">— {a.by}</span>
      </div>
    ))}
  </div>
);

export default Demo;