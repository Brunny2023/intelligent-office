import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How quickly can my team get started?",
    a: "Most organizations are fully onboarded within 24 hours. Simply create your account, invite your team, and configure departments. No complex setup or IT involvement needed.",
  },
  {
    q: "Is Global Office suitable for remote and hybrid teams?",
    a: "Absolutely. Global Office was designed specifically for distributed teams. Daily check-ins, real-time presence tracking, and communication tools ensure your team stays connected regardless of location or timezone.",
  },
  {
    q: "How does the attendance system work?",
    a: "Team members check in daily through a simple 'Report for Duty' action. The system records timestamps, tracks presence throughout the day, and provides managers with real-time attendance dashboards and analytics.",
  },
  {
    q: "Can we white-label Global Office for our organization?",
    a: "Yes — our Enterprise plan includes full white-label capabilities with custom branding, logo, domain, and color schemes to make the platform truly yours.",
  },
  {
    q: "What security standards does Global Office meet?",
    a: "We implement end-to-end encryption, role-based access control, complete data isolation between organizations, and full audit trails. We support GDPR and NDPR compliance requirements.",
  },
  {
    q: "Can I cancel or change plans anytime?",
    a: "Yes. You can upgrade, downgrade, or cancel your subscription at any time. There are no long-term contracts on our standard plans.",
  },
];

const FAQSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 md:py-32 bg-background relative">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="text-xs font-semibold text-svo-gold uppercase tracking-widest">FAQ</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            Common questions, clear answers
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="glass-card rounded-xl px-6 border-border/50"
              >
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline text-left py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
