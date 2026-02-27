import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, Settings, Brain, ArrowDown } from "lucide-react";

const layers = [
  {
    icon: Zap,
    title: "Execution Layer",
    subtitle: "Layer 1 — Daily Workforce Activity",
    outcome: "Every action captured and structured.",
    description: "Attendance check-ins, task assignments, file sharing, team communication, and daily work logs — all in one system. Nothing falls through the cracks.",
    features: ["Report for Duty", "Task Pipeline", "Team Channels", "File Hub"],
    gradient: "from-svo-blue/10 to-svo-blue/5",
    iconBg: "bg-svo-blue/10",
    iconColor: "text-svo-blue",
  },
  {
    icon: Settings,
    title: "Control Layer",
    subtitle: "Layer 2 — Operational Metrics",
    outcome: "Tracked, measured, and enforced.",
    description: "KPIs, goals, workflow automation, approvals, SLA monitoring, and department analytics. Managers see what's happening without asking anyone.",
    features: ["KPI Dashboards", "Workflow Builder", "Approval Chains", "SLA Alerts"],
    gradient: "from-svo-gold/10 to-svo-gold/5",
    iconBg: "bg-svo-gold/10",
    iconColor: "text-svo-gold",
  },
  {
    icon: Brain,
    title: "Decision Layer",
    subtitle: "Layer 3 — AI Intelligence",
    outcome: "AI-generated insight for executives.",
    description: "Auto-generated company briefs, anomaly detection, predictive risk alerts, performance scoring, and department comparisons — intelligence that thinks for you.",
    features: ["AI Briefs", "Risk Detection", "Auto Reports", "Health Score"],
    gradient: "from-purple-500/10 to-purple-500/5",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
];

const ValueSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="features" className="py-24 md:py-32 bg-background relative">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-semibold text-svo-gold uppercase tracking-widest">Three Progressive Layers</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            Each layer feeds intelligence to the next.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Execution generates data. Control structures it. Decision acts on it. This is how a self-aware organization operates.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-6">
          {layers.map((layer, i) => (
            <div key={layer.title}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 * i }}
                className="glass-card-strong rounded-2xl p-8 md:p-10 flex flex-col md:flex-row gap-8 group"
              >
                <div className="md:w-16 shrink-0">
                  <div className={`w-14 h-14 rounded-xl ${layer.iconBg} flex items-center justify-center`}>
                    <layer.icon className={`w-7 h-7 ${layer.iconColor}`} />
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{layer.subtitle}</span>
                  <h3 className="mt-1 text-2xl font-bold text-foreground">{layer.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-svo-gold">{layer.outcome}</p>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xl">{layer.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {layer.features.map((f) => (
                      <span key={f} className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground font-medium">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
              {i < layers.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-5 h-5 text-muted-foreground/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueSection;
