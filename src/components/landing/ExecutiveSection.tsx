import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Eye, TrendingUp, Users, BarChart3, AlertTriangle, FileText } from "lucide-react";

const executiveFeatures = [
  { icon: Eye, title: "Attendance Visibility", description: "Real-time view of your entire workforce. Who's online, who's late, who's absent — across every department and timezone." },
  { icon: TrendingUp, title: "Productivity Heatmaps", description: "Visual breakdown of team output by department, project, and individual. Spot trends before they become problems." },
  { icon: Users, title: "Department Comparison", description: "Side-by-side performance analytics across departments. Identify top performers and teams that need support." },
  { icon: BarChart3, title: "KPI Alignment Scoring", description: "Every team member's work mapped to organizational KPIs. See who's driving results and who's drifting." },
  { icon: AlertTriangle, title: "AI Anomaly Detection", description: "Automatic alerts for sudden productivity drops, missed deadlines, overloaded teams, and KPI deviations." },
  { icon: FileText, title: "Auto-Generated Briefs", description: "AI-written company briefings delivered daily. Skip the meetings — read the intelligence." },
];

const ExecutiveSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 md:py-32 bg-background relative">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-semibold text-svo-gold uppercase tracking-widest">Executive Layer</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            Built for Leadership, Not Just Teams.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Most tools serve individual contributors. Soteria serves the people who run the company.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {executiveFeatures.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass-card-strong rounded-xl p-6 group cursor-default"
            >
              <div className="w-10 h-10 rounded-lg bg-svo-gold/10 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-svo-gold" />
              </div>
              <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExecutiveSection;
