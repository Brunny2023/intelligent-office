import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Home, Clock, Target, CheckSquare, MessageSquare, Video, Megaphone,
  Activity, FileText, BarChart3, Network, Brain, Crown, Workflow,
  Briefcase, DollarSign, Users, Shield, Building2, Bell,
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
    <div className="w-full h-full flex bg-[#F5F6F8] text-slate-900 overflow-hidden">
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
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs font-semibold text-white">Alex Rivera</p>
          <p className="text-[10px] text-svo-gold/80">Executive</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-8 py-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h1 className="text-[26px] font-bold text-slate-900 leading-tight flex items-center gap-2.5">
                {headerIcon}
                {pageTitle}
              </h1>
              {pageSubtitle && <p className="text-sm text-slate-500 mt-1">{pageSubtitle}</p>}
            </div>
            {headerActions && <div className="flex items-center gap-2 shrink-0">{headerActions}</div>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

/* Shared card primitives */
export const StatTile = ({ icon: Icon, value, label, tone = "gold" }: any) => {
  const toneMap: Record<string, string> = {
    gold: "text-svo-gold bg-svo-gold/10",
    green: "text-emerald-600 bg-emerald-500/10",
    blue: "text-blue-600 bg-blue-500/10",
    red: "text-rose-600 bg-rose-500/10",
    slate: "text-slate-600 bg-slate-500/10",
  };
  return (
    <div className="rounded-xl bg-white border border-slate-200/70 p-4 shadow-sm">
      <div className={cn("w-8 h-8 rounded-md flex items-center justify-center mb-3", toneMap[tone])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-bold text-slate-900 leading-none">{value}</div>
      <div className="text-[11px] text-slate-500 mt-1.5">{label}</div>
    </div>
  );
};

export const Card = ({ title, icon: Icon, action, children, className }: any) => (
  <div className={cn("rounded-xl bg-white border border-slate-200/70 shadow-sm p-5", className)}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
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