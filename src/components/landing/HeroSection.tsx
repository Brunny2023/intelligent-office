import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Users, BarChart3, Clock, Brain, CheckCircle, MessageSquare } from "lucide-react";

const floatingCards = [
  { icon: Users, label: "47 Active", sub: "Workforce online now", x: "3%", y: "22%", delay: 0.8 },
  { icon: BarChart3, label: "92/100", sub: "Company health score", x: "80%", y: "15%", delay: 1.0 },
  { icon: Clock, label: "09:01 AM", sub: "Sarah reported for duty", x: "83%", y: "55%", delay: 1.2 },
  { icon: Brain, label: "AI Brief", sub: "3 department risks flagged", x: "1%", y: "65%", delay: 1.4 },
];

const proofPoints = [
  "Attendance & Presence",
  "Task Execution",
  "Team Communication",
  "KPI Dashboards",
  "Executive Intelligence",
  "AI Decision Support",
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero-bg pt-16">
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

      <div className="container relative z-10 mx-auto px-4 md:px-8 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-svo-gold/30 bg-svo-gold/10 mb-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-svo-gold animate-pulse" />
            <span className="text-xs font-medium text-svo-gold-light tracking-wide uppercase">
              The AI-Native Corporate Operating System
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-primary-foreground leading-[1.1] text-balance"
          >
            Replace 8 Tools.{" "}
            <br className="hidden sm:block" />
            Run One <span className="gradient-text">Intelligent Company.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 text-lg md:text-xl text-primary-foreground/60 max-w-2xl mx-auto leading-relaxed"
          >
            Soteria centralizes attendance, task execution, communication, KPI tracking, executive dashboards, and AI intelligence into one system. No more app-switching. No more blind spots.
          </motion.p>

          {/* Proof points */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2"
          >
            {proofPoints.map((point) => (
              <span key={point} className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/50">
                <CheckCircle className="w-3.5 h-3.5 text-svo-gold" />
                {point}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="bg-svo-gold text-svo-navy hover:bg-svo-gold/90 font-semibold text-base px-8 h-12 rounded-xl shadow-lg"
              style={{ boxShadow: "0 8px 32px -8px hsl(38 80% 55% / 0.4)" }}
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5 font-medium text-base h-12 rounded-xl"
            >
              <Play className="w-4 h-4 mr-2" />
              Watch Demo
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-12 flex items-center justify-center gap-8 text-primary-foreground/40 text-xs"
          >
            <span>No credit card required</span>
            <span className="w-1 h-1 rounded-full bg-primary-foreground/20" />
            <span>14-day free trial</span>
            <span className="w-1 h-1 rounded-full bg-primary-foreground/20 hidden sm:block" />
            <span className="hidden sm:block">SOC 2 compliant</span>
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
