import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Clock, CheckSquare, MessageSquare, BarChart3, FileText, Shield } from "lucide-react";

const modules = [
  {
    id: "attendance",
    icon: Clock,
    label: "Attendance",
    title: "Digital Attendance & Workforce Presence",
    description: "Daily check-ins, clock-in/out with timestamps, geo-validation, leave management, and real-time presence dashboards. Know who's working, from where, at all times.",
    stats: [
      { label: "Check-in rate", value: "98.2%" },
      { label: "On time", value: "94%" },
      { label: "Active now", value: "127" },
    ],
  },
  {
    id: "execution",
    icon: CheckSquare,
    label: "Execution",
    title: "Unified Execution Engine",
    description: "Projects, tasks, subtasks, dependencies, recurring workflows, and AI-powered priority scoring. Every piece of work tracked from assignment to completion.",
    stats: [
      { label: "Tasks completed", value: "1,247" },
      { label: "On track", value: "89%" },
      { label: "Sprint velocity", value: "↑12%" },
    ],
  },
  {
    id: "communication",
    icon: MessageSquare,
    label: "Communication",
    title: "Corporate Communication Hub",
    description: "Direct messaging, department channels, threaded conversations, @mentions, file sharing, announcements, and read receipts — all searchable.",
    stats: [
      { label: "Channels", value: "24" },
      { label: "Messages today", value: "1.2K" },
      { label: "Response time", value: "4 min" },
    ],
  },
  {
    id: "intelligence",
    icon: BarChart3,
    label: "Intelligence",
    title: "Executive Intelligence Layer",
    description: "AI-generated company briefs, KPI dashboards, anomaly detection, productivity trends, and department performance comparisons — at a glance.",
    stats: [
      { label: "Health score", value: "92/100" },
      { label: "Risks flagged", value: "3" },
      { label: "Efficiency", value: "↑8%" },
    ],
  },
  {
    id: "documents",
    icon: FileText,
    label: "Documents",
    title: "Secure Knowledge Infrastructure",
    description: "Organization-wide file storage, version control, approval workflows, SOP library, and AI-powered document search across your entire knowledge base.",
    stats: [
      { label: "Documents", value: "3,891" },
      { label: "SOPs", value: "156" },
      { label: "Storage", value: "24 GB" },
    ],
  },
];

const FeaturesShowcase = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [active, setActive] = useState(0);
  const current = modules[active];

  return (
    <section ref={ref} className="py-24 md:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-semibold text-svo-gold uppercase tracking-widest">Core Modules</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            Everything your office needs. Digitally.
          </h2>
        </motion.div>

        {/* Module tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {modules.map((mod, i) => (
            <button
              key={mod.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active === i
                  ? "bg-svo-navy text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <mod.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{mod.label}</span>
            </button>
          ))}
        </div>

        {/* Active module preview */}
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-4xl mx-auto glass-card-strong rounded-2xl p-8 md:p-12"
        >
          <div className="flex items-start sm:items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-svo-gold/10 flex items-center justify-center shrink-0">
              <current.icon className="w-5 h-5 text-svo-gold" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{current.title}</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">{current.description}</p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {current.stats.map((stat) => (
              <div key={stat.label} className="bg-muted/50 rounded-xl p-4 text-center">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesShowcase;
