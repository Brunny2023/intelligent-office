# Plan: Phase 6 Admin/Super Admin + Investor Page Elevation

Two large, independent workstreams. Both delivered in this pass.

---

## Workstream A — Phase 6: Admin & Super Admin Panel

### A1. Scope
Two tiers:
- **Org Admin** (owner/executive): extends existing `AdminDashboard.tsx` with usage monitoring, system health, audit trail.
- **Super Admin** (platform-level, cross-tenant): new gated surface for tenant overview, platform usage, health, billing signals.

### A2. Super Admin gating
- New `app_role` value is out-of-scope; instead gate by an env-configured allowlist of `user.email` values stored in a new `platform_admins` table (RLS: only self-read; service role writes).
- Migration: create `public.platform_admins (user_id uuid PK, email text, created_at)` + grants + RLS + `is_platform_admin(uid)` security-definer function.
- New route `/super-admin` protected by `ProtectedRoute` + `is_platform_admin` check; redirects otherwise.

### A3. Super Admin surfaces (`src/pages/SuperAdmin.tsx`)
Tabs:
1. **Tenants** — list all orgs (name, slug, member count, plan, created_at, last_activity). Search + sort. Row → tenant detail drawer with member list, storage usage, ticket count, task count.
2. **Usage** — platform-wide counters: total orgs, MAU (distinct users with activity in 30d), tasks created (30d), messages sent (30d), AI insights generated (30d), storage used. Sparkline via lightweight inline SVG (no chart lib).
3. **System Health** — DB latency probe (round-trip `select 1`), edge function ping (`livekit-token` health), storage bucket reachability, auth service check, error rate (last 100 activity_logs errors). Green/amber/red pills.
4. **Audit / Activity** — recent cross-tenant `activity_logs` (last 200) with tenant filter.

Data via existing tables + a new SQL RPC `get_platform_stats()` (security definer, checks `is_platform_admin`).

### A4. Org Admin enhancements (`AdminDashboard.tsx`)
Add tabs beside existing Members/Tickets:
- **Usage** — org-scoped: tasks 30d, messages 30d, storage MB, AI credits consumed (best-effort from `ai_insights` count), active users 7d/30d.
- **Health** — org-level status pills: attendance completeness today, overdue tasks %, unread announcements %, unresolved tickets aged >72h.
- **Audit** — org's `activity_logs` with filters.

### A5. Access + nav
- Add "Super Admin" link in sidebar only when `is_platform_admin` returns true.
- Keep existing Admin link.

---

## Workstream B — Investor Page Elevation

### B1. Positioning shift
Reframe copy sitewide on `/investors` from "AI Business Operating System" to lead with **"Organizational Intelligence Layer"**, with ABOS as the delivery layer. Preserve existing content; strengthen and layer new sections.

### B2. New sections (in order, inserted into `src/pages/Investors.tsx`)
1. **Hero refresh** — headline: *"The Organizational Intelligence Layer for Modern Enterprises."* Sub: contrast incumbents (Microsoft/Google/Salesforce/SAP/Notion each own one slice; Global Office owns organizational intelligence).
2. **5-Minute Investor Brief** — sticky card grid: Problem, Solution, Market, Why Now, Moat, Business Model, Ask, Traction, Milestones.
3. **The Missing Layer** — animated architecture stack (People → Projects → Messages → … → Knowledge Graph → Intelligence Layer → Recommendations → Automation → Decisions → Outcomes). Framer Motion; upward data pulses, downward insight pulses. Pure SVG + motion, no new deps.
4. **Strategic Moat (Compounding Loop)** — circular flywheel diagram: More Users → More Org Data → Richer Graph → Smarter Intelligence → Better Recs → Higher Value → More Adoption ↺.
5. **Why Incumbents Can't Copy This** — 5 cards (MSFT doc-centric, Google comms-centric, Salesforce CRM-centric, SAP ERP-centric, Notion knowledge-centric) contrasted with Global Office graph-centric.
6. **Product Proof** — placeholder device mockups for Executive Control Center, Workflow Builder, Knowledge Graph Explorer, Org Health Dashboard. Uses existing screenshots where available; otherwise elegant placeholder frames.
7. **Demo Video** — "See Organizational Intelligence in Action" section, 90s walkthrough placeholder with play affordance (opens existing `DemoModal` or Vimeo/Loom embed slot).
8. **Competitive Positioning Matrix** — 2D scatter (X: System Intelligence, Y: Business Surface Coverage) with plotted competitors + Global Office highlighted. SVG.
9. **Early Market Validation** — cards for design partners, pilots, waitlist, LOIs, demos completed, newsletter, community. Gracefully render 0.
10. **Roadmap Timeline** — premium horizontal timeline: Discovery → MVP → Design Partners → Commercial Launch → PMF → Regional Expansion → Enterprise → Global Scale.
11. **Founder Credibility expansion** — expand existing block with placeholder stats slots (no fabricated numbers).
12. **Confidence Cards** — TAM, launch geos, ICP, business model, AI architecture, round size, runway, expansion.
13. **New Closing Statement** — the "systems that understand organizations" close.

Keep the existing downloads table intact.

### B3. Design language
- Typography scale bump on hero (existing Space Grotesk display).
- More whitespace, glass panels, subtle gradient dividers.
- Motion: restrained — fade/rise on scroll, gentle pulse on intelligence layer, flywheel rotation on view.
- Mobile: single-column stacks, sticky section nav, larger tap targets.
- No new heavy deps; reuse `framer-motion`, `lucide-react`, existing tokens.

### B4. SEO
Update `<title>`, meta description, og tags on `Investors.tsx` via `document.title` effect (existing pattern) to reflect new positioning.

---

## Technical Details

**New files:**
- `supabase/migrations/<ts>_platform_admins_and_stats.sql` — table, grants, RLS, `is_platform_admin`, `get_platform_stats` RPC.
- `src/pages/SuperAdmin.tsx`
- `src/hooks/usePlatformAdmin.ts`
- `src/components/admin/UsageTab.tsx`, `HealthTab.tsx`, `AuditTab.tsx` (shared org + super).
- `src/components/investors/IntelligenceStack.tsx` (animated architecture)
- `src/components/investors/MoatFlywheel.tsx`
- `src/components/investors/PositioningMatrix.tsx`
- `src/components/investors/RoadmapTimeline.tsx`
- `src/components/investors/InvestorBrief.tsx`
- `src/components/investors/IncumbentGrid.tsx`
- `src/components/investors/ProductProof.tsx`
- `src/components/investors/ValidationCards.tsx`

**Edits:**
- `src/App.tsx` — add `/super-admin` route.
- `src/pages/AdminDashboard.tsx` — add Usage/Health/Audit tabs.
- `src/components/layout/AppSidebar.tsx` — conditional Super Admin link.
- `src/pages/Investors.tsx` — insert new sections; reframe copy.
- `index.html` — meta updates if needed.

**RLS/Grants:** all new tables/functions get GRANT + policies per project rules. `platform_admins` seeded manually via SQL by user; no self-signup.

**Deps:** none added.

## Delivery
Ship both workstreams in this pass. Verify build; no runtime seed of platform admins (user adds their user_id via SQL later — I'll surface the exact SQL snippet in the reply).
