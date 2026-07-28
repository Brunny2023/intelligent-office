
# Closing the Investor-Page Gaps: Full Delivery Plan

Goal: make the product deliver every promise the `/investors` page makes. Ship in credibility-weighted order — the claims that most define "Organizational Intelligence Layer" go first, cosmetic ones last.

Plan is organized in 5 waves. Each wave ends with the product provably matching a specific set of investor-page claims. After each wave you can re-audit before we advance.

---

## Wave 1 — The Intelligence Core (the promise that defines the category)

The investor page claims a **Knowledge Graph**, **Organizational Intelligence Layer**, and **AI that reasons over org data**. Today that layer doesn't exist — insights are one-shot LLM calls over ad-hoc SQL. This wave builds the real substrate.

1. **Knowledge Graph schema (v1)**
   - New tables: `graph_entities` (people, projects, tasks, docs, meetings, customers, kpis), `graph_edges` (typed relationships: owns, blocks, mentions, participates_in, reports_to, depends_on), `graph_events` (append-only signal stream).
   - Ingestion triggers on `tasks`, `messages`, `documents`, `meetings`, `profiles`, `kpis` → populate entities/edges automatically.
   - RLS scoped to `organization_id`; service_role writes from triggers.

2. **Signal pipeline**
   - Edge function `graph-ingest` that batch-normalizes historical rows on org backfill.
   - Nightly scheduled job `graph-recompute` (pg_cron) that recalculates derived metrics: workload per person, blocker chains, collaboration density, at-risk projects.

3. **Intelligence API**
   - Edge function `intelligence-query` that answers structured questions ("who is overloaded?", "which projects are at risk?", "what decisions are pending?") by querying the graph + LLM synthesis — not raw prompts over SQL dumps.
   - Replaces the current `ai-insights-generate` fallback path with graph-grounded reasoning.

4. **Graph Explorer UI**
   - New `/intelligence/graph` route: interactive node/edge view (react-flow), filter by entity type, click-through to source records.
   - Investor page's "Knowledge Graph" claim becomes demonstrable.

---

## Wave 2 — Automation That Actually Runs

Investor page promises **workflow automation, escalations, and AI-suggested workflows**. Today `workflows`, `workflow_instances`, `workflow_step_logs` exist as tables with no executor.

1. **Workflow executor**
   - Edge function `workflow-run` triggered by (a) DB triggers matching `trigger_type` (task.created, task.overdue, leave.requested, kpi.threshold), (b) pg_cron for time-based.
   - Steps supported: notify, assign, create_task, require_approval, escalate, call_webhook, ai_summarize.
   - Full audit into `workflow_step_logs`.

2. **Escalation engine**
   - Timeout watcher promotes stalled steps up the reporting chain using `profiles.department_id` + org roles.

3. **AI workflow suggester**
   - Uses graph signals ("3 tasks blocked >48h in Marketing") to propose workflow templates in the Workflows UI.

---

## Wave 3 — Meetings Intelligence (the biggest visible gap)

Investor page implies **AI transcription, summaries, action-item extraction, multilingual**. Today only LiveKit tokens exist.

1. **Recording capture** via LiveKit egress → Supabase `documents` bucket (new `recordings/` prefix, private).
2. **Transcription pipeline**: edge function `meeting-transcribe` posts audio to `openai/gpt-4o-transcribe` through the Lovable AI Gateway; stores transcript rows in new `meeting_transcripts`.
3. **Summarization + action items**: `meeting-analyze` calls chat model, writes `meeting_summaries` and auto-creates linked `tasks` with `assigned_to` inferred from speaker→profile mapping.
4. **Meetings UI**: post-meeting panel with transcript, summary, extracted actions, and a "push to tasks" confirm.
5. **Multilingual**: language auto-detect + optional translation pass for summaries.

---

## Wave 4 — Predictive & Advisory Intelligence

Investor page promises **predictive alerts, anomaly detection, executive advisor**. Today: rule-based fallbacks + one gemini call.

1. **Anomaly detectors** (SQL + light stats, not LLM):
   - Attendance deviation vs 30-day baseline per user.
   - Task velocity drop per project week-over-week.
   - Message volume collapse in a channel (disengagement signal).
   - Overdue-cluster detection per assignee/department.
   Persist as `ai_insights` rows with `insight_type = 'anomaly'` and evidence links.

2. **Executive Advisor**
   - New `/executive/advisor` panel — chat surface grounded in the graph via `intelligence-query`. Returns cited answers (links to underlying tasks/kpis/meetings). No free-floating hallucinations.

3. **Weekly digest**
   - pg_cron → `digest-generate` → emails execs (via existing transactional email path) with top 5 graph-derived insights.

---

## Wave 5 — Trust, Compliance & Category Proof

Closes the remaining "enterprise-ready" claims.

1. **Compliance surface**
   - Wire `compliance_settings` into real behaviors: IP allowlist enforced in `AuthContext` sign-in check; MFA-required flag gates protected routes; audit log export from `activity_logs`.
   - Data-retention job purges `activity_logs`, `messages`, `notifications` beyond `data_retention_days`.

2. **E-signature integrity**
   - Hash memo content + signature at signing time into a new `signature_ledger` (append-only, service_role write, everyone-read within org). Verifies the "cryptographically signed memos" claim.

3. **Partner Connect proof**
   - Add cross-org intelligence-sharing consent flow so `org_conversations` can share selected KPIs/insights — matches the "inter-org intelligence" line.

4. **Investor-page validation numbers**
   - Replace placeholder cards in `InvestorSections.tsx` with live counts pulled at build time from `get_platform_stats` (orgs, tasks, insights, meetings once Wave 3 lands). Keeps promises honest as usage grows.

---

## Sequencing & checkpoints

```text
Wave 1 → re-audit → Wave 2 → re-audit → Wave 3 → re-audit → Wave 4 → re-audit → Wave 5 → final audit
```

Each wave is independently shippable; nothing regresses existing modules. After every wave I'll re-run the investor-page-vs-product audit and report remaining gaps before starting the next.

## Technical notes

- All new tables follow the mandatory pattern: CREATE → GRANT (authenticated + service_role, no anon) → ENABLE RLS → POLICY scoped by `organization_id` via `get_user_org_id(auth.uid())`.
- All AI calls go through the Lovable AI Gateway using the shared provider helper; chat default `openai/gpt-5.6-sol`, transcription `openai/gpt-4o-transcribe`.
- Executor + cron jobs live in edge functions with `verify_jwt = false` where triggered internally, JWT-validated where user-initiated.
- Graph ingestion is idempotent (unique `(org, entity_type, source_id)`), safe to replay on backfill.
- No investor-page copy changes — product rises to meet the copy.

## First action after approval

Start Wave 1 step 1: submit the knowledge-graph migration (entities, edges, events, triggers, RLS, grants) for your review.
