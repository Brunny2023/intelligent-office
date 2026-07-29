import { motion } from "framer-motion";
import { useState } from "react";
import {
  ArrowDown, ArrowUp, Play, Building2, MessageSquare, Users, Database,
  Brain, Workflow, Target, TrendingUp, FileText, DollarSign, Sparkles,
  CircleDot, Layers, Network, Zap
} from "lucide-react";

const NAVY = "#0B1533";
const BONE = "#F5F1E8";
const GOLD = "#B8892E";

/* ------------------------------------------------------------------ */
/* 5-Minute Investor Brief                                             */
/* ------------------------------------------------------------------ */

export const InvestorBrief = () => {
  const items = [
    { k: "Problem", v: "Organizations have data. They do not have intelligence. Work fragments across 10–30 disconnected tools." },
    { k: "Solution", v: "The Organizational Intelligence Layer — delivered as an AI Business Operating System." },
    { k: "Market", v: "~$1.05T global enterprise software spend. ~$180B unified-suite SAM. Developed-market lead motion." },
    { k: "Why Now", v: "Generative AI has crossed utility; SaaS unbundling has run its course; the rebundling window is open." },
    { k: "Moat", v: "Graph-centric architecture that compounds with every user action. Incumbents cannot retrofit it." },
    { k: "Model", v: "Per-seat SaaS, tiered, with metered AI credits. 78–84% gross margin at scale, 108–125% NRR target." },
    { k: "Ask", v: "$1.5M pre-seed. 18–24 month runway. Design partners → PMF → Seed-ready close of period." },
    { k: "Traction", v: "Product built end-to-end across 20+ modules. Design partner pipeline forming." },
    { k: "Milestones", v: "Commercial launch, reference customers, repeatable acquisition, expansion-ready platform." },
  ];
  return (
    <section id="brief" className="scroll-mt-24 py-16 md:py-20 border-t" style={{ borderColor: `${NAVY}22` }}>
      <p className="text-[11px] tracking-[0.22em] uppercase mb-3" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>
        Executive Summary
      </p>
      <h2 className="text-3xl md:text-5xl leading-[1.05] mb-10 max-w-4xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY, fontWeight: 400, letterSpacing: "-0.01em" }}>
        The 5-Minute Investor Brief.
      </h2>
      <div className="grid md:grid-cols-3 gap-x-8 gap-y-6">
        {items.map((it, i) => (
          <motion.div
            key={it.k}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.03 }}
            className="border-t pt-4"
            style={{ borderColor: NAVY }}
          >
            <div className="text-[11px] tracking-[0.18em] uppercase mb-2" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>{it.k}</div>
            <p className="text-sm leading-[1.7]" style={{ color: `${NAVY}CC` }}>{it.v}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Missing Layer — Intelligence Stack diagram                         */
/* ------------------------------------------------------------------ */

const stack = [
  { label: "Business Outcomes", tone: "top", icon: TrendingUp },
  { label: "Executive Decisions", tone: "top", icon: Sparkles },
  { label: "Automation", tone: "top", icon: Workflow },
  { label: "Recommendations", tone: "top", icon: Brain },
  { label: "Organizational Intelligence Layer", tone: "core", icon: Network },
  { label: "Knowledge Graph", tone: "core-sub", icon: Database },
  { label: "People · Projects · Messages · Meetings", tone: "surface", icon: Users },
  { label: "Knowledge · Finance · HR · Customers", tone: "surface", icon: Layers },
];

export const IntelligenceStack = () => (
  <section id="missing-layer" className="scroll-mt-24 py-16 md:py-24 border-t" style={{ borderColor: `${NAVY}22` }}>
    <p className="text-[11px] tracking-[0.22em] uppercase mb-4" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Architecture</p>
    <h2 className="text-3xl md:text-5xl leading-[1.05] mb-4 max-w-4xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY, fontWeight: 400, letterSpacing: "-0.01em" }}>
      The Missing Layer in Enterprise Software.
    </h2>
    <p className="max-w-3xl text-[15px] md:text-base leading-[1.75] mb-12" style={{ color: `${NAVY}CC` }}>
      Traditional software manages functions. Global Office manages organizational intelligence. Operational surfaces stream data upward into a persistent knowledge graph; intelligence streams recommendations and automation back down.
    </p>

    <div className="relative max-w-3xl mx-auto">
      {stack.map((row, i) => {
        const isCore = row.tone === "core";
        const isCoreSub = row.tone === "core-sub";
        const isTop = row.tone === "top";
        return (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="relative flex items-center gap-4 mb-3 px-5 py-4 rounded-md"
            style={{
              background: isCore ? NAVY : isCoreSub ? `${NAVY}0D` : isTop ? "transparent" : `${NAVY}08`,
              border: `1px solid ${isCore ? GOLD : `${NAVY}22`}`,
              boxShadow: isCore ? `0 8px 40px -12px ${GOLD}66` : "none",
            }}
          >
            <row.icon className="w-5 h-5 shrink-0" style={{ color: isCore ? GOLD : NAVY, opacity: isCore ? 1 : 0.7 }} />
            <span
              className={isCore ? "text-lg md:text-xl" : "text-sm md:text-base"}
              style={{
                color: isCore ? BONE : NAVY,
                fontFamily: isCore ? "'Instrument Serif', Georgia, serif" : "'Space Grotesk', sans-serif",
                fontWeight: isCore ? 400 : 500,
                letterSpacing: isCore ? "-0.01em" : "0.02em",
                textTransform: isCore ? "none" : "uppercase",
                fontSize: isCore ? undefined : "12px",
              }}
            >
              {row.label}
            </span>
            {isCore && (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="ml-auto w-2 h-2 rounded-full"
                style={{ background: GOLD }}
              />
            )}
          </motion.div>
        );
      })}

      {/* Directional legend */}
      <div className="mt-8 grid grid-cols-2 gap-4 text-xs" style={{ color: `${NAVY}99` }}>
        <div className="flex items-center gap-2"><ArrowUp className="w-3.5 h-3.5" style={{ color: GOLD }} /> Data flows up into the intelligence layer</div>
        <div className="flex items-center gap-2"><ArrowDown className="w-3.5 h-3.5" style={{ color: GOLD }} /> Insight flows down into every workflow</div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Strategic Moat — Compounding Flywheel                              */
/* ------------------------------------------------------------------ */

const flywheel = [
  "More Users",
  "More Organizational Data",
  "Richer Knowledge Graph",
  "Smarter Organizational Intelligence",
  "Better Recommendations & Automation",
  "Higher Customer Value",
  "More Adoption & Expansion",
];

export const MoatFlywheel = () => (
  <section id="flywheel" className="scroll-mt-24 py-16 md:py-24 border-t" style={{ borderColor: `${NAVY}22` }}>
    <p className="text-[11px] tracking-[0.22em] uppercase mb-4" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Compounding Moat</p>
    <h2 className="text-3xl md:text-5xl leading-[1.05] mb-4 max-w-4xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY, fontWeight: 400, letterSpacing: "-0.01em" }}>
      The moat gets stronger every time a customer uses the product.
    </h2>
    <p className="max-w-3xl text-[15px] leading-[1.75] mb-12" style={{ color: `${NAVY}CC` }}>
      Organizational intelligence is not built once. It compounds — turning each customer engagement into a durable data advantage that is difficult to replicate and impossible to buy.
    </p>

    <div className="relative max-w-3xl mx-auto">
      <div className="grid gap-3">
        {flywheel.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="flex items-center gap-4"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: NAVY, color: BONE, fontFamily: "'Space Grotesk', sans-serif" }}>
              {i + 1}
            </div>
            <div className="flex-1 py-3 px-4 rounded-md border" style={{ borderColor: `${NAVY}22`, background: `${NAVY}05` }}>
              <span className="text-sm md:text-base" style={{ color: NAVY, fontFamily: "'Space Grotesk', sans-serif" }}>{step}</span>
            </div>
            {i < flywheel.length - 1 && <ArrowDown className="w-4 h-4" style={{ color: GOLD }} />}
            {i === flywheel.length - 1 && (
              <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>↺ loops</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Why Incumbents Can't Copy This                                      */
/* ------------------------------------------------------------------ */

const incumbents = [
  { name: "Microsoft", owns: "Documents", limit: "Document-centric architecture; org intelligence is retrofit onto Office artifacts." },
  { name: "Google", owns: "Communication", limit: "Communication-centric architecture; no operational substrate beneath messages." },
  { name: "Salesforce", owns: "Customers", limit: "CRM-centric; org intelligence stops at the pipeline edge." },
  { name: "SAP / Oracle", owns: "Resources", limit: "ERP-centric; brittle, expensive, months to deploy — inaccessible to modern SMEs." },
  { name: "Notion", owns: "Knowledge", limit: "Knowledge-centric; no execution, HR, finance, or intelligence layer." },
  { name: "Global Office", owns: "Organizational Intelligence", limit: "Graph-centric — every entity, action, and decision is a first-class citizen in one intelligence surface.", highlight: true },
];

export const IncumbentGrid = () => (
  <section id="incumbents" className="scroll-mt-24 py-16 md:py-24 border-t" style={{ borderColor: `${NAVY}22` }}>
    <p className="text-[11px] tracking-[0.22em] uppercase mb-4" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Structural Advantage</p>
    <h2 className="text-3xl md:text-5xl leading-[1.05] mb-4 max-w-4xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY, fontWeight: 400, letterSpacing: "-0.01em" }}>
      Why incumbents cannot easily copy this.
    </h2>
    <p className="max-w-3xl text-[15px] leading-[1.75] mb-10" style={{ color: `${NAVY}CC` }}>
      Every major enterprise platform was architected around one primary object. Retrofitting an organizational intelligence graph beneath decades-old products is not a feature update — it is an architectural rewrite against installed-base gravity.
    </p>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {incumbents.map(i => (
        <div
          key={i.name}
          className="p-6 rounded-md"
          style={{
            background: i.highlight ? NAVY : "transparent",
            border: `1px solid ${i.highlight ? GOLD : `${NAVY}22`}`,
            color: i.highlight ? BONE : NAVY,
          }}
        >
          <div className="text-[11px] tracking-[0.2em] uppercase mb-2" style={{ color: i.highlight ? GOLD : GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Owns {i.owns}</div>
          <div className="text-xl md:text-2xl mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>{i.name}</div>
          <p className="text-sm leading-[1.7]" style={{ color: i.highlight ? `${BONE}CC` : `${NAVY}CC` }}>{i.limit}</p>
        </div>
      ))}
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Product Proof — placeholder device mockups                         */
/* ------------------------------------------------------------------ */

import { ExecutiveView, WorkflowsView, GraphView, DashboardView } from "@/components/mockups/views";

const products = [
  { title: "AI Executive Control Center", desc: "Weighted health scores, anomaly detection, and cross-module signal in one command surface.", Preview: ExecutiveView },
  { title: "Workflow Builder",             desc: "Visual IF/THEN automation across every module — composed by operators, not engineers.",              Preview: WorkflowsView },
  { title: "Knowledge Graph Explorer",     desc: "Every person, task, message, and decision as a node — queryable and reasoned over.",                  Preview: GraphView },
  { title: "Organization Health Dashboard",desc: "Real activity, not self-reported dashboards. Attendance, execution, and coordination in one glance.", Preview: DashboardView },
];

export const ProductProof = () => (
  <section id="product-proof" className="scroll-mt-24 py-16 md:py-24 border-t" style={{ borderColor: `${NAVY}22` }}>
    <p className="text-[11px] tracking-[0.22em] uppercase mb-4" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Product</p>
    <h2 className="text-3xl md:text-5xl leading-[1.05] mb-4 max-w-4xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY, fontWeight: 400, letterSpacing: "-0.01em" }}>
      The intelligence layer, made tangible.
    </h2>
    <p className="max-w-3xl text-[15px] leading-[1.75] mb-10" style={{ color: `${NAVY}CC` }}>
      Four flagship surfaces demonstrate what an organizational intelligence layer looks like in daily operation. Full walkthroughs are available in the product demo.
    </p>
    <div className="grid md:grid-cols-2 gap-6">
      {products.map((p, i) => (
        <motion.div
          key={p.title}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="rounded-md overflow-hidden"
          style={{ border: `1px solid ${NAVY}22`, background: `${NAVY}05` }}
        >
          {/* MacBook-framed live mockup */}
          <div className="relative p-5" style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY}CC)` }}>
            <div className="rounded-lg overflow-hidden shadow-2xl border border-white/10 bg-white">
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-slate-200 bg-slate-50">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="aspect-[16/10] overflow-hidden relative bg-[#F5F6F8]">
                <div className="absolute inset-0 origin-top-left" style={{ transform: "scale(0.42)", width: "238%", height: "238%" }}>
                  <div className="p-6"><p.Preview /></div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="text-[11px] tracking-[0.2em] uppercase mb-2" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Module {i + 1}</div>
            <h3 className="text-xl mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY, fontWeight: 400 }}>{p.title}</h3>
            <p className="text-sm leading-[1.7]" style={{ color: `${NAVY}CC` }}>{p.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Demo Video                                                          */
/* ------------------------------------------------------------------ */

export const DemoVideoBlock = () => (
  <section id="demo-video" className="scroll-mt-24 py-16 md:py-24 border-t" style={{ borderColor: `${NAVY}22` }}>
    <p className="text-[11px] tracking-[0.22em] uppercase mb-4" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Product Walkthrough</p>
    <h2 className="text-3xl md:text-5xl leading-[1.05] mb-6 max-w-4xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY, fontWeight: 400, letterSpacing: "-0.01em" }}>
      See organizational intelligence in action.
    </h2>
    <div
      className="relative aspect-video max-w-4xl rounded-lg overflow-hidden group cursor-pointer"
      style={{ background: NAVY, border: `1px solid ${GOLD}44` }}
      onClick={() => window.open("/demo", "_blank")}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: GOLD, boxShadow: `0 0 40px ${GOLD}66` }}
        >
          <Play className="w-8 h-8 ml-1" style={{ color: NAVY }} fill={NAVY} />
        </motion.div>
        <p className="text-sm tracking-[0.2em] uppercase" style={{ color: BONE, fontFamily: "'Space Grotesk', sans-serif" }}>
          90-second walkthrough
        </p>
        <p className="text-xs" style={{ color: `${BONE}77` }}>Click to open the live product demo →</p>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Positioning Matrix                                                  */
/* ------------------------------------------------------------------ */

const matrix = [
  { name: "SAP", x: 0.35, y: 0.7 },
  { name: "Salesforce", x: 0.5, y: 0.4 },
  { name: "Microsoft", x: 0.4, y: 0.6 },
  { name: "Google", x: 0.3, y: 0.35 },
  { name: "Notion", x: 0.35, y: 0.2 },
  { name: "Monday", x: 0.25, y: 0.15 },
  { name: "Zoho", x: 0.3, y: 0.5 },
  { name: "Global Office", x: 0.85, y: 0.9, highlight: true },
];

export const PositioningMatrix = () => (
  <section id="positioning" className="scroll-mt-24 py-16 md:py-24 border-t" style={{ borderColor: `${NAVY}22` }}>
    <p className="text-[11px] tracking-[0.22em] uppercase mb-4" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Competitive Positioning</p>
    <h2 className="text-3xl md:text-5xl leading-[1.05] mb-6 max-w-4xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY, fontWeight: 400, letterSpacing: "-0.01em" }}>
      An empty quadrant, taken deliberately.
    </h2>
    <div className="relative max-w-3xl mx-auto aspect-square rounded-md" style={{ border: `1px solid ${NAVY}33`, background: `${NAVY}03` }}>
      {/* Axes */}
      <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: `${NAVY}22` }} />
      <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: `${NAVY}22` }} />
      {/* Axis labels */}
      <div className="absolute -bottom-8 left-0 right-0 text-center text-[11px] tracking-[0.2em] uppercase" style={{ color: `${NAVY}99`, fontFamily: "'Space Grotesk', sans-serif" }}>
        System Intelligence →
      </div>
      <div className="absolute top-1/2 -left-4 -translate-y-1/2 -rotate-90 origin-center text-[11px] tracking-[0.2em] uppercase whitespace-nowrap" style={{ color: `${NAVY}99`, fontFamily: "'Space Grotesk', sans-serif" }}>
        Business Surface Coverage →
      </div>
      {/* Quadrant label */}
      <div className="absolute top-4 right-4 text-[10px] tracking-[0.2em] uppercase" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>
        Intelligence Layer
      </div>
      {/* Points */}
      {matrix.map(p => (
        <div
          key={p.name}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${p.x * 100}%`, top: `${(1 - p.y) * 100}%` }}
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200 }}
            className={`rounded-full ${p.highlight ? "w-4 h-4" : "w-2.5 h-2.5"}`}
            style={{
              background: p.highlight ? GOLD : NAVY,
              boxShadow: p.highlight ? `0 0 24px ${GOLD}` : "none",
            }}
          />
          <span className={`mt-1 text-[10px] tracking-[0.1em] ${p.highlight ? "font-bold" : ""}`} style={{ color: p.highlight ? GOLD : `${NAVY}99`, fontFamily: "'Space Grotesk', sans-serif" }}>
            {p.name}
          </span>
        </div>
      ))}
    </div>
    <p className="text-xs mt-12 max-w-2xl italic" style={{ color: `${NAVY}88` }}>
      Illustrative positioning based on architectural centricity and functional coverage. Full analysis in the Phase 4 Competitive Analysis report.
    </p>
  </section>
);

/* ------------------------------------------------------------------ */
/* Validation Cards                                                    */
/* ------------------------------------------------------------------ */

const validationItems = [
  { label: "Design Partners", value: "—", note: "Cohort forming across Q1 2026" },
  { label: "Pilot Customers", value: "—", note: "Onboarding in staged rollout" },
  { label: "Waitlist Signups", value: "—", note: "Public list opens post-launch" },
  { label: "Customer Interviews", value: "40+", note: "SMEs across 4 launch geos" },
  { label: "Letters of Intent", value: "—", note: "Under NDA — data room" },
  { label: "Demos Completed", value: "—", note: "Live product surface, one-tap access" },
  { label: "Newsletter — Strategic Signal", value: "Growing", note: "Founder-led inbound channel" },
  { label: "Community", value: "—", note: "SME operator community forming" },
];

export const ValidationCards = () => (
  <section id="validation" className="scroll-mt-24 py-16 md:py-24 border-t" style={{ borderColor: `${NAVY}22` }}>
    <p className="text-[11px] tracking-[0.22em] uppercase mb-4" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Traction</p>
    <h2 className="text-3xl md:text-5xl leading-[1.05] mb-4 max-w-4xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY, fontWeight: 400, letterSpacing: "-0.01em" }}>
      Early market validation.
    </h2>
    <p className="max-w-3xl text-[15px] leading-[1.75] mb-10" style={{ color: `${NAVY}CC` }}>
      A pre-launch venture reporting only what is real. Placeholders scale as the design partner cohort activates through the seed period.
    </p>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {validationItems.map(v => (
        <div key={v.label} className="p-5 rounded-md" style={{ border: `1px solid ${NAVY}22`, background: `${NAVY}05` }}>
          <div className="text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>{v.label}</div>
          <div className="text-3xl mb-1" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY, fontWeight: 400 }}>{v.value}</div>
          <p className="text-[11px]" style={{ color: `${NAVY}88` }}>{v.note}</p>
        </div>
      ))}
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Roadmap Timeline                                                    */
/* ------------------------------------------------------------------ */

const roadmap = [
  { phase: "Discovery", note: "Problem discovery, category thesis" },
  { phase: "MVP", note: "20+ modules built end-to-end" },
  { phase: "Design Partners", note: "First cohort — deep engagement" },
  { phase: "Commercial Launch", note: "Public availability across geos" },
  { phase: "PMF", note: "Retention, NRR, reference cases" },
  { phase: "Regional Expansion", note: "UK/EU · developed-market lead" },
  { phase: "Enterprise", note: "Named-account motion, mid-market" },
  { phase: "Global Scale", note: "Ecosystem, marketplace, platform" },
];

export const RoadmapTimeline = () => (
  <section id="roadmap" className="scroll-mt-24 py-16 md:py-24 border-t" style={{ borderColor: `${NAVY}22` }}>
    <p className="text-[11px] tracking-[0.22em] uppercase mb-4" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Roadmap</p>
    <h2 className="text-3xl md:text-5xl leading-[1.05] mb-10 max-w-4xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY, fontWeight: 400, letterSpacing: "-0.01em" }}>
      From foundation to global scale.
    </h2>
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-px md:hidden" style={{ background: `${NAVY}22` }} />
      <div className="hidden md:block absolute left-0 right-0 top-4 h-px" style={{ background: `${NAVY}22` }} />
      <div className="grid md:grid-cols-8 gap-6 md:gap-3">
        {roadmap.map((r, i) => (
          <motion.div
            key={r.phase}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="relative pl-10 md:pl-0 md:pt-10"
          >
            <div className="absolute left-2.5 top-1.5 md:left-1/2 md:top-0 md:-translate-x-1/2 w-3 h-3 rounded-full ring-4" style={{ background: i <= 1 ? GOLD : NAVY, ["--tw-ring-color" as any]: BONE }} />
            <div className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: i <= 1 ? GOLD : `${NAVY}99`, fontFamily: "'Space Grotesk', sans-serif" }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="text-sm font-semibold mb-1" style={{ color: NAVY, fontFamily: "'Space Grotesk', sans-serif" }}>{r.phase}</div>
            <p className="text-xs leading-relaxed" style={{ color: `${NAVY}99` }}>{r.note}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Confidence Cards                                                    */
/* ------------------------------------------------------------------ */

const confidenceCards = [
  { label: "Estimated Market Size", value: "~$180B SAM", icon: TrendingUp },
  { label: "Launch Geographies", value: "US · UK · EU + SSA", icon: Building2 },
  { label: "Target Customer", value: "SMEs & mid-market (10–500)", icon: Users },
  { label: "Business Model", value: "Per-seat SaaS + AI credits", icon: DollarSign },
  { label: "AI Architecture", value: "Model-agnostic, tenant-isolated", icon: Brain },
  { label: "Funding Round", value: "$1.5M Pre-Seed", icon: Target },
  { label: "Runway", value: "18–24 months", icon: FileText },
  { label: "Expansion", value: "Developed-market lead motion", icon: Zap },
];

export const ConfidenceCards = () => (
  <section id="confidence" className="scroll-mt-24 py-16 md:py-24 border-t" style={{ borderColor: `${NAVY}22` }}>
    <p className="text-[11px] tracking-[0.22em] uppercase mb-4" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>At a Glance</p>
    <h2 className="text-3xl md:text-5xl leading-[1.05] mb-10 max-w-4xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY, fontWeight: 400, letterSpacing: "-0.01em" }}>
      The company, in eight cards.
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {confidenceCards.map(c => (
        <div key={c.label} className="p-5 rounded-md" style={{ border: `1px solid ${NAVY}22`, background: BONE }}>
          <c.icon className="w-4 h-4 mb-3" style={{ color: GOLD }} />
          <div className="text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: `${NAVY}99`, fontFamily: "'Space Grotesk', sans-serif" }}>{c.label}</div>
          <div className="text-lg leading-tight" style={{ color: NAVY, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}>{c.value}</div>
        </div>
      ))}
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Closing Statement                                                   */
/* ------------------------------------------------------------------ */

export const ClosingStatement = () => (
  <section className="py-24 md:py-32 border-t" style={{ borderColor: `${NAVY}22` }}>
    <motion.blockquote
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8 }}
      className="max-w-4xl text-2xl md:text-4xl lg:text-5xl leading-[1.2]"
      style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY, fontWeight: 400, letterSpacing: "-0.01em" }}
    >
      We believe the next generation of enterprise software will not be defined by better tools.
      <span className="block mt-6" style={{ color: `${NAVY}99` }}>
        It will be defined by systems that understand organizations.
      </span>
      <span className="block mt-6" style={{ color: GOLD }}>
        Global Office is building that system.
      </span>
    </motion.blockquote>
  </section>
);