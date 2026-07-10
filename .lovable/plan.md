# Global Office — Investor Package Plan

Private, unlisted `/investors` route (no nav/footer link) + a downloadable institutional fundraising package. Built in reviewed phases so nothing is fabricated and each phase is inspected before the next.

## Ground rules (all phases)
- **Evidence-based.** Every market stat carries a citation (Gartner, IDC, Statista, McKinsey, World Bank, IFC, GSMA, Endeavor, Partech Africa). Where a number is a strategic assumption, it is labeled as such.
- **No fabricated traction.** Pre-seed, pre-launch is stated plainly. Story is built on founder–market fit, product readiness, and market timing — the same posture Endeavor/DFI-backed pre-seed decks use.
- **Founder narrative** uses the bio you provided verbatim (lightly edited for concision), attributed to Wisdom Jonathans.
- **Design bar.** Editorial, institutional — think Sequoia memos meets Stripe Atlas. Deep navy + editorial serif display, Space Grotesk for eyebrows, Inter for body. No SaaS-landing tropes, no gradients-as-decoration, no stock hero blobs.
- **AI Investment Committee** simulated at the end of each phase; findings drive revisions before I mark a phase done.

## Phase 1 — Private Investor Page + Core Narrative (this turn)
Deliverables:
1. `/investors` route (unlisted, robots noindex, not linked from nav/footer). Optional access-code gate (simple client-side passcode you set).
2. Long-form investor narrative page covering: Vision · Why Now · Problem · Solution · Category (AI-BOS) · Product Architecture · Market (TAM/SAM/SOM with citations) · Competition & White Space · Business Model · Moat · Go-to-Market · Financial Assumptions (ranges, not fabricated actuals) · Team · Ask ($1.5M pre-seed, use of funds, 18–24mo milestones) · Risks · Exit Landscape.
3. Downloads panel wired to the artifacts produced in later phases (grays out until each is generated).
4. Executive Summary (inline + downloadable PDF-ready view).
5. Investor One-Pager (printable).

Design system additions (scoped to `/investors` only, no impact on existing app):
- Editorial serif (Instrument Serif or Fraunces) for display; keep Space Grotesk + Inter elsewhere.
- Navy #0B1533 / bone #F5F1E8 / accent gold #C9A24C. Thin rules, generous whitespace, footnote-style citations.

## Phase 2 — Pitch Deck + Speaker Notes (next turn)
- 22-slide investor deck (PPTX) matching your specified structure, generated with the pptx skill and QA'd slide-by-slide.
- Speaker notes per slide.
- Elevator / 5-min / 10-min / 30-min pitch scripts (DOCX).

## Phase 3 — Financial Model + Business Plan (turn 3)
- 3-year financial model (XLSX): revenue build, pricing tiers, CAC/LTV, gross margin, opex, burn, runway, sensitivity.
- Strategic Business Plan (DOCX, ~40 pages).
- Investment Memorandum (DOCX, institutional format).

## Phase 4 — Market & Competitive Intelligence (turn 4)
- Market Research Report (with cited TAM/SAM/SOM buildup for SSA SME software).
- Competitive Analysis Report (Microsoft, Google, Zoho, Odoo, Bitrix24, Freshworks, Monday, ClickUp, HubSpot, Salesforce, SAP, NetSuite — positioning, pricing, gaps, white space).
- Product Strategy + Technical Architecture Overview.
- Brand Positioning Document.

## Phase 5 — Diligence & Variants (turn 5)
- Due Diligence Package + Data Room Checklist.
- FAQ / Objection Responses / Founder Talking Points / Product Demo Script.
- Variants: Grant Proposal · DFI version · Strategic Partnership version · Bank Financing version.
- Company/Corporate Profile.

## Phase 6 — Investment Committee Review + Revision (turn 6)
- Simulated review by Angel · Seed VC · Growth VC · CVC · Family Office · DFI · Impact · Bank Credit Committee.
- Consolidated red-team findings.
- Revisions applied across all documents until institutional bar is met.

## Technical notes (implementation details)
- New route `/investors` in `src/App.tsx`, wrapped in a small `InvestorGate` component (localStorage passcode; default disabled, you toggle).
- New page `src/pages/Investors.tsx` composed of section components under `src/components/investors/`.
- `robots.txt` disallows `/investors`; page sets `<meta name="robots" content="noindex,nofollow">` via react-helmet-async (installing it if not present).
- Downloadable artifacts saved to `/mnt/documents/global-office-investor-pack/` and surfaced with `<presentation-artifact>` tags each phase.
- No changes to existing landing, dashboard, or auth flows.

## What I need from you to start Phase 1
Confirm:
1. **Passcode gate** — yes (give me a passcode) or no (unlisted URL only)?
2. **Company legal entity** to reference (e.g., "Global Office, a product of Soteria AI Technologies Limited") — is that correct?
3. Anything you do NOT want stated publicly on the page (e.g., exact valuation range, geographic sequencing).

On your confirmation I'll build Phase 1 end-to-end.