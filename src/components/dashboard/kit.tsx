import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type Tone = "gold" | "blue" | "emerald" | "violet" | "rose" | "slate";

const TONES: Record<Tone, { bar: string; tile: string; text: string; ring: string }> = {
  gold: {
    bar: "linear-gradient(90deg, hsl(var(--svo-gold)), hsl(var(--svo-gold-light)))",
    tile: "bg-[hsl(var(--svo-gold)/0.12)]",
    text: "text-[hsl(var(--svo-gold))]",
    ring: "hsl(var(--svo-gold))",
  },
  blue: {
    bar: "linear-gradient(90deg, hsl(var(--svo-blue)), hsl(var(--svo-blue-light)))",
    tile: "bg-[hsl(var(--svo-blue)/0.12)]",
    text: "text-[hsl(var(--svo-blue))]",
    ring: "hsl(var(--svo-blue))",
  },
  emerald: {
    bar: "linear-gradient(90deg, hsl(160 60% 40%), hsl(152 55% 55%))",
    tile: "bg-[hsl(160_60%_40%/0.12)]",
    text: "text-[hsl(160_60%_36%)]",
    ring: "hsl(160 60% 40%)",
  },
  violet: {
    bar: "linear-gradient(90deg, hsl(265 60% 55%), hsl(275 70% 70%))",
    tile: "bg-[hsl(265_60%_55%/0.12)]",
    text: "text-[hsl(265_60%_55%)]",
    ring: "hsl(265 60% 55%)",
  },
  rose: {
    bar: "linear-gradient(90deg, hsl(8 80% 60%), hsl(20 85% 68%))",
    tile: "bg-[hsl(8_80%_60%/0.12)]",
    text: "text-[hsl(8_74%_52%)]",
    ring: "hsl(8 80% 60%)",
  },
  slate: {
    bar: "linear-gradient(90deg, hsl(var(--svo-navy)), hsl(var(--svo-navy-light)))",
    tile: "bg-[hsl(var(--svo-navy)/0.10)]",
    text: "text-[hsl(var(--svo-navy))]",
    ring: "hsl(var(--svo-navy-light))",
  },
};

/** Page header with gold eyebrow, title, subtitle and optional actions. */
export const PageHeader = ({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  actions,
  avatar,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  /** Optional leading media (e.g. member headshot) shown instead of the icon. */
  avatar?: ReactNode;
}) => (
  <motion.header
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="data-card-elevated p-5 sm:p-6"
  >
    <div className="absolute inset-x-0 top-0 h-1 gold-rule" />
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4 min-w-0">
        {avatar ? (
          <div className="hidden sm:block shrink-0">{avatar}</div>
        ) : Icon ? (
          <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-[hsl(var(--svo-navy))] items-center justify-center shrink-0 shadow-md">
            <Icon className="w-6 h-6 text-[hsl(var(--svo-gold))]" />
          </div>
        ) : null}
        <div className="min-w-0">
          {eyebrow && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--svo-gold))]">
              {eyebrow}
            </span>
          )}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  </motion.header>
);

/** Metric tile with tinted icon, value, caption and optional trend/progress. */
export const StatCard = ({
  label,
  value,
  caption,
  icon: Icon,
  tone = "gold",
  progress,
  delta,
  index = 0,
  className,
}: {
  label: string;
  value: ReactNode;
  caption?: string;
  icon?: LucideIcon;
  tone?: Tone;
  progress?: number;
  delta?: string;
  index?: number;
  className?: string;
}) => {
  const t = TONES[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.04 * index } }}
      className={cn("stat-tile", className)}
      style={{ ["--tile-bar" as string]: t.bar }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">{value}</p>
          {caption && <p className="mt-1 text-[11px] text-muted-foreground truncate">{caption}</p>}
        </div>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", t.tile)}>
            <Icon className={cn("w-5 h-5", t.text)} />
          </div>
        )}
      </div>
      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: t.bar }}
          />
        </div>
      )}
      {delta && <p className={cn("mt-2 text-[11px] font-semibold", t.text)}>{delta}</p>}
    </motion.div>
  );
};

/** Circular completion gauge (Job Planning / Executive style). */
export const GaugeRing = ({
  value,
  label,
  tone = "gold",
  size = 120,
}: {
  value: number;
  label?: string;
  tone?: Tone;
  size?: number;
}) => {
  const t = TONES[tone];
  const pct = Math.max(0, Math.min(100, value));
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center justify-center" style={{ width: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={10} className="stroke-muted" fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={10}
          fill="none"
          stroke={t.ring}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * pct) / 100 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="-mt-[calc(50%+14px)] flex flex-col items-center">
        <span className="text-2xl font-bold text-foreground tabular-nums">{Math.round(pct)}%</span>
        {label && <span className="text-[11px] text-muted-foreground">{label}</span>}
      </div>
      <div style={{ height: size / 2 - 14 }} />
    </div>
  );
};

/** Titled content panel. */
export const SectionCard = ({
  title,
  icon: Icon,
  actions,
  children,
  className,
}: {
  title?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <div className={cn("data-card p-5", className)}>
    {(title || actions) && (
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="panel-header">
          {Icon && <Icon className="w-4 h-4 text-[hsl(var(--svo-gold))]" />}
          {title}
        </div>
        {actions}
      </div>
    )}
    {children}
  </div>
);

/** Deterministic gradient avatar with initials — used across people lists. */
export const PersonAvatar = ({
  name,
  src,
  size = 36,
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
}) => {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const hue = Array.from(name || "?").reduce((a, ch) => a + ch.charCodeAt(0), 0) % 360;
  return src ? (
    <img
      src={src}
      alt={name || "Member"}
      width={size}
      height={size}
      loading="lazy"
      className="rounded-full object-cover ring-2 ring-background shadow-sm"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-background shadow-sm"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 65% 58%))`,
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
};

/** Premium glowing area/line trend chart used across analytics surfaces. */
export const TrendChart = ({
  data,
  dataKey = "value",
  xKey = "label",
  tone = "gold",
  height = 180,
  secondKey,
  secondTone = "blue",
}: {
  data: Array<Record<string, number | string>>;
  dataKey?: string;
  xKey?: string;
  tone?: Tone;
  height?: number;
  secondKey?: string;
  secondTone?: Tone;
}) => {
  const t = TONES[tone];
  const t2 = TONES[secondTone];
  const id = `grad-${dataKey}-${tone}`;
  const id2 = `grad-${secondKey}-${secondTone}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={t.ring} stopOpacity={0.45} />
              <stop offset="100%" stopColor={t.ring} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={id2} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={t2.ring} stopOpacity={0.35} />
              <stop offset="100%" stopColor={t2.ring} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} width={34} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
              color: "hsl(var(--foreground))",
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={t.ring}
            strokeWidth={2.5}
            fill={`url(#${id})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
          />
          {secondKey && (
            <Area type="monotone" dataKey={secondKey} stroke={t2.ring} strokeWidth={2} fill={`url(#${id2})`} dot={false} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
