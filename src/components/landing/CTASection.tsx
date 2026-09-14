import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 md:py-32 relative overflow-hidden gradient-hero-bg">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(38 80% 55% / 0.3), transparent)" }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground text-balance leading-[1.1]">
            Move into your{" "}
            <span className="gradient-text">intelligent digital office</span>
          </h2>
          <p className="mt-6 text-lg text-primary-foreground/60 max-w-xl mx-auto">
            Join forward-thinking organizations already running their entire operation — without the bricks — through Intelligent Office.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-svo-gold text-svo-navy hover:bg-svo-gold/90 font-semibold text-base px-8 h-12 rounded-xl"
                style={{ boxShadow: "0 8px 32px -8px hsl(38 80% 55% / 0.4)" }}
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="lg"
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5 font-medium text-base h-12 rounded-xl"
            >
              Schedule a Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
