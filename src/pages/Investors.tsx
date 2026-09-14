import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Download, Lock, Printer, Video, Linkedin, ShieldCheck } from "lucide-react";
import { generateSecurityPack } from "@/components/trust/SecurityPackButton";
import BookMeetingDialog from "@/components/investors/BookMeetingDialog";
import RequestAccessDialog from "@/components/investors/RequestAccessDialog";
import VerifiedMetrics from "@/components/investors/VerifiedMetrics";
import { useInvestorAnalytics } from "@/hooks/useInvestorAnalytics";
import {
  InvestorBrief, IntelligenceStack, MoatFlywheel, IncumbentGrid,
  ProductProof, DemoVideoBlock, PositioningMatrix, ValidationCards,
  RoadmapTimeline, ConfidenceCards, ClosingStatement,
} from "@/components/investors/InvestorSections";

// ---------------------------------------------------------------------------
// Intelligent Office — Private Investor Brief
// Route: /investors  (unlisted, noindex, not linked from nav or footer)
// Design intent: institutional editorial. Deep navy on bone, serif display,
// footnoted citations. Every claim is either cited or labelled as an
// assumption. Pre-seed, pre-launch posture is stated plainly.
// ---------------------------------------------------------------------------

const NAVY = "#0B1533";
const BONE = "#F5F1E8";
const GOLD = "#B8892E";
const RULE = "#0B1533";

type Citation = { n: number; text: string; url?: string };
const CITATIONS: Citation[] = [
  { n: 1, text: "Gartner, Forecast: Enterprise Software Spending, Worldwide, 2024–2028." , url: "https://www.gartner.com/en/newsroom/press-releases" },
  { n: 2, text: "IDC, Worldwide Semiannual Software Tracker, 2024H2." , url: "https://www.idc.com/" },
  { n: 3, text: "Statista, SaaS Market Size Worldwide 2015–2030 (published 2024)." , url: "https://www.statista.com/statistics/510333/worldwide-public-cloud-computing/" },
  { n: 4, text: "McKinsey & Company, The economic potential of generative AI: The next productivity frontier (June 2023)." , url: "https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier" },
  { n: 5, text: "World Bank, Small and Medium Enterprises (SMEs) Finance — SMEs account for ~90% of businesses and >50% of employment worldwide." , url: "https://www.worldbank.org/en/topic/smefinance" },
  { n: 6, text: "IFC, MSME Finance Gap: Assessment of the Shortfalls and Opportunities in Financing MSMEs in Emerging Markets." , url: "https://www.ifc.org/en/insights-reports/2013/msme-finance-gap" },
  { n: 7, text: "Partech Africa, Africa Tech Venture Capital Report 2023." , url: "https://partechpartners.com/news/2023-partech-africa-report" },
  { n: 8, text: "GSMA, The Mobile Economy Sub-Saharan Africa 2024." , url: "https://www.gsma.com/mobileeconomy/sub-saharan-africa/" },
  { n: 9, text: "Endeavor Insight, Scale-Up Ecosystems in Emerging Markets (2023)." , url: "https://endeavor.org/" },
  { n: 10, text: "Stanford AI Index Report 2024, Human-Centered AI Institute." , url: "https://aiindex.stanford.edu/report/" },
  { n: 11, text: "Bain & Company, Global Private Equity Report 2024 (software category)." , url: "https://www.bain.com/insights/topics/global-private-equity-report/" },
  { n: 12, text: "Salesforce Q4 FY24 10-K; Microsoft FY24 10-K (segment revenue disclosures)." , url: "https://www.sec.gov/" },
];

const Cite = ({ ns }: { ns: number[] }) => (
  <sup className="text-[10px] font-medium ml-0.5" style={{ color: GOLD }}>
    {ns.map((n, i) => (
      <span key={n}>
        <a href={`#cite-${n}`} className="no-underline hover:underline">{n}</a>
        {i < ns.length - 1 ? "," : ""}
      </span>
    ))}
  </sup>
);

const Section = ({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-24 py-16 md:py-24 border-t" style={{ borderColor: `${NAVY}22` }}>
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <p className="text-[11px] tracking-[0.22em] uppercase mb-4" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>
        {eyebrow}
      </p>
      <h2 className="text-3xl md:text-5xl leading-[1.05] mb-8 max-w-4xl" style={{ fontFamily: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif", color: NAVY, fontWeight: 400, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      <div className="prose-investor max-w-3xl text-[15px] md:text-base leading-[1.75]" style={{ color: `${NAVY}CC` }}>
        {children}
      </div>
    </motion.div>
  </section>
);

const Stat = ({ figure, label, note }: { figure: string; label: string; note?: string }) => (
  <div className="border-t pt-4" style={{ borderColor: NAVY }}>
    <div className="text-3xl md:text-4xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: NAVY, fontWeight: 400 }}>{figure}</div>
    <div className="text-[11px] tracking-[0.15em] uppercase mt-2" style={{ color: `${NAVY}99`, fontFamily: "'Space Grotesk', sans-serif" }}>{label}</div>
    {note && <div className="text-xs mt-1" style={{ color: `${NAVY}77` }}>{note}</div>}
  </div>
);

const TOC = [
  { id: "brief", label: "01 — 5-Min Brief" },
  { id: "highlights", label: "01b — Investment Highlights" },
  { id: "thesis", label: "02 — Thesis" },
  { id: "missing-layer", label: "03 — The Missing Layer" },
  { id: "flywheel", label: "04 — Compounding Moat" },
  { id: "incumbents", label: "05 — Why Incumbents Can't Copy" },
  { id: "why-now", label: "06 — Why Now" },
  { id: "problem", label: "07 — Problem" },
  { id: "solution", label: "08 — Solution" },
  { id: "product-proof", label: "09 — Product Proof" },
  { id: "demo-video", label: "10 — Product Walkthrough" },
  { id: "category", label: "11 — Category" },
  { id: "product", label: "12 — Architecture" },
  { id: "market", label: "13 — Market" },
  { id: "positioning", label: "14 — Positioning" },
  { id: "competition", label: "15 — Competition" },
  { id: "model", label: "16 — Business Model" },
  { id: "unit-economics", label: "16b — Unit Economics" },
  { id: "gtm", label: "17 — Go-to-Market" },
  { id: "moat", label: "18 — Defensibility" },
  { id: "validation", label: "19 — Traction" },
  { id: "metrics", label: "19b — Verified Metrics" },
  { id: "roadmap", label: "20 — Roadmap" },
  { id: "confidence", label: "21 — At a Glance" },
  { id: "financials", label: "22 — Financials" },
  { id: "team", label: "23 — Team" },
  { id: "ask", label: "24 — The Ask" },
  { id: "risks", label: "25 — Risks" },
  { id: "governance", label: "25b — Governance & Risk" },
  { id: "exit", label: "26 — Exit Landscape" },
  { id: "diligence", label: "27 — Due Diligence" },
  { id: "downloads", label: "28 — Materials" },
];

const HIGHLIGHTS: [string, string][] = [
  ["Large and growing market", "Enterprise software is a $1T+ annual market, and the AI-native operating layer above it is being defined now rather than defended."],
  ["Proprietary technology", "A graph-native organizational model, a multi-agent deliberation engine, and durable organizational memory — built together, not bolted on."],
  ["Experienced leadership", "Category-creation and capital (CEO), multi-country commercial operations (COO), and venture-backed SaaS finance discipline (CFO)."],
  ["Early traction", "A product-complete platform in production with live tenants, AI agents deployed, and every metric in §19b queried from the running system."],
  ["Scalable SaaS model", "Per-seat subscription tiered by capability, with metered AI consumption creating natural expansion revenue inside each account."],
  ["Defensible AI platform", "Every task, document, decision, and meeting deepens the organizational graph — switching costs compound with usage, not with contract length."],
  ["Global expansion strategy", "Sub-Saharan Africa as the wedge with structurally underserved SMEs, then a developed-market lead motion on the same intelligence layer."],
];

const TEAM = [
  { name: "Wisdom Jonathans", role: "Founder & Chief Executive Officer", initials: "WJ",
    why: "Category definition, product vision, capital formation. Founder of Elevate AI; publisher of The Strategic Signal.", linkedin: null as string | null },
  { name: "Oyewole Olufemi Emmanuel", role: "Co-Founder & Chief Operating Officer", initials: "OE",
    why: "15 years scaling multi-country service businesses; took a fintech from 40 to 380 staff across 6 countries through ISO 27001, PCI-DSS and SOC 2 Type II.", linkedin: null as string | null },
  { name: "David Whitmore", role: "Co-Founder & Chief Financial Officer", initials: "DW",
    why: "CFA. 19 years in venture-backed SaaS; CFO from $6M to $84M ARR through Series C and exit; built metered-billing and ASC 606 architecture at scale.", linkedin: null as string | null },
  { name: "Senior Platform Engineer", role: "Technical Leadership — Head of Engineering scoped at close", initials: "EN",
    why: "Owns the graph schema, multi-agent runtime, edge functions, and the security model. Elevation to Head of Engineering is funded in the use of funds.", linkedin: null as string | null },
];

const Downloads = [
  { name: "Investor Pitch Deck (PPTX, 22 slides)", status: "ready", phase: "Phase 2", href: "/investor-pack/Global-Office-Investor-Deck.pptx" },
  { name: "Deck Speaker Notes (DOCX)", status: "ready", phase: "Phase 2", href: "/investor-pack/Global-Office-Investor-Deck-Speaker-Notes.docx" },
  { name: "Pitch Scripts — Elevator / 5 / 10 / 30-min (DOCX)", status: "ready", phase: "Phase 2", href: "/investor-pack/Global-Office-Pitch-Scripts.docx" },
  { name: "Investor One-Pager (DOCX)", status: "ready", phase: "Phase 1", href: "/investor-pack/Global-Office-Investor-One-Pager.docx" },
  { name: "Investment Memorandum (DOCX)", status: "ready", phase: "Phase 3", href: "/investor-pack/Global-Office-Investment-Memorandum.docx" },
  { name: "Strategic Business Plan (DOCX)", status: "ready", phase: "Phase 3", href: "/investor-pack/Global-Office-Business-Plan.docx" },
  { name: "Three-Year Financial Model (XLSX)", status: "ready", phase: "Phase 3", href: "/investor-pack/Global-Office-Financial-Model.xlsx" },
  { name: "Capital Efficiency & Unit Economics Memo (PDF)", status: "ready", phase: "Phase 3", href: "/investor-pack/Global-Office-Capital-Efficiency-and-Unit-Economics-Memo.pdf" },
  { name: "Go-to-Market Strategy (PDF)", status: "ready", phase: "Phase 3", href: "/investor-pack/Global-Office-Go-To-Market-Strategy.pdf" },
  { name: "Customer Discovery & Design Partner Commitments (PDF)", status: "ready", phase: "Phase 4", href: "/investor-pack/Global-Office-Customer-Discovery-and-Design-Partners.pdf" },
  { name: "Traction & Metrics Report (PDF)", status: "ready", phase: "Phase 4", href: "/investor-pack/Global-Office-Traction-and-Metrics-Report.pdf" },
  { name: "Product Screenshots & Demo Flows (PDF)", status: "ready", phase: "Phase 4", href: "/investor-pack/Global-Office-Product-Screenshots-and-Demo-Flows.pdf" },
  { name: "Market Research Report (DOCX)", status: "ready", phase: "Phase 4", href: "/investor-pack/Global-Office-Market-Research.docx" },
  { name: "Competitive Analysis Report (DOCX)", status: "ready", phase: "Phase 4", href: "/investor-pack/Global-Office-Competitive-Analysis.docx" },
  { name: "Product Strategy & Technical Architecture (DOCX)", status: "ready", phase: "Phase 4", href: "/investor-pack/Global-Office-Product-Strategy.docx" },
  { name: "Brand Positioning Document (DOCX)", status: "ready", phase: "Phase 4", href: "/investor-pack/Global-Office-Brand-Positioning.docx" },
  { name: "Due Diligence Package & Data Room Checklist (DOCX)", status: "ready", phase: "Phase 5", href: "/investor-pack/Global-Office-Due-Diligence-Package.docx" },
  { name: "Investor FAQ, Objections & Founder Talking Points (DOCX)", status: "ready", phase: "Phase 5", href: "/investor-pack/Global-Office-Investor-FAQ.docx" },
  { name: "Package Variants — Grant · DFI · Strategic · Bank (DOCX)", status: "ready", phase: "Phase 5", href: "/investor-pack/Global-Office-Package-Variants.docx" },
  { name: "Corporate Profile (DOCX)", status: "ready", phase: "Phase 5", href: "/investor-pack/Global-Office-Corporate-Profile.docx" },
  { name: "Product Demo Script (DOCX)", status: "ready", phase: "Phase 5", href: "/investor-pack/Global-Office-Product-Demo-Script.docx" },
] as { name: string; status: "ready" | "in-progress" | "queued"; phase: string; href?: string }[];

const Investors = () => {
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const { track } = useInvestorAnalytics();
  useEffect(() => {
    const prev = { title: document.title };
    document.title = "Intelligent Office — Investor Brief (Confidential)";

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      const before = el.getAttribute("content");
      el.setAttribute("content", content);
      return () => {
        if (before === null) el?.remove();
        else el?.setAttribute("content", before);
      };
    };

    const undoRobots = setMeta("robots", "noindex,nofollow,noarchive,nosnippet");
    const undoDesc = setMeta("description", "Confidential investor brief for Intelligent Office — the Intelligent Digital Office, built on the Organizational Intelligence Layer: an AI-native cognition platform with a virtual C-suite, expert consultants, and AI-run departments.");

    // Load editorial serif for this page only
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap";
    document.head.appendChild(link);

    track("investor_page_view", { path: "/investors" });

    return () => {
      document.title = prev.title;
      undoRobots();
      undoDesc();
      link.remove();
    };
  }, [track]);

  return (
    <div style={{ background: BONE, color: NAVY, fontFamily: "'Inter', system-ui, sans-serif" }} className="min-h-screen">
      {/* Confidential ribbon */}
      <div className="w-full text-center text-[10px] tracking-[0.3em] uppercase py-2 print:hidden" style={{ background: NAVY, color: BONE, fontFamily: "'Space Grotesk', sans-serif" }}>
        <Lock className="inline w-3 h-3 mr-2 -mt-0.5" />
        Confidential — Not for distribution — Prepared for prospective investors
      </div>

      {/* Masthead */}
      <header className="max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-24">
        <div className="flex items-start justify-between gap-8 flex-wrap">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>
              Intelligent Office · Investor Brief · MMXXVI
            </p>
            <h1 className="mt-6 text-5xl md:text-7xl lg:text-8xl leading-[0.95] max-w-5xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, letterSpacing: "-0.02em" }}>
              The Intelligent Digital Office.
            </h1>
            <p className="mt-6 max-w-2xl text-base md:text-lg leading-[1.6]" style={{ color: `${NAVY}99` }}>
              Customers buy an <strong style={{ color: NAVY }}>Intelligent Digital Office</strong> — the place their whole company operates, without the bricks. What they are actually adopting is the <strong style={{ color: NAVY }}>Organizational Intelligence Layer</strong>: the graph and cognition substrate underneath. The office is the wedge; the intelligence layer is the moat.
            </p>
            <p className="mt-6 max-w-2xl text-lg md:text-xl leading-[1.6]" style={{ color: `${NAVY}CC` }}>
              Microsoft owns documents. Google owns communication. Salesforce owns customers. SAP owns resources. Notion owns knowledge. <strong style={{ color: NAVY }}>Intelligent Office owns organizational intelligence</strong> — the cognition platform underneath, with a virtual C-suite, expert AI consultants, and AI-run departments that reason, decide, and remember on your organization's own data.
            </p>
          </div>
          <div className="flex flex-col gap-2 print:hidden">
            <button
              onClick={() => { track("book_meeting_opened"); setMeetingOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white transition-colors"
              style={{ background: NAVY }}
            >
              <Video className="w-4 h-4" /> Meet the Founder
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-none border transition-colors hover:bg-[color:var(--navy)] hover:text-[color:var(--bone)]"
              style={{ borderColor: NAVY, color: NAVY, ["--navy" as any]: NAVY, ["--bone" as any]: BONE }}
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <a href="#downloads" onClick={() => track("materials_scrolled")} className="inline-flex items-center gap-2 px-4 py-2 text-sm border" style={{ borderColor: NAVY, color: NAVY }}>
              <Download className="w-4 h-4" /> Materials
            </a>
          </div>
        </div>

        {/* At-a-glance */}
        <div className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-8">
          <Stat figure="$1.5M" label="Pre-Seed" note="18–24 month runway" />
          <Stat figure="AI-BOS" label="Category" note="Business Operating System" />
          <Stat figure="10–250" label="Wedge ICP" note="SME employees, SSA first" />
          <Stat figure="4→∞" label="Launch Markets" note="NG · KE · ZA · GH" />
        </div>
      </header>

      {/* Table of contents */}
      <nav className="max-w-7xl mx-auto px-6 md:px-12 mt-20 md:mt-28 pt-12 border-t" style={{ borderColor: NAVY }}>
        <p className="text-[11px] tracking-[0.22em] uppercase mb-6" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Contents</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
          {TOC.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="group flex items-baseline justify-between border-b py-2 text-sm" style={{ borderColor: `${NAVY}22`, color: `${NAVY}CC` }}>
              <span className="group-hover:text-[color:var(--navy)]" style={{ ["--navy" as any]: NAVY }}>{t.label}</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition" />
            </a>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 md:px-12">
        <InvestorBrief />

        <Section id="highlights" eyebrow="01b — Investment Highlights" title="Why this opportunity is compelling, in seven lines.">
          <div className="not-prose grid md:grid-cols-2 gap-6">
            {HIGHLIGHTS.map(([t, d]) => (
              <div key={t} className="border-t pt-4" style={{ borderColor: NAVY }}>
                <div className="text-sm tracking-[0.15em] uppercase mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: NAVY }}>{t}</div>
                <p className="text-sm leading-[1.7]" style={{ color: `${NAVY}CC` }}>{d}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="thesis" eyebrow="02 — Investment Thesis" title="Organizations have data. They do not have intelligence. Intelligent Office builds the layer that turns one into the other.">
          <p>
            Modern businesses run on ten to thirty disconnected tools — email, chat, spreadsheets, project trackers, HR platforms, finance systems, CRMs, storage drives, video meetings, and ad-hoc AI assistants. The result is not productivity. It is coordination overhead. Work fragments across surfaces. Context is lost. Decisions are made without evidence. AI, in this environment, is an add-on to chaos rather than an amplifier of order.
          </p>
          <p>
            Intelligent Office collapses this fragmentation into the <strong>Organizational Intelligence Layer</strong> — a persistent, graph-modeled substrate (entities, edges, and events materialized on Postgres) with an enterprise cognition platform on top: an AI C-suite that deliberates on decisions, expert consultants that recommend, and AI-run departments that execute. Every action, artifact, and decision is a first-class citizen and a permanent memory the organization reasons on next time.
          </p>
          <p>
            The ICP is global-first — SMEs and mid-market organizations across the United States, United Kingdom, European Union, and other developed economies where AI-native operating layers command the strongest willingness to pay, followed by an emerging-markets expansion motion. Traditional software manages functions. Intelligent Office manages organizational intelligence.
          </p>
          <p>
            <strong style={{ color: NAVY }}>This is not a SaaS application; it is an AI-native platform company.</strong> A SaaS application digitizes a function and waits for a human to operate it. Intelligent Office runs an intelligence layer that orchestrates operations across functions — it holds the organization's memory in a graph, deliberates over decisions with an AI executive council, dispatches work through an automation engine, and learns from the outcome. The software surface is the interface to that layer, not the product itself. That distinction determines everything an investor cares about: the moat is data and learned organizational context rather than features, expansion is driven by intelligence consumption rather than seat count alone, and the defensible asset compounds with usage instead of depreciating with the next competitor release.
          </p>
          <p>
            The invitation in this brief is therefore to evaluate a category creator rather than another entrant in an existing category. The evidence is deliberately concrete: a production platform you can walk through, live operational metrics read from the running system, an architecture document that shows the graph and cognition substrate, and the unit economics that convert that architecture into margin.
          </p>
          <p className="mt-8 pl-6 border-l-2 italic text-lg" style={{ borderColor: GOLD, fontFamily: "'Instrument Serif', Georgia, serif" }}>
            The next trillion-dollar software company will not be a better CRM, ERP, or collaboration tool. It will be the intelligence layer those categories become obsolete inside of.
          </p>
        </Section>

        <IntelligenceStack />
        <MoatFlywheel />
        <IncumbentGrid />

        <Section id="why-now" eyebrow="06 — Why Now" title="Three forces have converged for the first time.">
          <ol className="space-y-6 list-none pl-0">
            <li>
              <span className="block text-sm tracking-[0.2em] uppercase mb-1" style={{ color: GOLD }}>i. Generative AI has crossed the utility threshold</span>
              Frontier models are now capable, cheap, and fast enough to embed reasoning inside every business workflow. McKinsey estimates generative AI could add $2.6–4.4 trillion in annual productivity value<Cite ns={[4]}/>, with the largest gains in operations, sales, software engineering, and customer support — the exact surfaces Intelligent Office unifies.
            </li>
            <li>
              <span className="block text-sm tracking-[0.2em] uppercase mb-1" style={{ color: GOLD }}>ii. SaaS unbundling has run its course</span>
              A decade of point solutions produced fatigue, sprawl, and negative net-retention pressure across the mid-market<Cite ns={[3]}/>. Buyers are now consolidating. The rebundling window — historically the moment new category leaders emerge — is open.
            </li>
            <li>
              <span className="block text-sm tracking-[0.2em] uppercase mb-1" style={{ color: GOLD }}>iii. The global operating model has been rewritten</span>
              Modern organizations are distributed, multi-jurisdictional, and AI-augmented by default. Legacy suites were built for a co-located workforce and a single system of record. The new operating model rewards platforms that unify people, work, and intelligence across geographies — not those that assume one.
            </li>
          </ol>
        </Section>

        <Section id="problem" eyebrow="03 — The Problem" title="Businesses do not have a software problem. They have a coherence problem.">
          <p>
            The average SME uses between 8 and 25 disconnected applications to run day-to-day operations. Information is duplicated across surfaces. No single system understands the organization end-to-end. Executives make decisions on lagging, partial data. Managers spend more time coordinating than deciding. Frontline staff switch context dozens of times per hour.
          </p>
          <p>
            The productivity cost is measurable — and the AI opportunity cost is larger. Any AI feature bolted onto a fragmented stack inherits its fragmentation. Real organizational intelligence requires a real organizational substrate.
          </p>
          <p>
            The problem is universal. Whether an organization operates from New York, London, Singapore, São Paulo, or Lagos, the fragmentation is the same — different tools, different silos, different truths. Intelligent Office is built for that reality from day one: multi-tenant, multi-currency, multi-language, and multi-jurisdiction as first-class properties, not localization afterthoughts.
          </p>
        </Section>

        <Section id="solution" eyebrow="08 — The Solution" title="One graph. One intelligence layer. One system.">
          <p>
            Intelligent Office replaces the disconnected stack with a single, AI-native operating system organized around how work actually happens: people, tasks, conversations, documents, decisions, and outcomes — all bound into one knowledge graph, all observed by one intelligence layer, all extensible through one workflow engine.
          </p>
          <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8 mt-10">
            {[
              ["Unified Surface", "Attendance, execution, communication, knowledge, HR, finance, meetings, and executive intelligence in one workspace."],
              ["Knowledge Graph", "Every entity — person, task, message, document, decision — is a node. Every action strengthens the graph."],
              ["Intelligence Layer", "AI observes patterns across the graph and surfaces anomalies, risks, and opportunities — before they escalate."],
              ["Workflow Engine", "Visual IF/THEN automation lets any team compose autonomous processes without engineering."],
              ["Executive Control", "A weighted organizational Health Score derived from live operational signals — task completion, KPI attainment, and attendance — not self-reported dashboards."],
              ["Partner Connect", "Inter-organization workflows for supply chains, professional networks, and B2B collaboration."],
            ].map(([t, d]) => (
              <div key={t} className="border-t pt-4" style={{ borderColor: NAVY }}>
                <div className="text-sm tracking-[0.15em] uppercase mb-2" style={{ color: NAVY, fontFamily: "'Space Grotesk', sans-serif" }}>{t}</div>
                <p className="text-sm leading-[1.7]" style={{ color: `${NAVY}CC` }}>{d}</p>
              </div>
            ))}
          </div>
        </Section>

        <ProductProof />
        <DemoVideoBlock />

        <Section id="category" eyebrow="11 — Category Definition" title="Sold as an Intelligent Digital Office. Built as the Organizational Intelligence Layer.">
          <p>
            Two words matter here, and they are not interchangeable. <strong>Intelligent Digital Office</strong> is what a buyer signs for: a single place where their company operates end to end — presence, execution, meetings, documents, HR, finance, governance — without a physical office. <strong>Organizational Intelligence Layer</strong> is what we are building underneath it: the knowledge graph and cognition substrate that makes that office reason, decide, and remember. Buyers adopt the office; the layer is what makes them unable to leave.
          </p>
          <p>
            Every prior category — ERP, CRM, collaboration, project management, HRIS, BI — was a surface for a function. Intelligent Office is a substrate for the organization itself. The distinction is architectural, not marketing.
          </p>
          <p>
            Microsoft and Google occupy the productivity layer. Salesforce and HubSpot occupy the customer layer. SAP, Oracle, and NetSuite occupy the resource layer. Notion, Monday, ClickUp, and Asana occupy the coordination layer. None of them are the operating system beneath.
          </p>
          <p>
            The category we are creating — <em>AI Business Operating System (AI-BOS)</em> — is defined by four properties an incumbent cannot retrofit without cannibalizing existing revenue:
          </p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>A unified knowledge graph across all business entities.</li>
            <li>An intelligence layer that acts on the graph, not on isolated features.</li>
            <li>A workflow engine open to every team, not gated by IT.</li>
            <li>Native affordances for the emerging world's shape of work.</li>
          </ol>
        </Section>

        <Section id="product" eyebrow="12 — Product & Architecture" title="Built as an ecosystem, not a feature list.">
          <div className="not-prose grid md:grid-cols-2 gap-10 mt-4">
            <div>
              <div className="text-xs tracking-[0.22em] uppercase mb-3" style={{ color: GOLD }}>Modules Shipped</div>
              <ul className="text-sm space-y-1.5" style={{ color: `${NAVY}CC` }}>
                <li>· Attendance & Leave</li>
                <li>· Execution (Projects, Tasks, Kanban)</li>
                <li>· Messaging & Channels</li>
                <li>· Meetings (LiveKit + AI transcription)</li>
                <li>· Knowledge & Documents (with digital signatures)</li>
                <li>· HR, Payroll (core records &amp; approvals), Performance</li>
                <li>· Finance</li>
                <li>· Announcements & Notifications</li>
                <li>· Job Planning & OKRs</li>
                <li>· AI Insights & Executive Control Center</li>
                <li>· Workflow Automation</li>
                <li>· Partner Connect (Inter-Org)</li>
                <li>· Admin, Billing, Support</li>
              </ul>
            </div>
            <div>
              <div className="text-xs tracking-[0.22em] uppercase mb-3" style={{ color: GOLD }}>Architectural Layers</div>
              <ol className="text-sm space-y-3" style={{ color: `${NAVY}CC` }}>
                <li><strong style={{ color: NAVY }}>Surface.</strong> Cross-platform React app, mobile-first, offline-tolerant.</li>
                <li><strong style={{ color: NAVY }}>Modules.</strong> Composable, permissioned, role-aware.</li>
                <li><strong style={{ color: NAVY }}>Workflow Engine.</strong> Visual IF/THEN automation across modules.</li>
                <li><strong style={{ color: NAVY }}>Knowledge Graph.</strong> Multi-tenant, activity-logged, RLS-isolated.</li>
                <li><strong style={{ color: NAVY }}>Intelligence Layer.</strong> Model-agnostic reasoning over org data.</li>
                <li><strong style={{ color: NAVY }}>Integration Fabric.</strong> APIs, webhooks, and Partner Connect.</li>
              </ol>
            </div>
          </div>
          <p className="mt-10 text-sm italic" style={{ color: `${NAVY}99` }}>
            The full technical architecture, data model, security posture, and roadmap are documented in the <a href="#downloads" style={{ color: NAVY }} className="underline">Product Strategy &amp; Technical Architecture</a> report in Materials.
          </p>
        </Section>

        <Section id="market" eyebrow="13 — Market Opportunity" title="A $1T+ software market with a developed-market lead motion.">
          <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
            <div className="p-6 border" style={{ borderColor: NAVY }}>
              <div className="text-xs tracking-[0.22em] uppercase" style={{ color: GOLD }}>TAM</div>
              <div className="mt-3 text-4xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>~$1.05T</div>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: `${NAVY}99` }}>Global enterprise software spend, 2024 forecast<Cite ns={[1,2]}/>. Grows to ~$1.25T by 2027.</p>
            </div>
            <div className="p-6 border" style={{ borderColor: NAVY }}>
              <div className="text-xs tracking-[0.22em] uppercase" style={{ color: GOLD }}>SAM</div>
              <div className="mt-3 text-4xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>~$180B</div>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: `${NAVY}99` }}>Global SME collaboration, productivity, ERP, HRIS, and CRM software addressable to a unified suite<Cite ns={[2,3]}/>.</p>
            </div>
            <div className="p-6 border" style={{ borderColor: NAVY }}>
              <div className="text-xs tracking-[0.22em] uppercase" style={{ color: GOLD }}>SOM (5-yr)</div>
              <div className="mt-3 text-4xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>~$1.8B</div>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: `${NAVY}99` }}>Bottom-up estimate — SSA + selected EMEA SME segments at 1–3% penetration. Assumption, stress-tested in the Financial Model.</p>
            </div>
          </div>
          <p>
            SMEs and mid-market enterprises represent approximately 90% of businesses and more than 50% of employment worldwide<Cite ns={[5]}/>. Across every major region — North America, EMEA, LATAM, APAC, and the emerging world — these organizations are actively consolidating fragmented stacks and re-underwriting their software estate for the AI era. Intelligent Office is positioned to be the platform they consolidate onto.
          </p>
        </Section>

        <PositioningMatrix />

        <Section id="competition" eyebrow="15 — Competition & White Space" title="No competitor occupies the intelligence-layer position. Every incumbent is optimized against retrofitting into it.">
          <div className="not-prose overflow-x-auto -mx-6 md:mx-0">
            <table className="w-full text-sm min-w-[720px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Player", "Category", "Strength", "Structural Gap"].map((h) => (
                    <th key={h} className="text-left py-3 pr-6 text-[11px] tracking-[0.18em] uppercase" style={{ color: GOLD, borderBottom: `1px solid ${NAVY}`, fontFamily: "'Space Grotesk', sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ color: `${NAVY}CC` }}>
                {[
                  ["Microsoft 365", "Productivity", "Distribution, defaults", "Fragmented across Teams/Outlook/SharePoint; not AI-native by architecture"],
                  ["Google Workspace", "Productivity", "Simplicity, price", "No workflow, no ERP surface, no org intelligence"],
                  ["Salesforce", "CRM", "Enterprise lock-in", "Customer layer only; not organizational OS"],
                  ["SAP / Oracle / NetSuite", "ERP", "Depth", "Cost, complexity, months-long implementation — inaccessible to SMEs"],
                  ["Zoho / Odoo / Bitrix24", "Suite", "Breadth at low price", "Feature suites, not intelligence platforms; AI is bolted on"],
                  ["Notion / Monday / ClickUp / Asana", "Coordination", "UX, adoption", "Coordination surface only; no ERP, HR, finance, or org intelligence"],
                  ["HubSpot", "GTM Suite", "SMB motion", "Customer-facing only; no operational OS"],
                  ["Freshworks", "SMB support", "Regional presence", "Support layer only"],
                ].map(([p, c, s, g]) => (
                  <tr key={p as string}>
                    <td className="py-3 pr-6 align-top" style={{ borderBottom: `1px solid ${NAVY}22`, color: NAVY }}>{p}</td>
                    <td className="py-3 pr-6 align-top" style={{ borderBottom: `1px solid ${NAVY}22` }}>{c}</td>
                    <td className="py-3 pr-6 align-top" style={{ borderBottom: `1px solid ${NAVY}22` }}>{s}</td>
                    <td className="py-3 pr-6 align-top" style={{ borderBottom: `1px solid ${NAVY}22` }}>{g}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-8">
            The white space is not a missing feature. It is a missing architecture: a unified organizational substrate with native AI reasoning, priced and shaped for the world's next billion businesses.
          </p>
        </Section>

        <Section id="model" eyebrow="16 — Business Model" title="Per-seat subscription, tiered by capability, with AI usage metering.">
          <ul className="list-none pl-0 space-y-3">
            <li><strong style={{ color: NAVY }}>Starter.</strong> Core modules for teams up to 25. Priced for local affordability in launch markets.</li>
            <li><strong style={{ color: NAVY }}>Business.</strong> Full suite for 25–250 employees. Workflow engine, executive control, AI credits included.</li>
            <li><strong style={{ color: NAVY }}>Enterprise.</strong> Multi-org hierarchies, SSO, advanced compliance, dedicated infrastructure, custom SLAs.</li>
            <li><strong style={{ color: NAVY }}>Marketplace &amp; Partner.</strong> Third-party modules, integrations, and Partner Connect revenue share.</li>
          </ul>
          <p className="mt-6">
            AI usage is metered as credits atop each tier — aligning cost with value delivered and creating a natural expansion vector as customers deepen their reliance on the intelligence layer.
          </p>
        </Section>

        <Section id="unit-economics" eyebrow="16b — Unit Economics & Capital Efficiency" title="Software margins, metered AI cost, and a defined path from $1.5M to seed-grade evidence.">
          <p>
            The most common question on an AI-native platform is whether intelligence makes it expensive to serve. It does not, because inference is metered at the tier and the marginal cost of an additional organization is dominated by cloud primitives that fall with scale. The table below is the quantified answer, drawn cell-for-cell from the{" "}
            <a href="#downloads" style={{ color: NAVY }} className="underline">Three-Year Financial Model</a> and explained in the{" "}
            <a href="#downloads" style={{ color: NAVY }} className="underline">Capital Efficiency &amp; Unit Economics Memo</a>. These are stated assumptions for a pre-revenue company, not reported actuals.
          </p>
          <div className="not-prose overflow-x-auto -mx-6 md:mx-0 mt-6">
            <table className="w-full text-sm min-w-[680px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Question an investor will ask", "Answer", "Basis"].map((h) => (
                    <th key={h} className="text-left py-3 pr-6 text-[11px] tracking-[0.18em] uppercase" style={{ color: GOLD, borderBottom: `1px solid ${NAVY}`, fontFamily: "'Space Grotesk', sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ color: `${NAVY}CC` }}>
                {[
                  ["What is the expected monthly subscription?", "$6–$18 blended per seat / month; $180–$1,400 per organization / month depending on tier and seat count", "Starter, Business and Enterprise tier mix at launch-market pricing"],
                  ["What is the gross margin?", "76–81% in year one, 84–88% at scale", "Cloud, storage, media and AI inference are the only variable COGS lines"],
                  ["How much does it cost to serve one customer?", "$14–$22 per organization / month at launch, trending to $6–$9 by year three", "Committed-use cloud discounts, cached retrieval, and model-tier routing"],
                  ["What is the expected CAC?", "$120–$280 blended (SME); $1,800–$3,200 (enterprise motion, year three)", "Product-led signup plus channel partners and founder-led content"],
                  ["How long until CAC is recovered?", "6–9 months base case; under 4 months once channel partners mature", "Payback = CAC ÷ (ARPA × gross margin)"],
                  ["What is the expected LTV?", "$1,900–$4,200 per SME organization", "ARPA × gross margin ÷ monthly churn, at 88–94% logo retention"],
                  ["When does the business become self-funding?", "Contribution-positive from the first paying cohort; operating break-even inside the 18–24 month runway", "Platform already built; incremental revenue meets a largely fixed cost base"],
                  ["Does the business get more profitable as it scales?", "Yes — LTV:CAC ≥ 5x by year three, NRR 115–135%", "Fixed platform cost amortizes; expansion revenue arrives with no new CAC"],
                ].map(([q, a, b]) => (
                  <tr key={q as string}>
                    <td className="py-3 pr-6 align-top" style={{ borderBottom: `1px solid ${NAVY}22`, color: NAVY }}>{q}</td>
                    <td className="py-3 pr-6 align-top" style={{ borderBottom: `1px solid ${NAVY}22` }}>{a}</td>
                    <td className="py-3 align-top text-[13px]" style={{ borderBottom: `1px solid ${NAVY}22`, color: `${NAVY}99` }}>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-10">
            <strong style={{ color: NAVY }}>Why the margin improves with scale.</strong> Three structural reasons. First, the platform is already built — this round funds commercialization, not construction, so incremental revenue arrives against a largely fixed cost base. Second, AI cost per action falls as retrieval caching, prompt compression and model-tier routing mature, while price per seat holds. Third, expansion revenue — extra seats, additional modules, AI credit packs, Partner Connect — carries near-zero acquisition cost, so every dollar of expansion lands at close to full contribution margin.
          </p>

          <p className="mt-8">
            <strong style={{ color: NAVY }}>What $1.5M converts into.</strong> The ask is not a burn plan; it is a risk-retirement plan. Each allocation below is tied to an outcome an investor can verify at the seed round.
          </p>
          <div className="not-prose overflow-x-auto -mx-6 md:mx-0 mt-6">
            <table className="w-full text-sm min-w-[680px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Investment", "Allocation", "Expected outcome", "Risk it retires"].map((h) => (
                    <th key={h} className="text-left py-3 pr-6 text-[11px] tracking-[0.18em] uppercase" style={{ color: GOLD, borderBottom: `1px solid ${NAVY}`, fontFamily: "'Space Grotesk', sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ color: `${NAVY}CC` }}>
                {[
                  ["Product refinement", "~30%", "Enterprise-ready platform: SSO, audit depth, SLA tiers", "Product risk"],
                  ["Go-to-market execution", "~35%", "First cohort of paying organizations across launch markets", "Demand risk"],
                  ["Sales, success & partnerships", "~15%", "A repeatable acquisition engine with measured CAC and payback", "Distribution risk"],
                  ["AI & intelligence layer", "~8%", "Higher per-customer value, higher NRR, lower inference cost", "Value-capture risk"],
                  ["Infrastructure & compliance", "~12%", "Capacity, uptime and certification posture to carry growth", "Scale and trust risk"],
                ].map(([i, alloc, o, r]) => (
                  <tr key={i as string}>
                    <td className="py-3 pr-6 align-top" style={{ borderBottom: `1px solid ${NAVY}22`, color: NAVY }}>{i}</td>
                    <td className="py-3 pr-6 align-top" style={{ borderBottom: `1px solid ${NAVY}22` }}>{alloc}</td>
                    <td className="py-3 pr-6 align-top" style={{ borderBottom: `1px solid ${NAVY}22` }}>{o}</td>
                    <td className="py-3 align-top text-[13px]" style={{ borderBottom: `1px solid ${NAVY}22`, color: `${NAVY}99` }}>{r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-8">
            <strong style={{ color: NAVY }}>Capital efficiency, stated plainly.</strong> The platform reached production readiness on a fraction of the capital a comparable enterprise suite would consume, because it was built AI-native from the first commit rather than retrofitted. That is the single most important number in this brief: the expensive half of the journey is already behind the company, and this round buys evidence — revenue, retention, and a measured acquisition engine — rather than construction.
          </p>
        </Section>

        <Section id="gtm" eyebrow="17 — Go-to-Market" title="Product-led at the base, partner-led at the top, ecosystem-led at scale.">
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong style={{ color: NAVY }}>Product-led entry.</strong> Self-serve signup and org creation. Free tier for teams under 10. Time-to-value under 15 minutes.</li>
            <li><strong style={{ color: NAVY }}>Design-partner cohort.</strong> 20–30 SMEs across NG, KE, ZA, GH — deep engagement, product co-creation, reference stories.</li>
            <li><strong style={{ color: NAVY }}>Channel partners.</strong> Accountants, business consultants, HR firms, and SME associations as distribution multipliers.</li>
            <li><strong style={{ color: NAVY }}>Content &amp; community.</strong> The Strategic Signal (founder's newsletter) as inbound moat; open playbooks for SME operations.</li>
            <li><strong style={{ color: NAVY }}>Enterprise motion.</strong> Introduced from mid-market referrals in year two, with named-account sales in year three.</li>
          </ol>
        </Section>

        <Section id="moat" eyebrow="18 — Defensibility" title="The moat compounds every time a customer uses the product.">
          <div className="not-prose grid md:grid-cols-2 gap-8 mt-4">
            {[
              ["Data & Graph Moat", "Every action enriches the org's knowledge graph. Switching means abandoning institutional memory."],
              ["Workflow Lock-in", "Custom automations become the operating fabric of the business. Migration cost rises non-linearly with adoption."],
              ["AI Learning Loop", "The intelligence layer improves per-tenant with usage — competitors start from zero for each new customer."],
              ["Distribution in Underserved Markets", "First-mover distribution across SSA SMEs before Western incumbents localize."],
              ["Partner Connect Network Effects", "Value increases as more organizations join — a defensible B2B graph."],
              ["Brand & Community", "The Strategic Signal, founder authority, and community-led adoption compound over time."],
            ].map(([t, d]) => (
              <div key={t} className="border-t pt-4" style={{ borderColor: NAVY }}>
                <div className="text-sm tracking-[0.15em] uppercase mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t}</div>
                <p className="text-sm leading-[1.7]" style={{ color: `${NAVY}CC` }}>{d}</p>
              </div>
            ))}
          </div>
        </Section>

        <ValidationCards />
        <Section id="metrics" eyebrow="19b — Verified Operational Metrics" title="Evidence, not claims. Read live from the production platform.">
          <VerifiedMetrics />
        </Section>
        <RoadmapTimeline />
        <ConfidenceCards />

        <Section id="financials" eyebrow="22 — Financial Framework" title="Framework, not fabricated actuals. The full model is available in Materials.">
          <p>
            The company is pre-revenue at the time of this brief. The framework below reflects the operating assumptions that drive the 18–24 month plan and the seed-round milestones. Every number is built up bottom-up in the accompanying <a href="#downloads" style={{ color: NAVY }} className="underline">Three-Year Financial Model (XLSX)</a>, stress-tested across three scenarios (base, downside, upside), and auditable cell-by-cell.
          </p>
          <div className="not-prose overflow-x-auto -mx-6 md:mx-0 mt-6">
            <table className="w-full text-sm min-w-[640px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Assumption", "Range", "Rationale"].map((h) => (
                    <th key={h} className="text-left py-3 pr-6 text-[11px] tracking-[0.18em] uppercase" style={{ color: GOLD, borderBottom: `1px solid ${NAVY}`, fontFamily: "'Space Grotesk', sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ color: `${NAVY}CC` }}>
                {[
                  ["Blended ARPU (per seat, per month)", "$6 – $18", "Tier mix; regional pricing; higher in EMEA/UK expansion"],
                  ["Gross margin at scale", "84 – 88%", "Above the vertical-SaaS band because AI COGS is metered and cached"],
                  ["CAC (SME segment)", "$120 – $280", "Blended PLG + channel; content-led inbound"],
                  ["LTV : CAC target (Year 3)", "≥ 5x", "Ahead of top-quartile SMB SaaS benchmarks"],
                  ["Payback period", "6 – 9 months", "Base case; upside <4 months with channel maturity"],
                  ["Logo retention", "88 – 94%", "Suite lock-in and graph switching cost support the upper band"],
                  ["Net revenue retention", "115 – 135%", "Seat expansion + AI credit expansion"],
                  ["Operating break-even", "Within the 18 – 24 month runway", "Fixed cost base; contribution-positive from the first paying cohort"],
                ].map(([a, r, why]) => (
                  <tr key={a as string}>
                    <td className="py-3 pr-6 align-top" style={{ borderBottom: `1px solid ${NAVY}22`, color: NAVY }}>{a}</td>
                    <td className="py-3 pr-6 align-top" style={{ borderBottom: `1px solid ${NAVY}22` }}>{r}</td>
                    <td className="py-3 pr-6 align-top" style={{ borderBottom: `1px solid ${NAVY}22` }}>{why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-8 text-sm italic" style={{ color: `${NAVY}99` }}>All figures are strategic assumptions for a pre-launch venture, disclosed as such. Not forward-looking guidance.</p>
        </Section>

        <Section id="team" eyebrow="23 — Team" title="A founding team with the operator scars to execute the plan.">
          <div className="not-prose grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {TEAM.map((m) => (
              <div key={m.name} className="border-t pt-4" style={{ borderColor: NAVY }}>
                <div className="w-16 h-16 mb-3 flex items-center justify-center text-lg"
                  style={{ background: NAVY, color: BONE, fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  {m.initials}
                </div>
                <div className="text-sm" style={{ color: NAVY, fontFamily: "'Space Grotesk', sans-serif" }}>{m.name}</div>
                <div className="text-[11px] tracking-[0.14em] uppercase mt-1" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>{m.role}</div>
                <p className="text-xs mt-2 leading-[1.65]" style={{ color: `${NAVY}AA` }}>{m.why}</p>
                {m.linkedin ? (
                  <a href={m.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] mt-3 underline" style={{ color: NAVY }}>
                    <Linkedin className="w-3 h-3" /> LinkedIn
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] mt-3" style={{ color: `${NAVY}77` }}>
                    <Linkedin className="w-3 h-3" /> Profile shared on request
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs italic mb-8" style={{ color: `${NAVY}88` }}>
            Professional headshots and public LinkedIn profiles are released with the team pack in the data room; advisors and board members are disclosed under NDA.
          </p>
          <p>
            <strong style={{ color: NAVY }}>Wisdom Jonathans — Founder &amp; CEO.</strong> Entrepreneur and AI systems strategist. Founder and CEO of the Intelligent Office showcase project (Delaware C-Corporation), developing AI-powered products for business operations, decision-making, capital access, education, and public safety. Publisher of <em>The Strategic Signal</em> — a weekly thought-leadership newsletter read by operators, founders, and investors on strategy, AI, and the future of organizations.
          </p>
          <p>
            Prior to Intelligent Office, Wisdom founded and led Elevate AI, working directly with businesses to apply AI and workflow automation to real operational problems — the experience that surfaced the coherence problem this company was built to solve. He has served in governance and executive leadership across technology ventures, education (Vice Chairman, Exceeding Grace International Aviation College), nonprofit organizations, and faith-based institutions.
          </p>
          <p>
            <strong style={{ color: NAVY }}>Oyewole Olufemi Emmanuel — Co-Founder &amp; COO.</strong> Operations executive with fifteen years scaling multi-country service businesses across multiple regions. Previously Chief Operating Officer at a high-growth fintech where he built the operational playbook that grew the company from 40 to 380 staff across 6 countries and led it through ISO 27001, PCI-DSS, and SOC 2 Type II certification. Earlier, VP of Operations at an enterprise-software firm serving banks and telcos, where he owned partner distribution across multiple international markets. He owns commercial launch, channel partners, customer success, finance operations, and regulatory readiness — the exact surfaces that convert a $1.5M pre-seed into repeatable revenue.
          </p>
          <p>
            <strong style={{ color: NAVY }}>David Whitmore — Co-Founder &amp; CFO.</strong> American finance executive with nineteen years across venture-backed SaaS and enterprise software. Previously CFO at Northbridge Systems, a vertical-SaaS company he took from $6M to $84M ARR through a Series C and a strategic exit; earlier VP Finance at Halcyon Cloud (multi-tenant infrastructure) where he built the FP&amp;A, revenue-recognition, and metered-billing architecture that carried the company from pre-revenue to IPO readiness. Chartered Financial Analyst, former audit senior at a Big Four firm, and a repeat operator on ASC 606 revenue recognition, SOC 2 financial controls, and cross-border tax structuring across US, UK, and EU jurisdictions. He owns the capital plan, unit-economics discipline, investor reporting cadence, board-grade financial controls, and the path from pre-seed dollars to seed-ready metrics.
          </p>
          <p>
            Together, the founding trio covers category creation and capital (CEO), commercial execution and operations (COO), and financial discipline and capital efficiency (CFO) — three of the chairs institutional investors underwrite at pre-seed. A senior engineering hire owns the platform and AI stack today and is scoped for a Head of Engineering elevation in the use-of-funds; founding-team hires across product, design, sales, and customer success are executed in the first six months post-close. Advisory bench across AI infrastructure, SaaS go-to-market, and international expansion is in place; individual advisors are disclosed under NDA in the data room.
          </p>
        </Section>

        <Section id="corporate" eyebrow="23b — Corporate Structure" title="One company. Delaware-domiciled. Global engineering.">
          <p>
            Intelligent Office is the flagship platform of <strong style={{ color: NAVY }}>the Intelligent Office showcase project</strong>, a Delaware C-Corporation. The Delaware entity is the single investment, contracting, and intellectual-property holding company; engineering and delivery run from a wholly-controlled Africa engineering center.
          </p>
          <div className="not-prose grid md:grid-cols-2 gap-6 mt-6">
            <div className="border-t pt-4" style={{ borderColor: NAVY }}>
              <div className="text-xs tracking-[0.22em] uppercase mb-2" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Investment &amp; IP entity</div>
              <div className="text-sm mb-2" style={{ color: NAVY, fontFamily: "'Space Grotesk', sans-serif" }}>the Intelligent Office showcase project</div>
              <p className="text-sm leading-[1.7]" style={{ color: `${NAVY}CC` }}>
                Delaware C-Corporation (USA). Holds all intellectual property, customer contracts, and equity. Responsible for corporate governance, capital formation, strategic partnerships, institutional readiness, and long-term global expansion. All investment in this round is made into this entity.
              </p>
            </div>
            <div className="border-t pt-4" style={{ borderColor: NAVY }}>
              <div className="text-xs tracking-[0.22em] uppercase mb-2" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Engineering &amp; delivery center</div>
              <div className="text-sm mb-2" style={{ color: NAVY, fontFamily: "'Space Grotesk', sans-serif" }}>Africa engineering center (Lagos, Nigeria)</div>
              <p className="text-sm leading-[1.7]" style={{ color: `${NAVY}CC` }}>
                A controlled local operating vehicle of the Intelligent Office showcase project Delivers AI research, software engineering, product development, and operational execution under an intercompany services agreement, with all work product assigned to the Delaware parent.
              </p>
            </div>
          </div>
          <p className="mt-6">
            The structure is deliberate: institutional-grade US governance and a clean, single-entity cap table on top, world-class distributed engineering economics underneath. Capital raised is directed at the commercialization, growth, and global expansion of Intelligent Office, the company's flagship AI-native platform.
          </p>
        </Section>

        <Section id="ask" eyebrow="24 — The Ask" title="$1.5M Pre-Seed. 18–24 month runway. Seed-ready at close of period.">
          <div className="not-prose grid md:grid-cols-2 gap-10 mt-4">
            <div>
              <div className="text-xs tracking-[0.22em] uppercase mb-3" style={{ color: GOLD }}>Use of Funds (indicative)</div>
              <ul className="text-sm space-y-2" style={{ color: `${NAVY}CC` }}>
                <li>· Commercial launch &amp; GTM execution — ~35%</li>
                <li>· Product refinement (enterprise readiness) — ~30%</li>
                <li>· Sales, customer success &amp; partnerships — ~15%</li>
                <li>· AI &amp; intelligence layer — ~8%</li>
                <li>· Infrastructure, security &amp; compliance — ~12%</li>
              </ul>
            </div>
            <div>
              <div className="text-xs tracking-[0.22em] uppercase mb-3" style={{ color: GOLD }}>Milestones to Seed</div>
              <ul className="text-sm space-y-2" style={{ color: `${NAVY}CC` }}>
                <li>· Global commercial launch with multi-region availability</li>
                <li>· Design-partner cohort with reference cases</li>
                <li>· Predictable, repeatable customer acquisition motion</li>
                <li>· Measurable product-market fit signals (retention, NPS, NRR)</li>
                <li>· Growing base of paying business customers</li>
                <li>· Expansion-ready platform &amp; org readiness</li>
              </ul>
            </div>
          </div>
          <p className="mt-8 text-sm" style={{ color: `${NAVY}99` }}>
            Valuation to be discussed directly with strategic investors and set based on market validation, investor value-add, and round composition.
          </p>
        </Section>

        <Section id="risks" eyebrow="25 — Risk Register" title="What could go wrong — and how we plan to respond.">
          <div className="not-prose grid md:grid-cols-2 gap-6">
            {[
              ["Adoption risk", "SMEs are slow to change tooling. Mitigation: free tier, PLG onboarding under 15 minutes, channel partners, migration playbooks."],
              ["Competitive risk", "Incumbents (Microsoft, Google, Zoho) could bundle. Mitigation: architectural advantage they cannot retrofit without cannibalization; emerging-market wedge outside their attention."],
              ["Execution risk", "Broad module surface. Mitigation: architecture-first design, per-module quality gates, feature-flag rollout."],
              ["AI cost risk", "Model inference expense. Mitigation: model-agnostic layer, AI credit metering, on-tenant caching, small-model routing."],
              ["Regulatory risk", "NDPR, GDPR, and emerging AI regulation. Mitigation: privacy-by-design, tenant isolation, data residency options."],
              ["Concentration risk", "Early customer base skewing to any single geography or vertical. Mitigation: multi-region GTM from launch; enterprise motion layered in by Year 3."],
              ["Talent risk", "Senior engineering and GTM hiring in a competitive global market. Mitigation: distributed operating model across the US and engineering affiliate; remote-first hiring; equity-heavy comp."],
              ["Capital risk", "Correction in venture funding. Mitigation: capital-efficient milestones; DFI and strategic-investor optionality."],
              ["Platform-dependency risk", "Customers run their entire company on Intelligent Office, so an outage, breach, or corporate failure would be existential for them — and a litigation exposure for us. Mitigation: multi-AZ managed infrastructure with continuous point-in-time recovery (RPO < 15 min, RTO < 1 hr), AES-256 at rest and TLS 1.3 in transit, database-level tenant isolation, append-only audit and signature ledgers, quarterly restore drills, penetration testing ahead of enterprise GA, cyber and tech E&O insurance, contractual data-portability and wind-down notice rights, and a source-code and data escrow arrangement for enterprise contracts."],
              ["Access-control risk", "Uninvited members reaching a tenant. Mitigation: members join only via emailed invitation or a single-use access token generated by that organization's Admin/HR on its own subdomain; tokens are role-scoped, expiry-bounded, and burned on first use; owner role can never be granted by token."],
            ].map(([t, d]) => (
              <div key={t} className="border-t pt-4" style={{ borderColor: NAVY }}>
                <div className="text-sm tracking-[0.15em] uppercase mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t}</div>
                <p className="text-sm leading-[1.7]" style={{ color: `${NAVY}CC` }}>{d}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="governance" eyebrow="25b — Governance, AI Oversight & Continuity" title="How the company governs itself, its AI, and its uptime.">
          <div className="not-prose grid md:grid-cols-2 gap-6">
            {[
              ["Corporate governance", "Delaware C-Corporation with a founder-controlled board today and an investor observer or board seat available at this round. Board consents, resolutions, and a maintained stock ledger and cap table form a standing record. Quarterly investor reporting on metrics, spend, and plan variance begins at close."],
              ["Security posture & certifications", "Database-enforced tenant isolation on every table, AES-256 at rest, TLS 1.3 in transit, role-scoped access, append-only audit and signature ledgers, and continuous dependency scanning. No third-party certification has been issued to date; SOC 2 Type I readiness is explicitly funded in the use of funds and is not claimed as achieved."],
              ["Privacy & compliance", "Privacy-by-design with NDPR and GDPR alignment: DPA templates, a published sub-processor register, configurable retention and deletion, data-residency options, and documented breach-notification runbooks. Compliance settings and retention windows are enforced in the product itself, not by policy alone."],
              ["Risk management approach", "A standing risk register (§25) reviewed at each board cycle, covering adoption, model-cost, competitive, execution, and regulatory exposure — each with a defined mitigation owner. Product-level predictive alerting surfaces operational risk inside the platform the same way it does for customers."],
              ["Business continuity", "Managed multi-AZ Postgres with automated backups and point-in-time recovery, zero-downtime deployments, and stateless edge compute. Enterprise agreements include wind-down notice, data-portability, and escrow terms so no customer is trapped by a single-vendor dependency."],
              ["AI governance & oversight", "AI in Intelligent Office is advisory by design: agents deliberate, cite the organizational record, and recommend — humans approve, revise, or reject, and every decision is captured with a mandatory reason. Policy guardrails can block deliberations, feedback tunes memory relevance, and the memory audit trail makes every AI-influenced decision reconstructable after the fact."],
            ].map(([t, d]) => (
              <div key={t} className="border-t pt-4" style={{ borderColor: NAVY }}>
                <div className="text-sm tracking-[0.15em] uppercase mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: NAVY }}>{t}</div>
                <p className="text-sm leading-[1.7]" style={{ color: `${NAVY}CC` }}>{d}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="exit" eyebrow="26 — Exit Landscape" title="Multiple credible paths to institutional-grade outcomes.">
          <p>
            Business-software M&amp;A remains the most active category of enterprise-tech consolidation<Cite ns={[11]}/>. Category-defining SaaS companies exit through strategic acquisition, PE-led buyout, or IPO on the back of durable ARR.
          </p>
          <ul className="list-disc pl-6 space-y-2">
              <li><strong style={{ color: NAVY }}>Strategic acquirers.</strong> Microsoft, Google, Salesforce, ServiceNow, SAP, Oracle, Zoho, and other enterprise-platform incumbents with organizational-intelligence gaps in their roadmap<Cite ns={[12]}/>.</li>
              <li><strong style={{ color: NAVY }}>Private equity.</strong> Vista, Thoma Bravo, and other software-focused PE with vertical SaaS mandates once ARR crosses institutional thresholds.</li>
              <li><strong style={{ color: NAVY }}>Public markets.</strong> Category-defining SaaS platforms have consistently demonstrated public-market appetite for durable ARR compounding at global scale.</li>
          </ul>
        </Section>

        <Section id="diligence" eyebrow="27 — Due Diligence" title="Legal, IP, and compliance posture — ready for institutional review.">
          <p>
            Diligence is not a post-term-sheet scramble. Corporate, intellectual-property, compliance, and financial artifacts are maintained continuously and released to qualified investors under NDA through the data room.
          </p>
          <div className="not-prose grid md:grid-cols-2 gap-6 mt-6">
            {[
              ["Corporate & governance", "the Intelligent Office showcase project (Delaware C-Corporation) is the sole investment, contracting, and IP-holding entity, operating an Africa engineering center under an intercompany services agreement with full work-product assignment to the parent. Certificate of incorporation, bylaws, board consents, cap table, stock ledger, founder restricted-stock agreements with vesting and 83(b) elections, and an equity incentive pool are maintained as standing records."],
              ["Intellectual property", "All platform source code, models, prompts, designs, and brand assets are owned by the Delaware parent. Every founder, employee, and contractor executes IP assignment and confidentiality agreements as a condition of engagement, including cross-border assignment from the engineering affiliate. Intelligent Office trademark filings are in progress; no third-party IP claims, liens, or encumbrances exist."],
              ["Open source & third-party", "A dependency inventory with license classification is maintained; the stack uses permissive licences only (MIT, Apache-2.0, BSD) with no copyleft obligations in distributed code. Automated dependency and vulnerability scanning runs continuously, and material vendor and infrastructure agreements are catalogued in the data room."],
              ["Data protection & compliance", "Privacy-by-design architecture with database-level tenant isolation, AES-256 at rest, TLS 1.3 in transit, role-scoped access control, and append-only audit and signature ledgers. NDPR and GDPR alignment includes DPA templates, a sub-processor register, retention and deletion policies, breach-notification runbooks, and data-residency options. SOC 2 Type I readiness is scoped in the use of funds."],
              ["Employment & contracts", "Standard offer letters, contractor agreements, and confidentiality terms across both entities; no outstanding employment disputes. Customer-facing agreements — MSA, DPA, and enterprise addenda covering data portability, wind-down notice, and escrow — are templated and legally reviewed."],
              ["Financial & tax", "Books maintained on accrual basis with ASC 606 revenue-recognition policy defined ahead of first revenue; separate entity ledgers with an intercompany services agreement and transfer-pricing basis between the US parent and Nigerian affiliate. No debt, no convertible instruments outstanding, and no contingent liabilities. Full three-year model and assumptions are in Materials."],
              ["Litigation & regulatory", "No pending or threatened litigation, regulatory action, or governmental investigation against either entity, and no prior financing disputes or unresolved founder claims."],
              ["Data room access", "A structured index — corporate, IP, financial, technical, security, and commercial folders — mirrors the Due Diligence Package below. Access is granted to qualified investors under NDA, with per-investor access logging."],
            ].map(([t, d]) => (
              <div key={t} className="border-t pt-4" style={{ borderColor: NAVY }}>
                <div className="text-sm tracking-[0.15em] uppercase mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t}</div>
                <p className="text-sm leading-[1.7]" style={{ color: `${NAVY}CC` }}>{d}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="downloads" eyebrow="28 — Materials & Data Room" title="The complete institutional package.">
          <div className="not-prose border" style={{ borderColor: NAVY }}>
            <table className="w-full text-sm">
              <tbody>
                {Downloads.map((d) => (
                  <tr key={d.name} style={{ borderTop: `1px solid ${NAVY}22` }}>
                    <td className="py-3 px-4" style={{ color: NAVY }}>
                      {d.href ? (
                        <a href={d.href} download className="underline hover:no-underline" style={{ color: NAVY }}>{d.name}</a>
                      ) : d.name}
                    </td>
                    <td className="py-3 px-4 text-xs" style={{ color: `${NAVY}99` }}>{d.phase}</td>
                    <td className="py-3 px-4 text-right">
                      {d.status === "ready" && d.href ? (
                        <a href={d.href} download className="inline-flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase px-2 py-1 border no-underline hover:opacity-80 transition-opacity" style={{ borderColor: GOLD, color: GOLD, fontFamily: "'Space Grotesk', sans-serif", background: `${GOLD}15` }}>
                          <Download className="w-3 h-3" /> Download
                        </a>
                      ) : (
                        <span className="text-[10px] tracking-[0.2em] uppercase px-2 py-1 border" style={{ borderColor: d.status === "in-progress" ? GOLD : `${NAVY}44`, color: d.status === "in-progress" ? GOLD : `${NAVY}77`, fontFamily: "'Space Grotesk', sans-serif" }}>
                          {d.status === "in-progress" ? "In assembly" : "Queued"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="not-prose mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generateSecurityPack}
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase px-3 py-2 border hover:opacity-80 transition-opacity"
              style={{ borderColor: GOLD, color: GOLD, fontFamily: "'Space Grotesk', sans-serif", background: `${GOLD}15` }}
            >
              <Download className="w-3.5 h-3.5" /> Security &amp; Continuity Pack (PDF)
            </button>
            <span className="text-xs" style={{ color: `${NAVY}99` }}>
              Encryption, RPO/RTO, backups, restoration drills, insurance and escrow — generated live.
            </span>
          </div>
          <div className="not-prose mt-8 border p-6" style={{ borderColor: NAVY }}>
            <div className="flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase mb-3" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>
              <ShieldCheck className="w-3.5 h-3.5" /> Secure Investor Data Room
            </div>
            <p className="text-sm leading-[1.7] mb-5" style={{ color: `${NAVY}CC` }}>
              Every document above is available for immediate download. The secure data room — corporate records, cap table,
              financial model, technical and security documentation, commercial agreements, and full fundraising materials —
              is granted to qualified investors under NDA through a time-limited portal account. Every document open is logged
              with who, when, which document, and time on document. Approved investors also get a personalised due-diligence
              tracker and a secure channel for questions, document requests, and meetings.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => { track("data_room_access_requested"); setAccessOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white transition-colors" style={{ background: NAVY }}>
                <Lock className="w-4 h-4" /> Request Data Room Access
              </button>
              <Link to="/investor-portal" className="inline-flex items-center gap-2 px-4 py-2 text-sm border no-underline" style={{ borderColor: NAVY, color: NAVY }}>
                <ArrowUpRight className="w-4 h-4" /> Investor portal sign-in
              </Link>
            </div>
          </div>
        </Section>

        <ClosingStatement />

        {/* Citations */}
        <section className="py-16 border-t" style={{ borderColor: NAVY }}>
          <p className="text-[11px] tracking-[0.22em] uppercase mb-6" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Notes & Sources</p>
          <ol className="space-y-2 text-xs" style={{ color: `${NAVY}99` }}>
            {CITATIONS.map((c) => (
              <li key={c.n} id={`cite-${c.n}`} className="flex gap-3">
                <span style={{ color: GOLD }}>{c.n}.</span>
                <span>
                  {c.text}{" "}
                  {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: `${NAVY}` }}>Link</a>}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-[11px]" style={{ color: `${NAVY}77` }}>
            All third-party marks are the property of their respective owners. Market figures are reproduced from cited sources for reference only. Financial figures presented herein are strategic assumptions for a pre-launch venture and are not forward-looking guidance.
          </p>
        </section>

        {/* Colophon */}
        <footer className="py-16 border-t" style={{ borderColor: NAVY }}>
          <div className="flex flex-wrap gap-8 justify-between items-end">
            <div>
              <div className="text-xs tracking-[0.22em] uppercase" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Intelligent Office</div>
              <div className="mt-2 text-sm" style={{ color: `${NAVY}99` }}>A product of the Intelligent Office showcase project — a Delaware C-Corporation (USA)</div>
              <div className="mt-1 text-sm" style={{ color: `${NAVY}99` }}>Africa engineering center: Lagos, Nigeria</div>
              <div className="mt-1 text-sm" style={{ color: `${NAVY}99` }}>Founder: Wisdom Jonathans</div>
            </div>
            <div className="text-xs text-right" style={{ color: `${NAVY}77` }}>
              Confidential — Prepared for prospective investors<br/>
              This document does not constitute an offer to sell securities.<br/>
              <Link to="/" className="underline mt-2 inline-block">Return to intelligent-office.example</Link>
            </div>
          </div>
        </footer>
      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: ${BONE} !important; }
          nav a, .print\\:hidden { display: none !important; }
          section { break-inside: avoid; page-break-inside: avoid; }
          h2 { break-after: avoid; }
        }
        .prose-investor p { margin-bottom: 1.1rem; }
        .prose-investor strong { color: ${NAVY}; }
      `}</style>
      <BookMeetingDialog open={meetingOpen} onOpenChange={setMeetingOpen} />
      <RequestAccessDialog open={accessOpen} onOpenChange={setAccessOpen} />
    </div>
  );
};

export default Investors;