import { motion } from "framer-motion";
import EmbeddedTour from "@/components/mockups/EmbeddedTour";

const LiveDemoSection = () => {
  return (
    <section id="live-demo" className="scroll-mt-24 py-20 md:py-28 bg-svo-navy relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      <div className="container relative z-10 mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-svo-gold/30 bg-svo-gold/10 mb-4"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-svo-gold animate-pulse" />
            <span className="text-[11px] font-medium text-svo-gold tracking-widest uppercase">Live Demo</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-primary-foreground mb-4"
          >
            See Global Office in motion.
          </motion.h2>
          <p className="text-primary-foreground/60 text-base md:text-lg">
            A continuously looping tour of every module — sample org "Aurora Labs". Click any module in the sidebar to jump ahead, or expand to fullscreen.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <EmbeddedTour />
        </motion.div>
      </div>
    </section>
  );
};

export default LiveDemoSection;