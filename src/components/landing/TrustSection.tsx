import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Lock, Eye, FileCheck, Server, Globe } from "lucide-react";

const trustItems = [
  { icon: Lock, title: "End-to-End Encryption", description: "All data encrypted in transit and at rest with AES-256." },
  { icon: Shield, title: "Role-Based Access", description: "Granular permissions from Owner to Auditor with custom matrices." },
  { icon: Server, title: "Data Isolation", description: "Complete tenant isolation — your data never touches another organization." },
  { icon: Eye, title: "Audit Trail", description: "Every action logged with timestamp, user, and context for compliance." },
  { icon: FileCheck, title: "GDPR & NDPR Ready", description: "Built-in compliance toggles for global data protection regulations." },
  { icon: Globe, title: "Global Infrastructure", description: "Multi-region deployment with 99.99% uptime SLA guarantee." },
];

const TrustSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="trust" className="py-24 md:py-32 bg-muted/30 relative">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-semibold text-svo-gold uppercase tracking-widest">Enterprise Security</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            Built on trust. Designed for compliance.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Security isn't a feature — it's the foundation of every line of code.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {trustItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i }}
              className="glass-card rounded-xl p-6 group hover:border-svo-gold/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-svo-navy/5 flex items-center justify-center mb-4 group-hover:bg-svo-gold/10 transition-colors">
                <item.icon className="w-5 h-5 text-svo-navy group-hover:text-svo-gold transition-colors" />
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

export default TrustSection;
