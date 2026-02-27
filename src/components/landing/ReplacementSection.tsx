import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Check } from "lucide-react";

const replacements = [
  { tool: "Slack / Teams", replaced: "Corporate Communication Hub", cost: "$8/user" },
  { tool: "Trello / ClickUp / Asana", replaced: "Unified Execution Engine", cost: "$12/user" },
  { tool: "Google Docs / Notion", replaced: "Secure Knowledge Infrastructure", cost: "$10/user" },
  { tool: "Clockify / Hubstaff", replaced: "Attendance & Workforce Presence", cost: "$7/user" },
  { tool: "Tableau / Databox", replaced: "Executive Intelligence Layer", cost: "$15/user" },
  { tool: "Zapier / Make", replaced: "Workflow Automation Engine", cost: "$10/user" },
];

const ReplacementSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 md:py-32 bg-muted/30 relative">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-semibold text-svo-gold uppercase tracking-widest">Consolidation</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            What Soteria Replaces
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Stop paying for disconnected tools that don't talk to each other.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-3">
          {replacements.map((item, i) => (
            <motion.div
              key={item.tool}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.08 * i }}
              className="glass-card rounded-xl p-4 md:p-5 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground line-through">{item.tool}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-svo-gold shrink-0" />
                  <span className="text-sm font-semibold text-foreground">{item.replaced}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{item.cost}</span>
            </motion.div>
          ))}
        </div>

        {/* ROI Block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 max-w-3xl mx-auto"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-8 text-center border-destructive/15">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wide mb-3">Typical 50-Person Stack</p>
              <p className="text-5xl font-bold text-foreground">$62<span className="text-lg font-medium text-muted-foreground">+</span></p>
              <p className="text-sm text-muted-foreground mt-1">/user/month across 6+ tools</p>
              <p className="mt-4 text-xs text-muted-foreground">No unified data. No intelligence. No control.</p>
            </div>
            <div className="glass-card-strong rounded-2xl p-8 text-center border-svo-gold/20">
              <p className="text-xs font-semibold text-svo-gold uppercase tracking-wide mb-3">Soteria — Full Operating System</p>
              <p className="text-5xl font-bold text-foreground">$49</p>
              <p className="text-sm text-muted-foreground mt-1">/user/month — everything included</p>
              <div className="mt-4 flex flex-col gap-1">
                <span className="text-xs text-svo-gold flex items-center justify-center gap-1">
                  <Check className="w-3 h-3" /> AI-powered intelligence included
                </span>
                <span className="text-xs text-svo-gold flex items-center justify-center gap-1">
                  <Check className="w-3 h-3" /> Single source of truth
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ReplacementSection;
