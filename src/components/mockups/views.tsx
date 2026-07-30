import { motion } from "framer-motion";
import {
  Users, Clock, CheckSquare, TrendingUp, BarChart3, Brain, Target,
  AlertTriangle, Sparkles, Plus, Send, Video, Megaphone, Activity,
  Workflow, Briefcase, DollarSign, Building2, Network, Play, ArrowUpRight,
  MapPin, Calendar, FileText, Crown, Shield,
  Home, MessageSquare,
} from "lucide-react";
import { StatTile, Card, MockAvatar, MockGauge, MockTrend } from "./shell";
import type { MockView } from "./shell";
import { cn } from "@/lib/utils";

/* ---------- Shared seed data ---------- */
const TEAM = [
  { n: "Sarah Chen",   r: "Head of Design",      i: "SC", c: "bg-rose-500/15 text-rose-700",   s: "on" },
  { n: "Marcus Lee",   r: "Engineering Lead",    i: "ML", c: "bg-blue-500/15 text-blue-700",   s: "on" },
  { n: "Ana Costa",    r: "Marketing",           i: "AC", c: "bg-emerald-500/15 text-emerald-700", s: "on" },
  { n: "Tom Park",     r: "Finance",             i: "TP", c: "bg-amber-500/15 text-amber-700", s: "away" },
  { n: "Jade Wright",  r: "People Ops",          i: "JW", c: "bg-purple-500/15 text-purple-700", s: "on" },
  { n: "Daniel Osei",  r: "Sales",               i: "DO", c: "bg-cyan-500/15 text-cyan-700",   s: "off" },
];

const HEALTH_TREND = [
  { label: "M", value: 78, tasks: 62 },
  { label: "T", value: 81, tasks: 68 },
  { label: "W", value: 79, tasks: 71 },
  { label: "T", value: 84, tasks: 74 },
  { label: "F", value: 86, tasks: 80 },
  { label: "S", value: 85, tasks: 78 },
  { label: "S", value: 87, tasks: 84 },
];

const PRESENCE_TREND = [
  { label: "Jul 22", value: 38 }, { label: "23", value: 41 }, { label: "24", value: 40 },
  { label: "25", value: 43 }, { label: "26", value: 39 }, { label: "27", value: 44 },
  { label: "28", value: 42 },
];

/* =====================================================================
   DASHBOARD
===================================================================== */
export const DashboardView = () => (
  <>
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatTile icon={TrendingUp} value="87%" label="Health Score" tone="gold" progress={87} delta="+4 pts this week" />
      <StatTile icon={Users}      value="42/46" label="Present Today" tone="green" progress={91} delta="91% attendance" />
      <StatTile icon={CheckSquare} value="94%"  label="Task Completion" tone="blue" progress={94} delta="+6% vs last sprint" />
      <StatTile icon={BarChart3}  value="A−"   label="KPI Achievement" tone="violet" progress={86} delta="86% of targets" />
    </div>

    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card title="Organizational Health — 7 days" icon={TrendingUp} className="col-span-2">
        <MockTrend data={HEALTH_TREND} dataKey="value" secondKey="tasks" tone="gold" secondTone="blue" height={168} />
      </Card>
      <Card title="Performance" icon={BarChart3}>
        <div className="grid grid-cols-2 gap-3 place-items-center">
          <MockGauge value={94} label="Tasks" tone="blue" size={86} />
          <MockGauge value={91} label="Attendance" tone="gold" size={86} />
          <MockGauge value={86} label="KPIs" tone="green" size={86} />
          <MockGauge value={82} label="Engagement" tone="violet" size={86} />
        </div>
      </Card>
    </div>

    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card title="Team Activity" icon={Activity} className="col-span-2">
        <div className="divide-y divide-slate-100">
          {[
            { u: "Sarah Chen",  t: "clocked in at 09:01",                    ago: "2m" },
            { u: "Marcus Lee",  t: "shipped 'Payment gateway v2'",           ago: "14m" },
            { u: "Ana Costa",   t: "posted in #brand-launch",                ago: "28m" },
            { u: "Jade Wright", t: "onboarded 2 new engineers",              ago: "1h" },
            { u: "Tom Park",    t: "approved Q3 budget for Marketing",       ago: "1h" },
          ].map((r, idx) => (
            <div key={idx} className="flex items-center gap-3 py-2.5 text-[13px]">
              <MockAvatar name={r.u} size={30} />
              <div className="flex-1"><span className="font-semibold">{r.u}</span> <span className="text-slate-500">{r.t}</span></div>
              <span className="text-[10px] text-slate-400">{r.ago}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="AI Insight" icon={Sparkles}>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-amber-500/[0.08] border border-amber-500/25">
            <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-[11px] mb-1">
              <AlertTriangle className="w-3 h-3" /> Burnout risk
            </div>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">Engineering averaged 53h last week. Redistribute?</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/25">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px] mb-1">
              <TrendingUp className="w-3 h-3" /> Velocity up
            </div>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">Design ships 22% faster after kanban switch.</p>
          </div>
        </div>
      </Card>
    </div>

  </>
);

/* =====================================================================
   ATTENDANCE
===================================================================== */
export const AttendanceView = () => (
  <>
    <div className="grid grid-cols-2 gap-4 mb-6">
      <Card>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500 mb-3">
          <Clock className="w-3.5 h-3.5" /> Clock In / Out
        </div>
        <div className="text-[42px] font-bold text-slate-900 tabular-nums">09:47<span className="text-lg text-slate-400 font-normal ml-1">AM</span></div>
        <div className="text-xs text-slate-500 mb-4">Tuesday, 28 July · Aurora HQ · IP validated ✓</div>
        <button className="w-full py-3 rounded-lg bg-svo-gold text-svo-navy font-bold text-sm inline-flex items-center justify-center gap-2 shadow-sm">
          <Clock className="w-4 h-4" /> Clock In
        </button>
      </Card>
      <Card>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500 mb-3">
          <Calendar className="w-3.5 h-3.5" /> Request Leave
        </div>
        <div className="space-y-2 text-[13px]">
          <div><label className="block text-xs text-slate-500 mb-1">Leave Type</label>
            <div className="px-3 py-2 rounded-md border border-slate-200 bg-slate-50">Annual Leave</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-xs text-slate-500 mb-1">From</label>
              <div className="px-3 py-2 rounded-md border border-slate-200 bg-slate-50">Aug 04</div>
            </div>
            <div><label className="block text-xs text-slate-500 mb-1">To</label>
              <div className="px-3 py-2 rounded-md border border-slate-200 bg-slate-50">Aug 08</div>
            </div>
          </div>
          <button className="w-full py-2.5 rounded-lg bg-svo-navy text-white text-sm font-semibold mt-1">Submit Request</button>
        </div>
      </Card>
    </div>
    <Card title="Presence Trend — 7 days" icon={TrendingUp} className="mb-6">
      <MockTrend data={PRESENCE_TREND} dataKey="value" tone="green" height={150} />
    </Card>
    <Card title="Today's Presence" icon={Users}>
      <div className="grid grid-cols-3 gap-3">
        {TEAM.map((u) => (
          <div key={u.n} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
            <MockAvatar name={u.n} size={36} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{u.n}</div>
              <div className="text-[11px] text-slate-500 truncate">{u.r}</div>
            </div>
            <span className={cn("w-2 h-2 rounded-full",
              u.s === "on" ? "bg-emerald-500" : u.s === "away" ? "bg-amber-500" : "bg-slate-300")} />
          </div>
        ))}
      </div>
    </Card>
  </>
);

/* =====================================================================
   JOB PLANNING
===================================================================== */
export const PlanningView = () => (
  <>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatTile icon={Target} value="12" label="Active Targets" tone="gold" />
      <StatTile icon={CheckSquare} value="8" label="On Track" tone="green" />
      <StatTile icon={AlertTriangle} value="3" label="At Risk" tone="red" />
    </div>
    <Card title="Quarterly Targets" icon={Target}>
      <div className="space-y-4">
        {[
          { t: "Ship v3 payments platform",       o: "Marcus Lee",   p: 78, tone: "bg-emerald-500" },
          { t: "Reach 500 paying customers",      o: "Daniel Osei",  p: 62, tone: "bg-svo-gold" },
          { t: "Publish brand relaunch",          o: "Sarah Chen",   p: 91, tone: "bg-emerald-500" },
          { t: "Cut infra spend by 20%",          o: "Marcus Lee",   p: 34, tone: "bg-rose-500" },
          { t: "Close Series A round",            o: "Alex Rivera",  p: 55, tone: "bg-svo-gold" },
          { t: "Hire 4 senior engineers",         o: "Jade Wright",  p: 45, tone: "bg-svo-gold" },
        ].map((r) => (
          <div key={r.t}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[13px] font-medium">{r.t}</div>
              <div className="text-[11px] text-slate-500">{r.o} · {r.p}%</div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className={cn("h-full rounded-full", r.tone)} style={{ width: `${r.p}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  </>
);

/* =====================================================================
   EXECUTION (Kanban)
===================================================================== */
export const TasksView = () => {
  const cols = [
    { l: "To Do",       n: 5, c: "text-white", bar: "bg-[hsl(214_84%_56%)]",
      items: [{t:"Draft Q3 hiring plan",o:"JW",p:"High"},{t:"Prep board deck",o:"AR",p:"High"},{t:"Redesign onboarding email",o:"AC",p:"Med"}] },
    { l: "In Progress", n: 4, c: "text-[#4A3A00]", bar: "bg-[hsl(38_88%_60%)]",
      items: [{t:"Payment gateway v2",o:"ML",p:"High"},{t:"Series A model",o:"TP",p:"High"},{t:"Trust Center v1",o:"SC",p:"Med"}] },
    { l: "In Review",   n: 2, c: "text-white", bar: "bg-[hsl(152_48%_50%)]",
      items: [{t:"Terms of Service update",o:"JW",p:"Med"},{t:"Security audit report",o:"ML",p:"High"}] },
    { l: "Done",        n: 8, c: "text-white", bar: "bg-[hsl(8_78%_65%)]",
      items: [{t:"Sprint 24 retro",o:"ML",p:"Low"},{t:"Onboard 2 engineers",o:"JW",p:"Med"},{t:"Q2 all-hands recap",o:"AR",p:"Low"}] },
  ];
  return (
    <div className="grid grid-cols-4 gap-4">
      {cols.map((col) => (
        <div key={col.l} className="rounded-xl bg-white border border-slate-200/70 shadow-sm overflow-hidden">
          <div className={cn("flex items-center justify-between px-3 py-2.5", col.bar)}>
            <span className={cn("text-xs font-bold tracking-wide", col.c)}>{col.l}</span>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full bg-white/25 font-semibold", col.c)}>{col.n}</span>
          </div>
          <div className="space-y-2 p-3">
            {col.items.map((t, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[12.5px] font-medium mb-2 leading-snug">{t.t}</div>
                <div className="flex items-center justify-between text-[10px]">
                  <MockAvatar name={t.o} size={22} />
                  <span className={cn("px-1.5 py-0.5 rounded-full font-semibold",
                    t.p === "High" ? "bg-rose-500/15 text-rose-700" :
                    t.p === "Med"  ? "bg-amber-500/15 text-amber-700" : "bg-slate-200 text-slate-600")}>{t.p}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* =====================================================================
   MESSAGES
===================================================================== */
export const MessagesView = () => (
  <div className="grid grid-cols-[220px_1fr] gap-4 h-[520px]">
    <Card className="!p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 px-2 mb-2">Channels</div>
      {["general","brand-launch","engineering","leadership","random"].map((c, i) => (
        <div key={c} className={cn("px-2 py-1.5 rounded text-sm mb-0.5",
          i === 1 ? "bg-svo-gold/15 text-svo-navy font-semibold" : "text-slate-600 hover:bg-slate-50")}># {c}</div>
      ))}
      <div className="text-[10px] uppercase tracking-wider text-slate-400 px-2 mt-4 mb-2">Direct</div>
      {TEAM.slice(0,4).map((u)=>(
        <div key={u.n} className="px-2 py-1.5 rounded text-sm text-slate-600 flex items-center gap-2">
          <MockAvatar name={u.n} size={22} />
          <span className="truncate">{u.n}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto" />
        </div>
      ))}
    </Card>
    <Card className="!p-0 flex flex-col overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold"># brand-launch <span className="text-xs text-slate-400 font-normal ml-2">6 members</span></div>
      <div className="flex-1 p-5 space-y-4 overflow-hidden bg-slate-50/40">
        {[
          { u: TEAM[0], m: "Morning team — shipping the new landing at noon 🚀", side: "l" },
          { u: TEAM[1], m: "Backend is warmed up. Cache primed. Green across the board.", side: "l" },
          { u: TEAM[2], m: "Press release scheduled for 12:05. Analytics dashboard is live.", side: "l" },
          { u: null,    m: "Perfect. Let's do it. 🎯", side: "r" },
        ].map((r,i) => (
          <div key={i} className={cn("flex gap-2.5", r.side === "r" && "flex-row-reverse")}>
            <MockAvatar name={r.u ? r.u.n : "Alex Rivera"} size={28} />
            <div className={cn("max-w-[70%]")}>
              <div className="text-[10px] text-slate-500 mb-0.5">{r.u ? r.u.n : "Alex Rivera"} · 09:{40+i}</div>
              <div className={cn("px-3 py-2 rounded-2xl text-[13px]",
                r.side === "r" ? "bg-svo-navy text-white rounded-tr-sm" : "bg-white border border-slate-100 rounded-tl-sm")}>{r.m}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 p-3 flex gap-2">
        <div className="flex-1 px-3 py-2 rounded-lg bg-slate-50 text-sm text-slate-400 border border-slate-200">Message # brand-launch…</div>
        <button className="px-3 py-2 rounded-lg bg-svo-gold text-svo-navy"><Send className="w-4 h-4" /></button>
      </div>
    </Card>
  </div>
);

/* =====================================================================
   MEETINGS
===================================================================== */
export const MeetingsView = () => (
  <>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card className="!p-4 border-svo-gold/40 bg-gradient-to-br from-svo-gold/10 to-white">
        <div className="flex items-center gap-2 text-svo-gold text-xs font-bold mb-3"><Video className="w-4 h-4" /> Start Instant Meeting</div>
        <div className="text-[11px] text-slate-600 mb-4">Recording, transcription and AI summary run automatically.</div>
        <button className="w-full py-2 rounded-lg bg-svo-navy text-svo-gold text-sm font-semibold">Launch Room</button>
      </Card>
      <Card className="!p-4">
        <div className="flex items-center gap-2 text-slate-900 text-xs font-bold mb-3"><Sparkles className="w-4 h-4 text-svo-gold" /> AI Transcription</div>
        <div className="text-[11px] text-slate-600">Real-time speaker-attributed captions in 40+ languages.</div>
      </Card>
      <Card className="!p-4">
        <div className="flex items-center gap-2 text-slate-900 text-xs font-bold mb-3"><Brain className="w-4 h-4 text-svo-gold" /> AI Meeting Intelligence</div>
        <div className="text-[11px] text-slate-600">Auto-extracted decisions, action items, sentiment.</div>
      </Card>
    </div>
    <Card title="Recent Meetings" icon={Video}>
      <div className="divide-y divide-slate-100">
        {[
          { t: "Weekly Leadership Sync",       d: "Today · 09:00", n: 6, s: "Series A milestones · Q3 hiring plan" },
          { t: "Product ↔ Design Review",     d: "Yesterday · 15:30", n: 4, s: "Approved new onboarding · 3 action items" },
          { t: "Investor Update — Vertex VC", d: "Mon · 11:00", n: 3, s: "Follow-up: send financial model + trust report" },
        ].map((m) => (
          <div key={m.t} className="py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-svo-gold/15 text-svo-gold flex items-center justify-center"><Video className="w-4 h-4" /></div>
            <div className="flex-1"><div className="text-[13px] font-semibold">{m.t}</div>
              <div className="text-[11px] text-slate-500">{m.d} · {m.n} attendees · <span className="text-svo-gold font-medium">{m.s}</span></div>
            </div>
            <button className="text-[11px] px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1">Summary <ArrowUpRight className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </Card>
  </>
);

/* =====================================================================
   ANNOUNCEMENTS
===================================================================== */
export const AnnouncementsView = () => (
  <>
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatTile icon={Megaphone} value="24" label="Total Broadcasts" tone="gold" />
      <StatTile icon={Users}     value="46/46" label="Reach" tone="green" />
      <StatTile icon={CheckSquare} value="97%" label="Avg. Read Rate" tone="blue" />
      <StatTile icon={Activity}  value="3" label="Requires Action" tone="red" />
    </div>
    <div className="space-y-3">
      {[
        { t: "Series A closed — welcome our new lead investor", by: "Alex Rivera · Executive", when: "2h ago", body: "Aurora Labs has closed its $18M Series A led by Vertex VC. All-hands celebration Friday at 4pm.", r: 44, tot: 46, pri: "high" },
        { t: "New hybrid policy takes effect Aug 1", by: "Jade Wright · People Ops", when: "1d ago", body: "3 days in office (Tue/Wed/Thu), 2 flexible remote. Meeting rooms bookable via /meetings.", r: 42, tot: 46, pri: "med" },
        { t: "Product v3 launch — external comms embargo lifted", by: "Ana Costa · Marketing", when: "2d ago", body: "You may now share the launch post publicly. Press kit is in Documents › Launch › v3.", r: 46, tot: 46, pri: "med" },
      ].map((a) => (
        <Card key={a.t}>
          <div className="flex items-start gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
              a.pri === "high" ? "bg-svo-gold text-svo-navy" : "bg-slate-100 text-slate-600")}>
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[14px] font-semibold">{a.t}</div>
                <div className="text-[10px] text-slate-400">{a.when}</div>
              </div>
              <div className="text-[11px] text-slate-500 mb-2">{a.by}</div>
              <p className="text-[13px] text-slate-700 leading-relaxed mb-2">{a.body}</p>
              <div className="text-[11px] text-svo-gold font-semibold">{a.r}/{a.tot} read</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </>
);

/* =====================================================================
   ACTIVITY LOG
===================================================================== */
export const ActivityView = () => (
  <Card title="System Activity" icon={Activity}>
    <div className="divide-y divide-slate-100">
      {[
        { u:"Marcus Lee", a:"deployed", o:"payments-service v2.3.1", t:"09:47", tag:"deploy" },
        { u:"Sarah Chen", a:"approved", o:"Brand identity v3 for external release", t:"09:31", tag:"approve" },
        { u:"Alex Rivera", a:"signed", o:"NDA · Vertex VC diligence packet", t:"09:12", tag:"signature" },
        { u:"Jade Wright", a:"invited", o:"3 members to # engineering", t:"09:04", tag:"invite" },
        { u:"Tom Park", a:"processed", o:"Payroll · July · 46 employees", t:"08:52", tag:"finance" },
        { u:"Ana Costa", a:"published", o:"Announcement 'Series A closed'", t:"08:15", tag:"broadcast" },
        { u:"Daniel Osei", a:"logged", o:"New pipeline: Meridian Bank (£420K ARR)", t:"08:02", tag:"sales" },
      ].map((r,i) => (
        <div key={i} className="py-2.5 flex items-center gap-3 text-[13px]">
          <MockAvatar name={r.u} size={28} />
          <div className="flex-1"><span className="font-semibold">{r.u}</span> <span className="text-slate-500">{r.a}</span> <span className="text-slate-800">{r.o}</span></div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">{r.tag}</span>
          <span className="text-[11px] text-slate-400 tabular-nums w-12 text-right">{r.t}</span>
        </div>
      ))}
    </div>
  </Card>
);

/* =====================================================================
   DOCUMENTS
===================================================================== */
export const DocumentsView = () => (
  <>
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatTile icon={FileText} value="184" label="Documents" tone="gold" />
      <StatTile icon={Shield}   value="27" label="Signed" tone="green" />
      <StatTile icon={Users}    value="12" label="Shared Ext." tone="blue" />
      <StatTile icon={AlertTriangle} value="3" label="Pending Review" tone="red" />
    </div>
    <Card title="Recent Documents" icon={FileText}>
      <div className="divide-y divide-slate-100">
        {[
          { t:"Series A · Term Sheet (Vertex VC)", by:"Alex Rivera", when:"2h ago", s:"signed" },
          { t:"2026 Employee Handbook v3",         by:"Jade Wright", when:"1d ago", s:"draft" },
          { t:"Q3 Financial Model",                by:"Tom Park",    when:"1d ago", s:"review" },
          { t:"Brand Guidelines v3",               by:"Sarah Chen",  when:"2d ago", s:"signed" },
          { t:"Security & Compliance Report — Jul",by:"Marcus Lee",  when:"3d ago", s:"signed" },
        ].map((d,i)=>(
          <div key={i} className="py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center"><FileText className="w-4 h-4 text-slate-500" /></div>
            <div className="flex-1"><div className="text-[13px] font-medium">{d.t}</div>
              <div className="text-[11px] text-slate-500">{d.by} · {d.when}</div></div>
            <span className={cn("text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-semibold",
              d.s==="signed" ? "bg-emerald-500/15 text-emerald-700" :
              d.s==="review" ? "bg-amber-500/15 text-amber-700" : "bg-slate-200 text-slate-600")}>{d.s}</span>
          </div>
        ))}
      </div>
    </Card>
  </>
);

/* =====================================================================
   KPI / INTELLIGENCE
===================================================================== */
export const KpiView = () => {
  const kpis = [
    { t: "Monthly Recurring Revenue", v: "$1.24M", c: "hsl(214 84% 56%)", d: "+18%", spark: [30,32,38,41,45,52,58,63,71,78,84,92] },
    { t: "Customer Retention",        v: "97.2%", c: "hsl(38 80% 55%)",  d: "+2.1pp", spark: [88,90,89,91,92,93,94,94,95,96,97,97] },
    { t: "NPS Score",                 v: "68",    c: "hsl(152 48% 45%)", d: "+5",  spark: [40,45,48,52,55,58,60,62,64,66,68,68] },
    { t: "Cost per Acquisition",      v: "$142",  c: "hsl(214 84% 56%)", d: "-12%", spark: [200,190,180,175,170,165,160,155,150,148,145,142] },
    { t: "Feature Adoption",          v: "72%",   c: "hsl(38 80% 55%)",  d: "+8pp", spark: [40,44,48,52,56,60,62,65,67,69,71,72] },
    { t: "Sales Cycle Length (days)", v: "24",    c: "hsl(152 48% 45%)", d: "-3d", spark: [40,38,36,35,33,32,30,29,27,26,25,24] },
  ];
  return (
    <div className="grid grid-cols-3 gap-4">
      {kpis.map((k) => (
        <Card key={k.t}>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">{k.t}</div>
          <div className="flex items-baseline gap-2 mb-3">
            <div className="text-3xl font-bold text-slate-900">{k.v}</div>
            <div className="text-[11px] font-semibold text-emerald-600">{k.d}</div>
          </div>
          <svg viewBox="0 0 120 30" className="w-full h-10">
            <polyline
              fill="none" stroke={k.c} strokeWidth="2" strokeLinecap="round"
              points={k.spark.map((v,i) => `${(i/11)*120},${30 - (v/100)*28}`).join(" ")} />
            <polyline
              fill={k.c} opacity={0.14} stroke="none"
              points={`0,30 ${k.spark.map((v,i) => `${(i/11)*120},${30 - (v/100)*28}`).join(" ")} 120,30`} />
          </svg>
        </Card>
      ))}
    </div>
  );
};

/* =====================================================================
   KNOWLEDGE GRAPH
===================================================================== */
export const GraphView = () => {
  const nodes = [
    { id: "org",    x: 50, y: 50, r: 26, label: "Aurora Labs", type: "org" },
    { id: "eng",    x: 22, y: 22, r: 18, label: "Engineering", type: "dept" },
    { id: "des",    x: 78, y: 22, r: 18, label: "Design",      type: "dept" },
    { id: "sales",  x: 78, y: 78, r: 18, label: "Sales",       type: "dept" },
    { id: "ppl",    x: 22, y: 78, r: 18, label: "People Ops",  type: "dept" },
    { id: "p1",     x: 8,  y: 45, r: 10, label: "v3 Launch",   type: "proj" },
    { id: "p2",     x: 45, y: 8,  r: 10, label: "Series A",    type: "proj" },
    { id: "p3",     x: 92, y: 55, r: 10, label: "Meridian",    type: "proj" },
    { id: "p4",     x: 55, y: 92, r: 10, label: "Handbook",    type: "proj" },
  ];
  const edges = [
    ["org","eng"],["org","des"],["org","sales"],["org","ppl"],
    ["eng","p1"],["des","p1"],["org","p2"],["sales","p3"],["ppl","p4"],["eng","p3"],
  ];
  return (
    <Card title="Organizational Knowledge Graph" icon={Network}>
      <div className="relative aspect-[16/10] bg-slate-50/60 rounded-lg overflow-hidden">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {edges.map(([a,b],i) => {
            const A = nodes.find(n=>n.id===a)!, B = nodes.find(n=>n.id===b)!;
            return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke="hsl(38 80% 55% / 0.35)" strokeWidth="0.4" />;
          })}
        </svg>
        {nodes.map((n) => (
          <div key={n.id}
            className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}>
            <motion.div
              animate={{ scale: [1,1.05,1] }}
              transition={{ duration: 2, repeat: Infinity, delay: (n.x+n.y)/50 }}
              className={cn("rounded-full flex items-center justify-center shadow-md",
                n.type === "org" ? "bg-svo-navy text-svo-gold border-2 border-svo-gold" :
                n.type === "dept" ? "bg-white text-svo-navy border border-svo-gold/40" :
                "bg-svo-gold/20 text-svo-navy border border-svo-gold/30")}
              style={{ width: n.r*2, height: n.r*2 }}>
              <span className="text-[9px] font-bold text-center px-1 leading-tight">{n.label}</span>
            </motion.div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 mt-4 text-[11px]">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-svo-navy" /> Organization</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white border border-svo-gold" /> Department</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-svo-gold/40" /> Project</div>
        <div className="text-slate-400 text-right">9 nodes · 10 edges</div>
      </div>
    </Card>
  );
};

/* =====================================================================
   AI INSIGHTS
===================================================================== */
export const AiInsightsView = () => (
  <div className="space-y-3">
    {[
      { s:"critical", t:"Retention risk — 3 high-performers at risk", d:"Engagement signals dropped >30% for Marcus Lee, Ana Costa and Daniel Osei over the last 14 days. Suggested action: schedule 1:1 with each within 48 hours.", src:"Slack sentiment + PTO patterns + task velocity" },
      { s:"warning",  t:"Hiring gap detected", d:"Engineering velocity will drop 18% by Q3 without 2 senior hires. Requisitions currently open: 1. Recommend opening 1 more this week.", src:"Sprint velocity trend + open reqs" },
      { s:"info",     t:"Process bottleneck — approval workflow", d:"Expense approvals average 4.2 days end-to-end. Auto-routing rules would reduce to 1.1 days based on historical patterns.", src:"Workflow instance history" },
      { s:"success",  t:"Budget on track — reallocation opportunity", d:"Q2 spend is 6% under plan across all departments. Marketing has capacity for a +$40K experiment budget without breaching Q2 ceiling.", src:"Finance ledger + budget model" },
    ].map((a,i)=>(
      <div key={i} className={cn("rounded-xl border p-4 bg-white shadow-sm",
        a.s==="critical" ? "border-rose-500/40 bg-rose-500/[0.03]" :
        a.s==="warning"  ? "border-amber-500/40 bg-amber-500/[0.03]" :
        a.s==="success"  ? "border-emerald-500/40 bg-emerald-500/[0.03]" :
        "border-blue-500/40 bg-blue-500/[0.03]")}>
        <div className="flex items-start gap-3">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
            a.s==="critical" ? "bg-rose-500 text-white" :
            a.s==="warning" ? "bg-amber-500 text-white" :
            a.s==="success" ? "bg-emerald-500 text-white" :
            "bg-blue-500 text-white")}>
            {a.s==="success" ? <TrendingUp className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full",
                a.s==="critical" ? "bg-rose-500/15 text-rose-700" :
                a.s==="warning" ? "bg-amber-500/15 text-amber-700" :
                a.s==="success" ? "bg-emerald-500/15 text-emerald-700" :
                "bg-blue-500/15 text-blue-700")}>{a.s}</span>
              <div className="text-[14px] font-semibold">{a.t}</div>
            </div>
            <p className="text-[13px] text-slate-600 leading-relaxed mb-2">{a.d}</p>
            <div className="text-[10px] text-slate-400">Source: {a.src}</div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* =====================================================================
   EXECUTIVE CONTROL CENTER
===================================================================== */
export const ExecutiveView = () => (
  <>
    <div className="grid grid-cols-5 gap-3 mb-5">
      <StatTile icon={TrendingUp} value="87%" label="Health Score" tone="green" />
      <StatTile icon={Users}      value="42/46" label="Present Today" tone="blue" />
      <StatTile icon={Clock}      value="3" label="On Leave" tone="slate" />
      <StatTile icon={CheckSquare} value="94%" label="Task Completion" tone="gold" />
      <StatTile icon={BarChart3}  value="86%" label="KPI Achievement" tone="green" />
    </div>
    <Card className="!p-4 mb-5 border-rose-200 bg-rose-500/[0.03]">
      <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm mb-2">
        <AlertTriangle className="w-4 h-4" /> Risk Alerts
      </div>
      <div className="flex flex-wrap gap-2">
        {["Retention risk in Engineering","Payroll approvals overdue (2)","Vendor SLA breach: Meridian"].map((r) => (
          <span key={r} className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-700 text-[11px] font-medium">{r}</span>
        ))}
      </div>
    </Card>
    <div className="grid grid-cols-2 gap-4 mb-5">
      <Card title="Department Performance" icon={BarChart3}>
        <div className="space-y-3">
          {[
            { d: "Engineering", v: 88 }, { d: "Design", v: 94 },
            { d: "Sales", v: 81 }, { d: "Marketing", v: 90 }, { d: "People Ops", v: 78 },
          ].map((r) => (
            <div key={r.d}>
              <div className="flex justify-between text-xs mb-1"><span>{r.d}</span><span className="font-semibold">{r.v}%</span></div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-svo-gold" style={{ width: `${r.v}%` }} /></div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Task Distribution" icon={CheckSquare}>
        <div className="flex items-center justify-center h-full py-4">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
              {(() => {
                const seg = [{ v: 48, c: "hsl(38 80% 55%)" }, { v: 24, c: "#3B82F6" }, { v: 20, c: "#10B981" }, { v: 8, c: "#EF4444" }];
                let off = 0;
                return seg.map((s, i) => {
                  const dash = (s.v/100)*100.5;
                  const el = <circle key={i} cx="20" cy="20" r="16" fill="none" stroke={s.c} strokeWidth="6"
                    strokeDasharray={`${dash} 100.5`} strokeDashoffset={-off} />;
                  off += dash;
                  return el;
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold">128</div>
              <div className="text-[10px] text-slate-500">Tasks</div>
            </div>
          </div>
          <div className="ml-4 space-y-2 text-[11px]">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-svo-gold" /> To Do 48%</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-500" /> In Progress 24%</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500" /> Done 20%</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-rose-500" /> Blocked 8%</div>
          </div>
        </div>
      </Card>
    </div>
    <Card title="Weekly Attendance Trend" icon={Activity}>
      <svg viewBox="0 0 400 120" className="w-full h-32">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(38 80% 55%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(38 80% 55%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[20,40,60,80,100].map((y) => <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="#E5E7EB" strokeDasharray="2 3" />)}
        {(() => {
          const pts = [42,44,41,43,45,42,44];
          const coords = pts.map((v,i) => [50 + i*50, 110 - (v-30)*4]);
          const path = coords.map(([x,y],i) => (i===0?"M":"L")+`${x} ${y}`).join(" ");
          return <>
            <path d={`${path} L 350 120 L 50 120 Z`} fill="url(#grad)" />
            <path d={path} fill="none" stroke="hsl(38 80% 55%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {coords.map(([x,y],i) => <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke="hsl(38 80% 55%)" strokeWidth="2" />)}
          </>;
        })()}
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i) => (
          <text key={d} x={50+i*50} y="118" textAnchor="middle" className="text-[9px] fill-slate-400">{d}</text>
        ))}
      </svg>
    </Card>
  </>
);

/* =====================================================================
   WORKFLOWS
===================================================================== */
export const WorkflowsView = () => (
  <>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatTile icon={Workflow} value="14" label="Total Workflows" tone="gold" />
      <StatTile icon={Play}     value="12" label="Active" tone="green" />
      <StatTile icon={Activity} value="47" label="Running Instances" tone="blue" />
    </div>
    <Card>
      <div className="divide-y divide-slate-100">
        {[
          { n: "Expense Approval Flow", t: "Manual Trigger", s: 4, r: 12, active: true },
          { n: "New Employee Onboarding", t: "Event: user.created", s: 8, r: 3, active: true },
          { n: "Weekly Report Auto-generation", t: "Cron: Fri 5pm", s: 3, r: 0, active: true },
          { n: "Investor Update Digest", t: "Cron: Mon 9am", s: 5, r: 1, active: true },
          { n: "Vendor Payment Escalation", t: "Cron: daily", s: 6, r: 4, active: true },
        ].map((w) => (
          <div key={w.n} className="py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-svo-gold/15 text-svo-gold flex items-center justify-center"><Workflow className="w-4 h-4" /></div>
            <div className="flex-1"><div className="text-[13px] font-semibold">{w.n}</div>
              <div className="text-[11px] text-slate-500">{w.t} · {w.s} steps · {w.r} running now</div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700">ACTIVE</span>
          </div>
        ))}
      </div>
    </Card>
  </>
);

/* =====================================================================
   HR
===================================================================== */
export const HrView = () => (
  <>
    <div className="flex gap-6 mb-6 text-sm border-b border-slate-200">
      {["Postings","Candidates","Staff","Reviews","Offboarding"].map((t,i) => (
        <div key={t} className={cn("pb-3 -mb-px",
          i===0 ? "border-b-2 border-svo-gold text-slate-900 font-semibold" : "text-slate-500")}>{t}</div>
      ))}
    </div>
    <div className="space-y-3">
      {[
        { t: "Senior Backend Engineer",  l: "Remote · UK/EU", type: "Full-time", s: "$120k-$150k", a: 24 },
        { t: "Head of Growth",           l: "London",         type: "Full-time", s: "$140k-$180k + equity", a: 18 },
        { t: "Product Designer (Senior)",l: "Remote · Global",type: "Full-time", s: "$100k-$130k", a: 32 },
        { t: "Enterprise AE",            l: "New York",       type: "Full-time", s: "$110k base + OTE $200k", a: 12 },
        { t: "Customer Success Lead",    l: "Remote · US",    type: "Full-time", s: "$95k-$120k", a: 8 },
      ].map((j)=>(
        <Card key={j.t}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-svo-gold/15 text-svo-gold flex items-center justify-center"><Briefcase className="w-4 h-4" /></div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold">{j.t}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{j.type} · <MapPin className="w-3 h-3 inline -mt-0.5" /> {j.l} · {j.s}</div>
              <div className="mt-2 flex items-center gap-3 text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-svo-gold/15 text-svo-gold font-semibold">{j.a} applicants</span>
                <span className="text-emerald-600 font-semibold">Open</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </>
);

/* =====================================================================
   FINANCE
===================================================================== */
export const FinanceView = () => (
  <>
    <div className="flex gap-6 mb-6 text-sm border-b border-slate-200">
      {["Payroll","Expenses","Reports"].map((t,i) => (
        <div key={t} className={cn("pb-3 -mb-px",
          i===0 ? "border-b-2 border-svo-gold text-slate-900 font-semibold" : "text-slate-500")}>{t}</div>
      ))}
    </div>
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatTile icon={DollarSign} value="$412K" label="Total Payroll" tone="gold" />
      <StatTile icon={TrendingUp} value="$28K" label="Total Bonuses" tone="green" />
      <StatTile icon={AlertTriangle} value="$14K" label="Total Deductions" tone="red" />
      <StatTile icon={CheckSquare} value="46" label="Records Processed" tone="blue" />
    </div>
    <Card title="Payroll Records — July 2026" icon={DollarSign}>
      <table className="w-full text-[13px]">
        <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
          <tr><th className="text-left py-2 font-medium">Employee</th><th className="text-left font-medium">Department</th>
          <th className="text-right font-medium">Base</th><th className="text-right font-medium">Bonus</th>
          <th className="text-right font-medium">Deductions</th><th className="text-right font-medium">Net</th></tr>
        </thead>
        <tbody>
          {[
            ["Sarah Chen","Design",9200,1200,850,9550],
            ["Marcus Lee","Engineering",11500,2000,1050,12450],
            ["Ana Costa","Marketing",7800,800,720,7880],
            ["Tom Park","Finance",8900,600,830,8670],
            ["Jade Wright","People Ops",8200,500,760,7940],
            ["Daniel Osei","Sales",6800,3200,690,9310],
            ["Priya Patel","Engineering",9800,1400,910,10290],
            ["Kenji Sato","Design",8100,700,760,8040],
          ].map((r) => (
            <tr key={r[0] as string} className="border-b border-slate-100">
              <td className="py-2.5 font-medium">{r[0]}</td>
              <td className="text-slate-500">{r[1]}</td>
              <td className="text-right tabular-nums">${(r[2] as number).toLocaleString()}</td>
              <td className="text-right tabular-nums text-emerald-600">+${(r[3] as number).toLocaleString()}</td>
              <td className="text-right tabular-nums text-rose-600">−${(r[4] as number).toLocaleString()}</td>
              <td className="text-right tabular-nums font-bold">${(r[5] as number).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </>
);

/* =====================================================================
   TEAM
===================================================================== */
export const TeamView = () => (
  <>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatTile icon={Users} value="46" label="Team Members" tone="gold" />
      <StatTile icon={Send}  value="3" label="Pending Invites" tone="blue" />
      <StatTile icon={Building2} value="5" label="Departments" tone="green" />
    </div>
    <Card title="Members" icon={Users}>
      <div className="grid grid-cols-2 gap-3">
        {TEAM.concat(TEAM.slice(0,2).map(u=>({...u, n: u.n+" Jr."}))).map((u)=>(
          <div key={u.n} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
            <MockAvatar name={u.n.replace(" Jr.", "")} size={40} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold flex items-center gap-2">{u.n}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-svo-gold/15 text-svo-gold font-semibold uppercase tracking-wider">Member</span>
              </div>
              <div className="text-[11px] text-slate-500">{u.r}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  </>
);

/* =====================================================================
   ADMIN (super)
===================================================================== */
export const AdminView = () => (
  <>
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatTile icon={Building2} value="1,284" label="Active Tenants" tone="gold" />
      <StatTile icon={Users}     value="24,912" label="Total Users" tone="blue" />
      <StatTile icon={Activity}  value="99.98%" label="Uptime (30d)" tone="green" />
      <StatTile icon={TrendingUp} value="$4.2M" label="ARR" tone="green" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Card title="System Health" icon={Activity}>
        {[
          { s:"API Gateway",       v:"142ms p95", ok:true },
          { s:"Database",          v:"18ms p95",  ok:true },
          { s:"LiveKit Egress",    v:"3 running", ok:true },
          { s:"AI Gateway",        v:"420ms p95", ok:true },
          { s:"Storage",           v:"84% healthy", ok:true },
        ].map((r,i)=>(
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {r.s}</div>
            <span className="text-[11px] text-slate-500 tabular-nums">{r.v}</span>
          </div>
        ))}
      </Card>
      <Card title="Top Tenants (by ARR)" icon={Crown}>
        {[
          { t:"Meridian Bank", a:"$180K" },
          { t:"Northwind Logistics", a:"$142K" },
          { t:"Vertex Robotics", a:"$96K" },
          { t:"Kestrel Health", a:"$88K" },
          { t:"Beacon Ventures", a:"$72K" },
        ].map((r,i)=>(
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
            <span className="font-medium">{r.t}</span>
            <span className="text-svo-gold font-bold">{r.a}</span>
          </div>
        ))}
      </Card>
    </div>
  </>
);

/* =====================================================================
   PARTNER CONNECT
===================================================================== */
export const PartnerView = () => (
  <Card title="Partner Connect" icon={Building2}>
    <div className="grid grid-cols-3 gap-3">
      {[
        { n:"Vertex VC",         u:"Investor · shared: 4 docs, 2 KPIs", s:"active"  },
        { n:"Meridian Bank",     u:"Client · shared: SOC 2, DPA",        s:"active"  },
        { n:"Northwind Logistics",u:"Vendor · shared: SLA, invoices",    s:"active"  },
      ].map((p)=>(
        <div key={p.n} className="rounded-lg border border-slate-200 p-4">
          <div className="w-10 h-10 rounded-lg bg-svo-navy text-svo-gold flex items-center justify-center mb-3"><Building2 className="w-4 h-4" /></div>
          <div className="text-[13px] font-semibold">{p.n}</div>
          <div className="text-[11px] text-slate-500 mt-1">{p.u}</div>
          <div className="mt-3 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-[11px] text-emerald-700 font-semibold">Consent active</span></div>
        </div>
      ))}
    </div>
  </Card>
);

export const VIEW_META: Record<MockView, { title: string; subtitle?: string; Icon?: any; Component: () => JSX.Element }> = {
  admin:         { title: "Admin",                     subtitle: "Global platform overview",                   Icon: Shield,      Component: AdminView },
  dashboard:     { title: "Good morning, Alex 👋",     subtitle: "Here's what's happening at Aurora Labs today", Icon: Home,        Component: DashboardView },
  attendance:    { title: "Attendance & Presence",     subtitle: "Real-time workforce visibility",              Icon: Clock,       Component: AttendanceView },
  planning:      { title: "Job Planning",              subtitle: "Goal-oriented targets across the org",        Icon: Target,      Component: PlanningView },
  tasks:         { title: "Execution Engine",          subtitle: "Kanban board · AI workload balancing",        Icon: CheckSquare, Component: TasksView },
  messages:      { title: "Messages",                  subtitle: "Team channels & direct messages",             Icon: MessageSquare, Component: MessagesView },
  meetings:      { title: "Video Meetings",            subtitle: "LiveKit rooms with AI transcription",         Icon: Video,       Component: MeetingsView },
  announcements: { title: "Announcements",             subtitle: "Corporate broadcasts with read receipts",     Icon: Megaphone,   Component: AnnouncementsView },
  activity:      { title: "Activity Log",              subtitle: "System-wide action tracking",                 Icon: Activity,    Component: ActivityView },
  documents:     { title: "Documents",                 subtitle: "Repository with digital signatures",          Icon: FileText,    Component: DocumentsView },
  kpi:           { title: "Intelligence · KPIs",       subtitle: "Live business metrics",                       Icon: BarChart3,   Component: KpiView },
  graph:         { title: "Knowledge Graph",           subtitle: "Every entity, every relationship",            Icon: Network,     Component: GraphView },
  ai:            { title: "AI Insights",               subtitle: "Predictive alerts across your organization",  Icon: Brain,       Component: AiInsightsView },
  executive:     { title: "Executive Control Center",  subtitle: "Live organizational health dashboard",        Icon: Crown,       Component: ExecutiveView },
  workflows:     { title: "Workflow Automation",       subtitle: "Automated approvals, escalations & IF/THEN logic", Icon: Workflow, Component: WorkflowsView },
  hr:            { title: "Human Resources",           subtitle: "Recruitment, onboarding, reviews & offboarding", Icon: Briefcase, Component: HrView },
  finance:       { title: "Finance & Accounting",      subtitle: "Payroll, expenses & financial reports",       Icon: DollarSign,  Component: FinanceView },
  team:          { title: "Team Management",           subtitle: "Manage members & send invitations",           Icon: Users,       Component: TeamView },
  partner:       { title: "Partner Connect",           subtitle: "Communicate with other organizations",        Icon: Building2,   Component: PartnerView },
};