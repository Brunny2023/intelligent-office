import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Productivity",
    tagline: "Workforce Coordination",
    description: "Attendance, tasks, and communication for teams getting started.",
    monthly: 15,
    yearly: 12,
    features: ["Up to 25 users", "Daily check-in & attendance", "Task & project management", "Team communication", "File sharing (5 GB)", "Email support"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Operations",
    tagline: "Operational Control",
    description: "Full management oversight with KPIs, workflows, and analytics.",
    monthly: 35,
    yearly: 29,
    features: ["Up to 100 users", "Everything in Productivity", "KPI dashboards & goals", "Workflow automation", "Approval chains", "Department analytics", "25 GB storage", "Priority support"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Intelligence",
    tagline: "AI-Driven Management",
    description: "Executive intelligence layer with AI insights and predictive alerts.",
    monthly: 69,
    yearly: 49,
    features: ["Up to 500 users", "Everything in Operations", "AI company briefs", "Anomaly detection", "Predictive risk alerts", "Executive dashboards", "Custom report builder", "100 GB storage"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Enterprise",
    tagline: "White-Label Infrastructure",
    description: "Full corporate OS with custom branding, SSO, and dedicated support.",
    monthly: null,
    yearly: null,
    features: ["Unlimited users", "Everything in Intelligence", "White-label branding", "Custom domain", "SSO & SAML", "Unlimited storage", "SLA guarantee", "Dedicated CSM", "API access"],
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
            One platform. Four capability levels.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Each tier unlocks a new operational layer. Start coordinating, scale to intelligence.
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
              Yearly <span className="text-svo-gold text-xs font-semibold ml-1">Save 20%+</span>
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
              <p className="text-xs font-semibold text-svo-gold uppercase tracking-wide mt-0.5">{plan.tagline}</p>
              <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
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
