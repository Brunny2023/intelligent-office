import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Download, Lock, Printer } from "lucide-react";
import {
  InvestorBrief, IntelligenceStack, MoatFlywheel, IncumbentGrid,
  ProductProof, DemoVideoBlock, PositioningMatrix, ValidationCards,
  RoadmapTimeline, ConfidenceCards, ClosingStatement,
} from "@/components/investors/InvestorSections";

// ---------------------------------------------------------------------------
// Global Office — Private Investor Brief
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
  { id: "gtm", label: "17 — Go-to-Market" },
  { id: "moat", label: "18 — Defensibility" },
  { id: "validation", label: "19 — Traction" },
  { id: "roadmap", label: "20 — Roadmap" },
  { id: "confidence", label: "21 — At a Glance" },
  { id: "financials", label: "22 — Financials" },
  { id: "team", label: "23 — Team" },
  { id: "ask", label: "24 — The Ask" },
  { id: "risks", label: "25 — Risks" },
  { id: "exit", label: "26 — Exit Landscape" },
  { id: "downloads", label: "27 — Materials" },
];

const Downloads = [
  { name: "Investor Pitch Deck (PPTX, 22 slides)", status: "ready", phase: "Phase 2", href: "/investor-pack/Global-Office-Investor-Deck.pptx" },
  { name: "Deck Speaker Notes (DOCX)", status: "ready", phase: "Phase 2", href: "/investor-pack/Global-Office-Investor-Deck-Speaker-Notes.docx" },
  { name: "Pitch Scripts — Elevator / 5 / 10 / 30-min (DOCX)", status: "ready", phase: "Phase 2", href: "/investor-pack/Global-Office-Pitch-Scripts.docx" },
  { name: "Investor One-Pager (DOCX)", status: "ready", phase: "Phase 1", href: "/investor-pack/Global-Office-Investor-One-Pager.docx" },
  { name: "Investment Memorandum (DOCX)", status: "ready", phase: "Phase 3", href: "/investor-pack/Global-Office-Investment-Memorandum.docx" },
  { name: "Strategic Business Plan (DOCX)", status: "ready", phase: "Phase 3", href: "/investor-pack/Global-Office-Business-Plan.docx" },
  { name: "Three-Year Financial Model (XLSX)", status: "ready", phase: "Phase 3", href: "/investor-pack/Global-Office-Financial-Model.xlsx" },
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
  useEffect(() => {
    const prev = { title: document.title };
    document.title = "Global Office — Investor Brief (Confidential)";

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
    const undoDesc = setMeta("description", "Confidential investor brief for Global Office — the Organizational Intelligence Layer for the modern enterprise.");

    // Load editorial serif for this page only
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap";
    document.head.appendChild(link);

    return () => {
      document.title = prev.title;
      undoRobots();
      undoDesc();
      link.remove();
    };
  }, []);

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
              Global Office · Investor Brief · MMXXVI
            </p>
            <h1 className="mt-6 text-5xl md:text-7xl lg:text-8xl leading-[0.95] max-w-5xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, letterSpacing: "-0.02em" }}>
              The Organizational Intelligence Layer for the modern enterprise.
            </h1>
            <p className="mt-8 max-w-2xl text-lg md:text-xl leading-[1.6]" style={{ color: `${NAVY}CC` }}>
              Microsoft owns documents. Google owns communication. Salesforce owns customers. SAP owns resources. Notion owns knowledge. <strong style={{ color: NAVY }}>Global Office owns organizational intelligence</strong> — delivered as an AI Business Operating System.
            </p>
          </div>
          <div className="flex flex-col gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-none border transition-colors hover:bg-[color:var(--navy)] hover:text-[color:var(--bone)]"
              style={{ borderColor: NAVY, color: NAVY, ["--navy" as any]: NAVY, ["--bone" as any]: BONE }}
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <a href="#downloads" className="inline-flex items-center gap-2 px-4 py-2 text-sm border" style={{ borderColor: NAVY, color: NAVY }}>
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

        <Section id="thesis" eyebrow="02 — Investment Thesis" title="Organizations have data. They do not have intelligence. Global Office builds the layer that turns one into the other.">
          <p>
            Modern businesses run on ten to thirty disconnected tools — email, chat, spreadsheets, project trackers, HR platforms, finance systems, CRMs, storage drives, video meetings, and ad-hoc AI assistants. The result is not productivity. It is coordination overhead. Work fragments across surfaces. Context is lost. Decisions are made without evidence. AI, in this environment, is an add-on to chaos rather than an amplifier of order.
          </p>
          <p>
            Global Office collapses this fragmentation into the <strong>Organizational Intelligence Layer</strong> — a persistent, graph-modeled substrate (entities, edges, and events materialized on Postgres) where every action, artifact, and decision is a first-class citizen. The AI Business Operating System is how customers experience it. The intelligence layer is what compounds.
          </p>
          <p>
            The ICP is global-first — SMEs and mid-market organizations across the United States, United Kingdom, European Union, and other developed economies where AI-native operating layers command the strongest willingness to pay, followed by an emerging-markets expansion motion. Traditional software manages functions. Global Office manages organizational intelligence.
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
              Frontier models are now capable, cheap, and fast enough to embed reasoning inside every business workflow. McKinsey estimates generative AI could add $2.6–4.4 trillion in annual productivity value<Cite ns={[4]}/>, with the largest gains in operations, sales, software engineering, and customer support — the exact surfaces Global Office unifies.
            </li>
            <li>
              <span className="block text-sm tracking-[0.2em] uppercase mb-1" style={{ color: GOLD }}>ii. SaaS unbundling has run its course</span>
              A decade of point solutions produced fatigue, sprawl, and negative net-retention pressure across the mid-market<Cite ns={[3]}/>. Buyers are now consolidating. The rebundling window — historically the moment new category leaders emerge — is open.
            </li>
            <li>
              <span className="block text-sm tracking-[0.2em] uppercase mb-1" style={{ color: GOLD }}>iii. Emerging markets are digitizing at scale</span>
              Sub-Saharan Africa alone will reach 692 million unique mobile subscribers and $210B in mobile economic value by 2030<Cite ns={[8]}/>. SME formalization is accelerating, but existing software (Microsoft, Google, Zoho, Odoo) was built for another market's shape of work.
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
            For emerging-market SMEs, the problem is compounded: legacy suites are priced for Western enterprises, designed around desktop-first workflows, and offer no meaningful support for local context — payroll structures, tax regimes, hiring norms, connectivity conditions, or language.
          </p>
        </Section>

        <Section id="solution" eyebrow="08 — The Solution" title="One graph. One intelligence layer. One system.">
          <p>
            Global Office replaces the disconnected stack with a single, AI-native operating system organized around how work actually happens: people, tasks, conversations, documents, decisions, and outcomes — all bound into one knowledge graph, all observed by one intelligence layer, all extensible through one workflow engine.
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

        <Section id="category" eyebrow="11 — Category Definition" title="Global Office is not office software. It is the Organizational Intelligence Layer.">
          <p>
            Every prior category — ERP, CRM, collaboration, project management, HRIS, BI — was a surface for a function. Global Office is a substrate for the organization itself. The distinction is architectural, not marketing.
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
            The full technical architecture, data model, security posture, and roadmap are documented in the Technical Architecture Overview (Phase 4 deliverable).
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
            SMEs represent approximately 90% of businesses and more than 50% of employment worldwide<Cite ns={[5]}/>. In Africa alone, formal SMEs face a $331B annual finance gap<Cite ns={[6]}/> — a signal not of weakness but of untapped enterprise density. As these businesses formalize and digitize, they will not adopt the tools their Western predecessors used a decade ago. They will adopt what fits their shape of work — mobile-first, AI-native, priced correctly.
          </p>
          <p>
            African venture funding stabilized at $3.5B across 547 rounds in 2023<Cite ns={[7]}/> — a durable base after the global correction. Software as a share of that capital is growing.
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
        <RoadmapTimeline />
        <ConfidenceCards />

        <Section id="financials" eyebrow="22 — Financial Framework" title="Framework, not fabricated actuals. The full model is a Phase-3 deliverable.">
          <p>
            The company is pre-revenue at the time of this brief. The framework below reflects the operating assumptions that drive the 18–24 month plan and the seed-round milestones. Every number will be built up bottom-up in the accompanying Financial Model (XLSX), stress-tested across three scenarios (base, downside, upside), and made auditable cell-by-cell.
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
                  ["Gross margin at scale", "78 – 84%", "Standard vertical-SaaS band with AI COGS metered"],
                  ["CAC (SME segment)", "$120 – $280", "Blended PLG + channel; content-led inbound"],
                  ["LTV : CAC target (Year 3)", "≥ 3.5x", "Consistent with top-quartile SMB SaaS benchmarks"],
                  ["Payback period", "12 – 18 months", "Base case; upside <10 months with channel maturity"],
                  ["Logo retention", "85 – 92%", "Range for mid-market SaaS; suite lock-in supports upper band"],
                  ["Net revenue retention", "108 – 125%", "Seat expansion + AI credit expansion"],
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

        <Section id="team" eyebrow="23 — Team" title="Founded by an operator building AI systems for organizational scale.">
          <p>
            <strong style={{ color: NAVY }}>Wisdom Jonathans — Founder &amp; CEO.</strong> Nigerian entrepreneur and AI systems strategist. Founder and CEO of Soteria AI Technologies Limited, developing AI-powered products for business operations, decision-making, capital access, education, and public safety. Publisher of <em>The Strategic Signal</em>, a newsletter on strategy, AI, and the future of organizations.
          </p>
          <p>
            Prior to Global Office, Wisdom founded and led Elevate AI, working directly with businesses to apply AI and workflow automation to real operational problems — the experience that surfaced the coherence problem this company was built to solve. He has served in governance and executive leadership across technology ventures, education (Vice Chairman, Exceeding Grace International Aviation College), nonprofit organizations, and faith-based institutions.
          </p>
          <p>
            Founding-team hires across engineering, product, sales, and customer success are scoped in the use-of-funds and will be executed in the first six months post-close. Advisory bench across AI infrastructure, SaaS go-to-market, and African market expansion is being assembled and disclosed under NDA in the data room.
          </p>
        </Section>

        <Section id="ask" eyebrow="24 — The Ask" title="$1.5M Pre-Seed. 18–24 month runway. Seed-ready at close of period.">
          <div className="not-prose grid md:grid-cols-2 gap-10 mt-4">
            <div>
              <div className="text-xs tracking-[0.22em] uppercase mb-3" style={{ color: GOLD }}>Use of Funds (indicative)</div>
              <ul className="text-sm space-y-2" style={{ color: `${NAVY}CC` }}>
                <li>· Commercial launch &amp; GTM execution — ~35%</li>
                <li>· Engineering &amp; AI platform enhancement — ~30%</li>
                <li>· Sales, customer success &amp; partnerships — ~15%</li>
                <li>· Cloud infrastructure &amp; scalability — ~8%</li>
                <li>· Legal, security, regulatory readiness — ~5%</li>
                <li>· Working capital &amp; contingency — ~7%</li>
              </ul>
            </div>
            <div>
              <div className="text-xs tracking-[0.22em] uppercase mb-3" style={{ color: GOLD }}>Milestones to Seed</div>
              <ul className="text-sm space-y-2" style={{ color: `${NAVY}CC` }}>
                <li>· Commercial launch across 4 SSA markets</li>
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
              ["Concentration risk", "SSA-only base early. Mitigation: geographic sequencing to UK/EU by Year 2; enterprise motion by Year 3."],
              ["Talent risk", "Senior engineering and GTM hiring in Africa. Mitigation: remote-first hiring, diaspora pipeline, equity-heavy comp."],
              ["Capital risk", "Correction in venture funding. Mitigation: capital-efficient milestones; DFI and strategic-investor optionality."],
            ].map(([t, d]) => (
              <div key={t} className="border-t pt-4" style={{ borderColor: NAVY }}>
                <div className="text-sm tracking-[0.15em] uppercase mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t}</div>
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
            <li><strong style={{ color: NAVY }}>Strategic acquirers.</strong> Microsoft, Google, Salesforce, Zoho, ServiceNow, SAP, Oracle, and regional telcos with SME-services ambitions<Cite ns={[12]}/>.</li>
            <li><strong style={{ color: NAVY }}>Private equity.</strong> Vista, Thoma Bravo, and regional PE with vertical SaaS mandates once ARR crosses institutional thresholds.</li>
            <li><strong style={{ color: NAVY }}>Public markets.</strong> Emerging-markets category leaders (Shopify, MELI, Nubank pattern) have demonstrated public-market appetite for durable ARR compounding at global scale.</li>
          </ul>
        </Section>

        <Section id="downloads" eyebrow="27 — Materials & Data Room" title="Institutional package under active assembly.">
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
          <p className="mt-6 text-sm" style={{ color: `${NAVY}99` }}>
            Downloadable files will be attached to this page as each phase is completed. Full data room access is available to qualified investors under NDA — contact the founder directly.
          </p>
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
              <div className="text-xs tracking-[0.22em] uppercase" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Global Office</div>
              <div className="mt-2 text-sm" style={{ color: `${NAVY}99` }}>A product of Soteria AI Technologies Limited</div>
              <div className="mt-1 text-sm" style={{ color: `${NAVY}99` }}>Founder: Wisdom Jonathans · Lagos · Nairobi · Johannesburg · Accra</div>
            </div>
            <div className="text-xs text-right" style={{ color: `${NAVY}77` }}>
              Confidential — Prepared for prospective investors<br/>
              This document does not constitute an offer to sell securities.<br/>
              <Link to="/" className="underline mt-2 inline-block">Return to globaloffice.cloud</Link>
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
    </div>
  );
};

export default Investors;