export type ChecklistItem = {
  /** Category key from DATA_ROOM_CATEGORIES */
  category: string;
  label: string;
  /** Lowercase keywords — a doc counts as present if its title contains all of any group */
  match: string[][];
  required: boolean;
};

export const DATA_ROOM_CHECKLIST: ChecklistItem[] = [
  // Corporate
  { category: "corporate", label: "Certificate of Incorporation", match: [["incorporat"], ["certificate"]], required: true },
  { category: "corporate", label: "Bylaws / Operating Agreement", match: [["bylaw"], ["operating agreement"]], required: true },
  { category: "corporate", label: "Cap Table", match: [["cap table"], ["capitalization"]], required: true },
  { category: "corporate", label: "Board Minutes & Consents", match: [["board"]], required: false },
  { category: "corporate", label: "Org Chart & Leadership Bios", match: [["org chart"], ["leadership"], ["team"]], required: true },
  // Financial
  { category: "financial", label: "Historical P&L", match: [["p&l"], ["profit"], ["income statement"]], required: true },
  { category: "financial", label: "Financial Model / Projections", match: [["model"], ["projection"], ["forecast"]], required: true },
  { category: "financial", label: "Balance Sheet & Cash Flow", match: [["balance sheet"], ["cash flow"]], required: true },
  { category: "financial", label: "Unit Economics (CAC/LTV)", match: [["unit econom"], ["cac"], ["ltv"]], required: false },
  { category: "financial", label: "Bank Statements / Audit", match: [["bank"], ["audit"]], required: false },
  // Product & Technology
  { category: "product", label: "Product Roadmap", match: [["roadmap"]], required: true },
  { category: "product", label: "Architecture Overview", match: [["architect"], ["technolog"], ["tech stack"]], required: true },
  { category: "product", label: "Security & Continuity Pack", match: [["security"], ["continuity"]], required: true },
  { category: "product", label: "AI / Intelligence Layer Brief", match: [["intelligence"], ["ai "]], required: false },
  // Commercial
  { category: "commercial", label: "Traction & Metrics Report", match: [["traction"], ["metric"]], required: true },
  { category: "commercial", label: "Customer Contracts / LOIs", match: [["contract"], ["loi"], ["letter of intent"]], required: true },
  { category: "commercial", label: "Go-to-Market Plan", match: [["go-to-market"], ["gtm"], ["market"]], required: true },
  { category: "commercial", label: "Pipeline & Pricing", match: [["pipeline"], ["pricing"]], required: false },
  // Legal & Compliance
  { category: "legal", label: "IP Assignment Agreements", match: [["ip assign"], ["intellectual"], ["ip "]], required: true },
  { category: "legal", label: "Employment / Contractor Agreements", match: [["employment"], ["contractor"]], required: true },
  { category: "legal", label: "Data Protection (DPA / Privacy)", match: [["dpa"], ["privacy"], ["data protection"]], required: true },
  { category: "legal", label: "Trademarks & Registrations", match: [["trademark"], ["registration"]], required: false },
  { category: "legal", label: "Litigation Disclosure", match: [["litigation"], ["disclosure"]], required: false },
  // Fundraising
  { category: "fundraising", label: "Pitch Deck", match: [["pitch"], ["deck"]], required: true },
  { category: "fundraising", label: "Investor Memorandum", match: [["memorandum"], ["memo"]], required: true },
  { category: "fundraising", label: "One-Pager / Executive Summary", match: [["one-pager"], ["one pager"], ["executive summary"]], required: true },
  { category: "fundraising", label: "Term Sheet / Use of Funds", match: [["term sheet"], ["use of funds"]], required: true },
  { category: "fundraising", label: "Exit Strategy & Comparables", match: [["exit"], ["comparable"]], required: false },
];

export const isChecklistItemSatisfied = (
  item: ChecklistItem,
  titles: { category: string; title: string }[],
) =>
  titles.some(
    (d) =>
      d.category === item.category &&
      item.match.some((group) => group.every((kw) => d.title.toLowerCase().includes(kw))),
  );