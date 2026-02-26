import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Soteria replaced 6 different tools for us. Our team finally operates as one unit, even across 3 continents.",
    name: "Amara Okafor",
    role: "COO, TechBridge Africa",
    stars: 5,
  },
  {
    quote: "The executive dashboard alone saved us 10 hours a week. We make decisions in minutes, not days.",
    name: "James Whitfield",
    role: "CEO, Meridian Consulting",
    stars: 5,
  },
  {
    quote: "Daily check-ins and AI insights transformed how we manage our remote workforce. It's like having a 24/7 operations center.",
    name: "Priya Sharma",
    role: "VP Operations, CloudScale",
    stars: 5,
  },
];

const TestimonialsSection = () => {
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
          <span className="text-xs font-semibold text-svo-gold uppercase tracking-widest">Testimonials</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            Trusted by forward-thinking teams
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="glass-card-strong rounded-2xl p-8 flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-svo-gold text-svo-gold" />
                ))}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed flex-1 italic">"{t.quote}"</p>
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
