# Enterprise Cognition Platform — Foundation Wave

This brief reframes Global Office from a workplace suite to an **Enterprise Cognition Platform**. That's an architectural shift, not a feature. Ship it in waves so each layer is real, grounded in the org's existing Intelligence Graph, and reflected across the product + investor narrative — not a demo shell.

## Wave 1 (this turn) — Cognition foundation + narrative

Goal: land the architectural spine, one visible surface per pillar (Executives, Consultants, Departments, Deliberation), and update the outward-facing story so investors and customers see the repositioning immediately.

### 1. Data model — Enterprise Cognition schema
New tables (org-scoped, RLS + GRANTs, tied into `graph_entities`):
- `ai_executives` — configurable C-suite personas (role, mandate, tone, KPIs, active flag).
- `ai_consultants` — domain experts (domain, expertise, playbooks, linked exec).
- `ai_departments` — org-owned AI departments (name, consultant_id, charter, staffing JSON).
- `cognition_requests` — every request routed through the deliberation lifecycle (intent, context, status).
- `cognition_steps` — per-stage log (intent → context → deliberation → consult → plan → assign → execute → validate → review → deliver → learn) with actor (exec/consultant/dept), reasoning, output, latency.
- `organizational_memory` — persistent decisions, lessons, precedents (text + tags + source refs).

Seed each org (extend `complete_onboarding` + one-time backfill) with default executives (CEO/COO/CFO/CTO/CHRO/CMO/CLO/CRO/CSO/CDO/CIO), 10 consultant domains, and empty departments so the surface is populated day one.

### 2. Edge function — `cognition-deliberate`
Single server-side lifecycle runner:
- Input: `{ request, requested_by, target_department? }`.
- Loads org context (mission, values, KPIs, recent decisions, memory).
- Runs a multi-role deliberation with `openai/gpt-5.6-sol` (single structured-JSON call) emitting: intent, exec deliberation (which C-suite weighed in + positions), consultant recommendation, execution plan (steps + assignees), risk/compliance/finance notes, success criteria, follow-ups.
- Persists to `cognition_requests` + `cognition_steps`, writes decisions to `organizational_memory`, emits `graph_events`.
- Returns the structured trace so the UI can render reasoning transparently.

### 3. UI — Cognition Center (`/cognition`)
New route, sidebar entry "Cognition" (Brain icon). Four tabs:
- **Executive Team** — grid of AI executives with mandate, active toggle, edit dialog.
- **Consultants** — domain cards with linked exec + playbook editor.
- **Departments** — department cards with staffing summary + charter.
- **Deliberations** — request composer + live trace of every stage. This is the marquee interaction that makes the repositioning concrete.

All views read/write real Supabase data — no mocks.

### 4. Dashboard integration
Add a "Cognition Pulse" card to the main dashboard: latest deliberation, active executives, memory entries this week. One-click into `/cognition`.

### 5. Investor + landing narrative refresh
- `Investors.tsx`: insert a hero-adjacent section positioning Global Office as the **Enterprise Cognition Platform**, add the deliberation lifecycle diagram, and add a new "AI Executives / Consultants / Departments" moat section.
- `HeroSection.tsx` + `FeaturesShowcase.tsx`: swap "digital workplace / OI layer" phrasing for "Enterprise Cognition Platform — build, train, and govern AI executives, consultants, and departments on your own organizational knowledge."
- Update `index.html` meta description accordingly.

### 6. Memory integration
Every completed deliberation writes a summarized decision to `organizational_memory` + a `graph_events` entry so the existing Intelligence Graph and Executive Copilot immediately benefit — cognition is not a silo.

## Waves 2+ (later turns, not this turn)
- Wave 2: AI Workforce execution — specialist workers per department, handoff into `tasks`, validation loop, feedback capture.
- Wave 3: Continuous learning — nightly job that mines completed work, memos, meetings, KPIs into `organizational_memory` embeddings; retrieval helper for every module.
- Wave 4: Governance & Explainability surface — per-decision audit trail, exec preference tuning, policy guardrails editor, risk/compliance scorecard.
- Wave 5: Module rewiring — Execution, HR, Finance, Marketing, Meetings route significant actions through `cognition-deliberate` so the whole platform inherits the shared cognition layer.
- Wave 6: Marketplace of prebuilt executive/consultant/department templates by industry.

## Technical notes
- All new tables: `GRANT` block + RLS scoped to `organization_id` via `get_user_org_id(auth.uid())`.
- All AI calls: `openai/gpt-5.6-sol`, `reasoning_effort: "none"`, no `max_tokens`/`temperature`, structured output via prompt + parse (schema too dynamic for `Output.object`).
- Edge function verifies caller org; uses service role only for graph/memory writes.
- No mock data anywhere — deliberations run live or surface the gateway error.

## Scope guardrails for this turn
Ship Wave 1 end-to-end and stop. Waves 2–6 need iteration and user feedback on the deliberation UX before wiring the rest of the platform through it.
