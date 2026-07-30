import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { photoFor } from "./people";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  Home, Clock, Target, CheckSquare, MessageSquare, Video, Megaphone,
  Activity, FileText, BarChart3, Network, Brain, Crown, Workflow,
  Briefcase, DollarSign, Users, Shield, Building2, Bell, Ticket,
} from "lucide-react";

export const AURORA_LOGO = (
  <div className="w-10 h-10 rounded-lg bg-svo-gold flex items-center justify-center shadow-md shrink-0">
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-svo-navy" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M4 20 L12 4 L20 20 Z" strokeLinejoin="round" />
      <path d="M9 14 L15 14" strokeLinecap="round" />
    </svg>
  </div>
);

export const MOCK_NAV = [
  { icon: Shield,      label: "Admin",           v: "admin" },
  { icon: Home,        label: "Dashboard",       v: "dashboard" },
  { icon: Clock,       label: "Attendance",      v: "attendance" },
  { icon: Target,      label: "Job Planning",    v: "planning" },
  { icon: CheckSquare, label: "Execution",       v: "tasks" },
  { icon: MessageSquare, label: "Messages",      v: "messages" },
  { icon: Video,       label: "Meetings",        v: "meetings" },
  { icon: Megaphone,   label: "Announcements",   v: "announcements" },
  { icon: Activity,    label: "Activity",        v: "activity" },
  { icon: FileText,    label: "Documents",       v: "documents" },
  { icon: BarChart3,   label: "Intelligence",    v: "kpi" },
  { icon: Network,     label: "Knowledge Graph", v: "graph" },
  { icon: Brain,       label: "AI Insights",     v: "ai" },
  { icon: Crown,       label: "Executive",       v: "executive" },
  { icon: Workflow,    label: "Workflows",       v: "workflows" },
  { icon: Briefcase,   label: "HR",              v: "hr" },
  { icon: DollarSign,  label: "Finance",         v: "finance" },
  { icon: Users,       label: "Team",            v: "team" },
  { icon: Ticket,      label: "Support",         v: "support" },
  { icon: Building2,   label: "Partner Connect", v: "partner" },
] as const;

export type MockView = typeof MOCK_NAV[number]["v"];

interface ShellProps {
  view: MockView;
  onNav?: (v: MockView) => void;
  navRef?: (v: MockView, el: HTMLButtonElement | null) => void;
  children: ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
  headerIcon?: ReactNode;
  headerActions?: ReactNode;
}

export function MockupShell({
  view, onNav, navRef, children, pageTitle, pageSubtitle, headerIcon, headerActions,
}: ShellProps) {
  return (
    <div data-mock-shell className="w-full h-full flex bg-[#F5F6F8] text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 bg-[#0B1533] flex flex-col">
        {/* Org header */}
        <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
          {AURORA_LOGO}
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">Aurora Labs</p>
            <p className="text-[10px] text-white/50 truncate">Where teams compound</p>
          </div>
          <Bell className="w-3.5 h-3.5 text-white/40 ml-auto shrink-0" />
        </div>
        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {MOCK_NAV.map((item) => {
            const active = view === item.v;
            return (
              <button
                key={item.v}
                ref={(el) => navRef?.(item.v, el)}
                onClick={() => onNav?.(item.v)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors relative",
                  active
                    ? "bg-white/[0.06] text-svo-gold font-semibold"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white/90"
                )}
              >
                {active && <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-svo-gold rounded-r" />}
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
        {/* User */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2.5">
          <MockAvatar name="Alex Rivera" size={32} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">Alex Rivera</p>
            <p className="text-[10px] text-svo-gold/80">Executive</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-8 py-6">
          {/* Premium page header — mirrors the in-app PageHeader */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/70 shadow-[0_8px_30px_-12px_rgba(11,21,51,0.18)] p-5 mb-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-svo-gold via-svo-gold-light to-transparent" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                {headerIcon && (
                  <div className="w-12 h-12 rounded-2xl bg-[#0B1533] flex items-center justify-center shrink-0 shadow-md">
                    {headerIcon}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-svo-gold">
                    Aurora Labs
                  </span>
                  <h1 className="text-[26px] font-bold text-slate-900 leading-tight tracking-tight">{pageTitle}</h1>
                  {pageSubtitle && <p className="text-sm text-slate-500 mt-1">{pageSubtitle}</p>}
                </div>
              </div>
              {headerActions && <div className="flex items-center gap-2 shrink-0">{headerActions}</div>}
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

/* Shared card primitives */
export const MOCK_TONES: Record<string, { hex: string; tile: string; text: string; bar: string }> = {
  gold:   { hex: "hsl(38 80% 55%)",  tile: "bg-svo-gold/10",     text: "text-svo-gold",     bar: "linear-gradient(90deg,hsl(38 80% 55%),hsl(45 90% 66%))" },
  green:  { hex: "hsl(160 60% 40%)", tile: "bg-emerald-500/10",  text: "text-emerald-600",  bar: "linear-gradient(90deg,hsl(160 60% 40%),hsl(152 55% 55%))" },
  blue:   { hex: "hsl(214 84% 56%)", tile: "bg-blue-500/10",     text: "text-blue-600",     bar: "linear-gradient(90deg,hsl(214 84% 56%),hsl(206 90% 68%))" },
  violet: { hex: "hsl(265 60% 55%)", tile: "bg-violet-500/10",   text: "text-violet-600",   bar: "linear-gradient(90deg,hsl(265 60% 55%),hsl(275 70% 70%))" },
  red:    { hex: "hsl(8 80% 60%)",   tile: "bg-rose-500/10",     text: "text-rose-600",     bar: "linear-gradient(90deg,hsl(8 80% 60%),hsl(20 85% 68%))" },
  slate:  { hex: "hsl(222 47% 24%)", tile: "bg-slate-500/10",    text: "text-slate-600",    bar: "linear-gradient(90deg,hsl(222 47% 18%),hsl(222 40% 34%))" },
};

export const StatTile = ({ icon: Icon, value, label, tone = "gold", progress, delta }: any) => {
  const t = MOCK_TONES[tone] ?? MOCK_TONES.gold;
  return (
    <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200/70 p-4 shadow-[0_6px_20px_-14px_rgba(11,21,51,0.35)]">
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: t.bar }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500 truncate">{label}</p>
          <p className="mt-1.5 text-[26px] leading-none font-bold text-slate-900 tracking-tight tabular-nums">{value}</p>
          {delta && <p className={cn("mt-1.5 text-[11px] font-semibold", t.text)}>{delta}</p>}
        </div>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", t.tile)}>
            <Icon className={cn("w-5 h-5", t.text)} />
          </div>
        )}
      </div>
      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: t.bar }} />
        </div>
      )}
    </div>
  );
};

/** Headshot avatar with gradient initials fallback — mirrors in-app PersonAvatar. */
export const MockAvatar = ({ name, size = 36 }: { name: string; size?: number }) => {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  const hue = Array.from(name).reduce((a, ch) => a + ch.charCodeAt(0), 0) % 360;
  const photo = photoFor(name) ?? photoFor(initials);
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        loading="lazy"
        width={size}
        height={size}
        className="rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white shadow-sm shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 65% 58%))`,
      }}
    >
      {initials}
    </div>
  );
};

/** Circular gauge — mirrors in-app GaugeRing. */
export const MockGauge = ({ value, label, tone = "gold", size = 92 }: any) => {
  const t = MOCK_TONES[tone] ?? MOCK_TONES.gold;
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={8} stroke="#E9EDF3" fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={r} strokeWidth={8} fill="none"
            stroke={t.hex} strokeLinecap="round"
            strokeDasharray={`${(c * value) / 100} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-base font-bold text-slate-900 tabular-nums">
          {value}%
        </div>
      </div>
      {label && <div className="text-[11px] text-slate-500 mt-1.5">{label}</div>}
    </div>
  );
};

/** Glowing area trend chart — mirrors in-app TrendChart. */
export const MockTrend = ({ data, dataKey = "value", secondKey, tone = "gold", secondTone = "blue", height = 170 }: any) => {
  const t = MOCK_TONES[tone] ?? MOCK_TONES.gold;
  const t2 = MOCK_TONES[secondTone] ?? MOCK_TONES.blue;
  const id = `mg-${dataKey}-${tone}`;
  const id2 = `mg-${secondKey}-${secondTone}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={t.hex} stopOpacity={0.45} />
              <stop offset="100%" stopColor={t.hex} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={id2} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={t2.hex} stopOpacity={0.32} />
              <stop offset="100%" stopColor={t2.hex} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EDF3" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
          <Area type="monotone" dataKey={dataKey} stroke={t.hex} strokeWidth={2.5} fill={`url(#${id})`} dot={false} isAnimationActive={false} />
          {secondKey && (
            <Area type="monotone" dataKey={secondKey} stroke={t2.hex} strokeWidth={2} fill={`url(#${id2})`} dot={false} isAnimationActive={false} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const Card = ({ title, icon: Icon, action, children, className }: any) => (
  <div className={cn("rounded-xl bg-white border border-slate-200/70 shadow-[0_6px_24px_-16px_rgba(11,21,51,0.35)] p-5", className)}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-[12px] uppercase tracking-[0.1em]">
          {Icon && <Icon className="w-4 h-4 text-svo-gold" />}
          {title}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

export const PillBtn = ({ children, primary, className }: any) => (
  <button
    className={cn(
      "px-3.5 py-2 rounded-lg text-[12.5px] font-semibold inline-flex items-center gap-1.5 border transition-colors",
      primary
        ? "bg-svo-gold text-svo-navy border-transparent hover:bg-svo-gold-light"
        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
      className
    )}
  >
    {children}
  </button>
);