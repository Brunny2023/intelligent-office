import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Productivity",
    description: "For small teams getting started",
    monthly: 12,
    yearly: 9,
    features: ["Up to 25 users", "Task management", "Team chat", "Daily check-in", "5 GB storage", "Email support"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Operations",
    description: "For growing organizations",
    monthly: 29,
    yearly: 24,
    features: ["Up to 100 users", "Everything in Productivity", "KPI dashboards", "Workflow automation", "Approval workflows", "25 GB storage", "Priority support"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Intelligence",
    description: "For data-driven enterprises",
    monthly: 59,
    yearly: 49,
    features: ["Up to 500 users", "Everything in Operations", "AI insights & alerts", "Executive dashboards", "Custom reports", "100 GB storage", "Dedicated support"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Enterprise",
    description: "For global organizations",
    monthly: null,
    yearly: null,
    features: ["Unlimited users", "Everything in Intelligence", "White-label branding", "Custom domain", "SSO & SAML", "Unlimited storage", "SLA guarantee", "Dedicated CSM"],
    cta: "Contact Sales",
    popular: false,
  },
];

const PricingSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [yearly, setYearly] = useState(true);

  return (
    <section ref={ref} id="pricing" className="py-24 md:py-32 bg-background relative">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="text-xs font-semibold text-svo-gold uppercase tracking-widest">Pricing</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            Scale as you grow
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when you're ready.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-muted rounded-xl p-1">
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!yearly ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${yearly ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              Yearly <span className="text-svo-gold text-xs font-semibold ml-1">Save 20%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className={`rounded-2xl p-6 flex flex-col relative ${
                plan.popular
                  ? "glass-card-strong border-svo-gold/30 ring-1 ring-svo-gold/20"
                  : "glass-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-svo-gold text-svo-navy text-xs font-bold">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              <div className="mt-4 mb-6">
                {plan.monthly ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">${yearly ? plan.yearly : plan.monthly}</span>
                    <span className="text-sm text-muted-foreground">/user/mo</span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-foreground">Custom</span>
                )}
              </div>
              <ul className="flex-1 space-y-3 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-svo-gold shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full rounded-xl ${
                  plan.popular
                    ? "bg-svo-gold text-svo-navy hover:bg-svo-gold/90 font-semibold"
                    : ""
                }`}
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
