# Visual Overhaul Plan

I now have all 20+ dashboard reference screenshots (197–221). Here's how I'll execute the overhaul:

## Strategy

Recreate each dashboard as a high-fidelity **generic-branded mockup** (no "Soteria AI Technologies" text, no "Activate Windows" watermark, no browser chrome, no personal name "Manny"). Use synthetic but realistic seed data so every screen looks like a thriving org — not an empty tenant.

All mockups will be rendered as **HTML/JSX components** (not baked images) so they:
- Stay pixel-crisp at any resolution
- Can be animated in the live demo
- Match the real design tokens exactly (navy sidebar, gold accents)
- Are easy to update if branding changes again

## Scope

### 1. Mockup component library (`src/components/mockups/`)
One component per dashboard, all consuming shared seed data:
- `DashboardMockup` — health score 87%, filled task/attendance stats, AI insight card
- `AttendanceMockup` — active clock-in, team presence grid
- `JobPlanningMockup` — 6 targets with progress bars
- `ExecutionMockup` — kanban with 3 columns populated
- `MessagesMockup` — 4 channels, active thread
- `MeetingsMockup` — upcoming + past meetings with summaries
- `AnnouncementsMockup` — 3 broadcasts with read counts
- `ActivityMockup` — recent activity feed populated
- `KPIMockup` — 5 KPIs with sparklines
- `KnowledgeGraphMockup` — nodes + edges visualization
- `AIInsightsMockup` — 4 predictive alerts
- `ExecutiveMockup` — health 87%, dept perf, task distribution, weekly trend
- `WorkflowsMockup` — 3 workflows, running instances
- `HRMockup` — 5 job postings, candidates
- `FinanceMockup` — payroll table with 8 employees
- `TeamMockup` — 12 members, 3 departments
- `SecurityMockup` — GDPR/NDPR toggles, audit events
- `PartnerConnectMockup` — 3 partner org conversations

Shared `MockupShell` wraps sidebar + top bar with **"Global Office"** branding, generic avatar "Alex Rivera", role "Executive".

### 2. Live Demo page (`/demo`)
Replace scripted flow with a **cinematic auto-cycling tour**:
- Timeline animates through 10 signature dashboards (~4s each)
- Framer Motion cross-fades between mockups
- Cursor overlay clicks sidebar items in sync
- Progress dots + pause/next controls
- "See it in your org" CTA at the end

### 3. Landing DemoModal
Same cycling engine, condensed to 6 hero screens (Dashboard, Executive, KPIs, Knowledge Graph, AI Insights, Meetings). Autoplay on open.

### 4. Investors page imagery
Swap hero screenshot placeholders with static frames from `DashboardMockup`, `ExecutiveMockup`, `KnowledgeGraphMockup`, `AIInsightsMockup`. Rendered inside MacBook-style bezel component.

### 5. Investor-pack documents (deferred)
Regenerate PDFs/PPTX in `public/investor-pack/` with new screenshots as embedded images (rendered via Playwright screenshot of the mockup components at 2x DPR). This will run last as a batch.

## Technical notes

- Zero backend changes.
- All mockups are pure presentational — no Supabase queries, no auth checks. Safe to render on public routes.
- Seed data lives in `src/components/mockups/seed.ts` — one edit updates all screens.
- Design tokens from `index.css` used throughout — no hardcoded colors.
- Playwright screenshotting for PDF embeds runs in `/tmp/browser/`, outputs to `public/investor-pack/img/`.

## Deliverables in this pass

I'll ship items 1–4 in this turn (mockup library + demo + modal + investors imagery). Item 5 (PDF regeneration) is a separate longer-running pass — I'll queue it and confirm before running Playwright.
