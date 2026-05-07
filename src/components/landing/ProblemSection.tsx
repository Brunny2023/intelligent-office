import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { X, Check, ArrowRight } from "lucide-react";

const scattered = [
  "Email chains", "Slack messages", "Zoom calls", "Google Docs",
  "Trello boards", "Spreadsheets", "WhatsApp groups", "Notion pages"
];

const unified = [
  "Attendance & Presence", "Task Execution", "Team Communication",
  "KPI Intelligence", "Document Hub", "Executive Dashboard"
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
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            Your company is <span className="text-destructive">fragmented</span> across dozens of tools
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every disconnected tool is a leak in your operational intelligence.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card rounded-2xl p-8 border-destructive/20"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-sm font-semibold text-destructive uppercase tracking-wide">Before My Office</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {scattered.map((item) => (
                <span key={item} className="px-3 py-1.5 rounded-lg bg-destructive/5 border border-destructive/10 text-sm text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              8+ tools. No unified view. No intelligence. No control.
            </p>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-card-strong rounded-2xl p-8 border-svo-gold/20 relative"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-svo-gold/10 flex items-center justify-center">
                <Check className="w-4 h-4 text-svo-gold" />
              </div>
              <span className="text-sm font-semibold text-svo-gold uppercase tracking-wide">With My Office</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {unified.map((item) => (
                <span key={item} className="px-3 py-1.5 rounded-lg bg-svo-gold/5 border border-svo-gold/15 text-sm font-medium text-foreground">
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm text-foreground/70">
              One platform. Full visibility. AI-powered decisions.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
