import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Clock, CheckSquare, MessageSquare, BarChart3, FileText } from "lucide-react";

const modules = [
  {
    id: "attendance",
    icon: Clock,
    label: "Attendance",
    title: "Digital Attendance & Workforce Presence",
    description: "Daily report-for-duty check-ins, clock-in/out with timestamps, geo-validation, leave management, and real-time presence dashboards. Executives see who's working, from where, at all times.",
    capabilities: [
      "One-tap daily check-in with timestamp",
      "Real-time presence dashboard per department",
      "Late / absent / on-leave status tracking",
      "PTO request and approval workflow",
      "Manager daily attendance summary",
    ],
  },
  {
    id: "execution",
    icon: CheckSquare,
    label: "Execution",
    title: "Unified Execution Engine",
    description: "Projects, tasks, subtasks, dependencies, recurring workflows, and AI-powered priority scoring. Every piece of work tracked from assignment to completion with full accountability.",
    capabilities: [
      "Project → Task → Subtask hierarchy",
      "Status lifecycle: To Do → Done",
      "Recurring tasks and templates",
      "AI workload balancing and priority scoring",
      "Personal daily work dashboard",
    ],
  },
  {
    id: "communication",
    icon: MessageSquare,
    label: "Communication",
    title: "Corporate Communication Hub",
    description: "Direct messaging, department channels, threaded conversations, @mentions, file sharing, announcements with mandatory read tracking — all searchable, all in one place.",
    capabilities: [
      "Direct messages and group channels",
      "Department-level and company-wide feeds",
      "Threaded replies with @mentions",
      "File sharing with version control",
      "Announcement broadcast with read receipts",
    ],
  },
  {
    id: "intelligence",
    icon: BarChart3,
    label: "Intelligence",
    title: "Executive Intelligence Layer",
    description: "AI-generated company briefs, KPI dashboards, anomaly detection, productivity trends, and department performance comparisons. Decisions in minutes, not days.",
    capabilities: [
      "Company health score and trend analysis",
      "Department performance comparison",
      "AI anomaly detection and risk alerts",
      "Auto-generated executive briefs",
      "Custom KPI tracking per role",
    ],
  },
  {
    id: "documents",
    icon: FileText,
    label: "Knowledge",
    title: "Secure Knowledge Infrastructure",
    description: "Organization-wide file storage, version control, approval workflows, SOP library, and AI-powered document search across your entire knowledge base.",
    capabilities: [
      "Centralized document repository",
      "Version history and approval workflows",
      "Role-based access per folder",
      "AI-powered search across all files",
      "SOP and policy library",
    ],
  },
];

const FeaturesShowcase = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [active, setActive] = useState(0);
  const current = modules[active];

  return (
    <section ref={ref} className="py-24 md:py-32 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-semibold text-svo-gold uppercase tracking-widest">Core Modules</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            Everything your company needs to operate. Digitally.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Each module is purpose-built for corporate operations — not repurposed from consumer tools.
          </p>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-svo-gold/10 flex items-center justify-center">
              <current.icon className="w-5 h-5 text-svo-gold" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground">{current.title}</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">{current.description}</p>

          <div className="mt-8 space-y-3">
            {current.capabilities.map((cap, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-svo-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-svo-gold" />
                </div>
                <span className="text-foreground/80">{cap}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesShowcase;
