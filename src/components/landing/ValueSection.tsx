import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, Settings, Brain } from "lucide-react";

const layers = [
  {
    icon: Zap,
    title: "Productivity Engine",
    subtitle: "Layer 1 — Execution",
    description: "Tasks, projects, attendance, daily check-ins, file sharing, and team communication — everything your workforce needs to operate daily.",
    features: ["Daily Check-in", "Task Management", "Team Chat", "File Sharing"],
    gradient: "from-svo-blue/10 to-svo-blue/5",
    iconBg: "bg-svo-blue/10",
    iconColor: "text-svo-blue",
  },
  {
    icon: Settings,
    title: "Operations Backbone",
    subtitle: "Layer 2 — Control",
    description: "KPIs, goals, workflow automation, approvals, department analytics, and SLA monitoring for complete operational oversight.",
    features: ["KPI Tracking", "Workflow Builder", "Approvals", "SLA Monitoring"],
    gradient: "from-svo-gold/10 to-svo-gold/5",
    iconBg: "bg-svo-gold/10",
    iconColor: "text-svo-gold",
  },
  {
    icon: Brain,
    title: "AI Management Intelligence",
    subtitle: "Layer 3 — Decision",
    description: "AI-generated briefs, anomaly detection, predictive alerts, performance insights, and executive dashboards that think for you.",
    features: ["AI Insights", "Risk Alerts", "Auto Reports", "Executive Brief"],
    gradient: "from-purple-500/10 to-purple-500/5",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
];

const ValueSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="features" className="py-24 md:py-32 bg-muted/30 relative">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-semibold text-svo-gold uppercase tracking-widest">Three Integrated Layers</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            One digital office. Three power layers.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Your office runs on all three at once — each layer feeds intelligence to the next, creating a self-aware organization.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 * i }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="glass-card-strong rounded-2xl p-8 flex flex-col group cursor-default"
            >
              <div className={`w-12 h-12 rounded-xl ${layer.iconBg} flex items-center justify-center mb-6`}>
                <layer.icon className={`w-6 h-6 ${layer.iconColor}`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{layer.subtitle}</span>
              <h3 className="mt-2 text-xl font-bold text-foreground">{layer.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{layer.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {layer.features.map((f) => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground font-medium">
                    {f}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueSection;
