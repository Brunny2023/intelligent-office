import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Users, BarChart3, Brain, Clock } from "lucide-react";

const floatingCards = [
  { icon: Users, label: "12 Online", sub: "3 departments active", x: "5%", y: "20%", delay: 0.8 },
  { icon: BarChart3, label: "94%", sub: "Team efficiency", x: "78%", y: "15%", delay: 1.0 },
  { icon: Clock, label: "09:01 AM", sub: "Sarah checked in", x: "85%", y: "55%", delay: 1.2 },
  { icon: Brain, label: "AI Insight", sub: "2 risks detected", x: "2%", y: "65%", delay: 1.4 },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-start md:items-center justify-center overflow-hidden gradient-hero-bg pt-16">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(38 80% 55% / 0.15), transparent)" }}
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.08, 0.05] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(210 90% 55% / 0.1), transparent)" }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container relative z-10 mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-svo-gold/30 bg-svo-gold/10 mb-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-svo-gold animate-pulse" />
            <span className="text-xs font-medium text-svo-gold-light tracking-wide uppercase">
              The Intelligent Digital Office
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-primary-foreground leading-[1.1] text-balance"
          >
            Run your whole company{" "}
            <span className="gradient-text">without the bricks</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 text-lg md:text-xl text-primary-foreground/60 max-w-2xl mx-auto text-balance leading-relaxed"
          >
            Global Office is the intelligent digital office where your business actually
            operates — people, execution, meetings, HR and finance in one place, run on an
            AI cognition layer with a virtual C-suite, expert consultants, and AI-run
            departments that reason, decide, and remember on your own data.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-svo-gold text-svo-navy hover:bg-svo-gold/90 font-semibold text-base px-8 h-12 rounded-xl shadow-lg"
                style={{ boxShadow: "0 8px 32px -8px hsl(38 80% 55% / 0.4)" }}
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <a href="#live-demo">
              <Button
                variant="ghost"
                size="lg"
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5 font-medium text-base h-12 rounded-xl"
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Live Demo
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 flex items-center justify-center gap-8 text-primary-foreground/40 text-xs"
          >
            <span>No credit card required</span>
            <span className="w-1 h-1 rounded-full bg-primary-foreground/20" />
            <span>14-day free trial</span>
            <span className="w-1 h-1 rounded-full bg-primary-foreground/20 hidden sm:block" />
            <span className="hidden sm:block">Enterprise ready</span>
          </motion.div>
        </div>

        {/* Floating dashboard preview cards */}
        <div className="hidden lg:block">
          {floatingCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: card.delay }}
              className="absolute glass-card rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ left: card.x, top: card.y, background: "hsl(0 0% 100% / 0.07)", backdropFilter: "blur(20px)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
            >
              <div className="w-9 h-9 rounded-lg bg-svo-gold/15 flex items-center justify-center">
                <card.icon className="w-4 h-4 text-svo-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">{card.label}</p>
                <p className="text-xs text-primary-foreground/50">{card.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
