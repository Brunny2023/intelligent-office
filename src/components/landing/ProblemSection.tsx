import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { X, AlertTriangle, EyeOff, BarChart3, Radio, ArrowRight } from "lucide-react";

const consequences = [
  { icon: EyeOff, title: "Zero Executive Visibility", description: "Leadership makes decisions on gut feeling, not data. No real-time view of who's working, what's progressing, or where bottlenecks form." },
  { icon: AlertTriangle, title: "No Attendance Control", description: "Staff clock-in across timezones with no unified presence system. Managers discover absences hours too late." },
  { icon: BarChart3, title: "No Unified KPI Tracking", description: "Performance data lives in 5 different tools. Monthly reports take days to compile. KPIs are lagging, not leading." },
  { icon: Radio, title: "No Organizational Awareness", description: "Departments operate in silos. No live feed. No cross-team visibility. No single source of operational truth." },
];

const ProblemSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 md:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-semibold text-destructive uppercase tracking-widest">The Real Cost of Fragmentation</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            Multiple tools ={" "}
            <span className="text-destructive">zero operational intelligence</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Your company runs on 8+ disconnected apps. The result isn't flexibility — it's blindness. Here's what fragmentation actually costs you:
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          {consequences.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="glass-card rounded-xl p-6 border-destructive/10"
            >
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-base font-bold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Resolution */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-3xl mx-auto glass-card-strong rounded-2xl p-8 md:p-10 text-center border-svo-gold/20"
        >
          <div className="w-12 h-12 rounded-xl bg-svo-gold/10 flex items-center justify-center mx-auto mb-4">
            <ArrowRight className="w-6 h-6 text-svo-gold" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-foreground">
            Soteria is the centralized intelligence layer over your entire workforce.
          </h3>
          <p className="mt-3 text-muted-foreground">
            One login. One system. One source of operational truth — with AI that watches, learns, and alerts.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;
