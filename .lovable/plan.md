
# Wave 6 — Alerts, Trust & Compliance Surface

There is no prior Wave 6. The eight requests naturally form it. Below is what already exists, what's missing, and what will ship.

## Audit summary

| # | Request | Status |
|---|---|---|
| 1 | Wave 4 audit / routing | Mostly correct; two gaps to fix (below) |
| 2 | AI Alerts inbox | `AIInsightsModule` exists as a list but has no filters, no "resolved" state, no drill-in "why" panel |
| 3 | Per-user notification prefs (in-app / email / Slack) | Missing entirely |
| 4 | Escalation policy for repeated alerts | Missing |
| 5 | Trust Center public page | Missing |
| 6 | Inter-org audit log viewer | `activity_logs` exists but nothing writes inter-org events and no viewer |
| 7 | Consent revocation propagation | Works for KPIs & insights via RLS; **documents are not covered** |
| 8 | Compliance report export (PDF/CSV) | Missing |

## Wave 4 gaps found

- **Ownership routing**: slipping-task alerts notify `assigned_to` only. If unassigned, no one is told. Fix: also notify project owner and the task creator, and fall back to org owners when both are absent.
- **Workflow stall routing**: notifies `started_by` only. If they've left the org (profile null) no one gets it. Fix: fall back to workflow creator, then org owners.
- **Missing case — approvals aging**: workflow instances awaiting approval > timeout_hours are not detected. Add a fourth scanner.
- **Missing case — KPI drift**: KPI with `current_value / target_value < 0.5` past mid-period generates no alert. Add fifth scanner.

## What ships

### Database
- `ai_insights`: add `status` (`open` | `acknowledged` | `resolved`), `resolved_at`, `resolved_by`, `escalation_level` (0–3), `last_escalated_at`, `reason` (jsonb — the raw evidence: task_id, cluster count, workflow logs, etc.).
- `notification_preferences` (per user): `in_app`, `email`, `slack`, `escalation_after_hours`, `escalate_to_manager` (bool). Grants + RLS scoped to `auth.uid()`.
- `inter_org_audit_log`: append-only table capturing `event_type` (`consent_granted`, `consent_revoked`, `memo_sealed`, `memo_verified`, `document_shared`, `document_unshared`), `owner_org_id`, `partner_org_id`, `actor_id`, `resource_id`, `metadata`. RLS: either party of the event can read.
- Triggers on `org_share_consents` and `signature_ledger` to write into the audit log automatically.
- `document_shares` table (owner org grants a specific document to a partner org). RLS + `has_document_share()` helper. Revoking = update status; RLS immediately blocks access.
- Extend `documents` SELECT policy with `has_document_share()`.
- `escalate_alerts()` SECURITY DEFINER function + hourly cron: finds `open` alerts older than the user's `escalation_after_hours` and creates a manager notification, bumping `escalation_level`.

### Edge functions
- Extend `predictive-alerts` with the 4 new fixes/cases and richer `reason` payload.
- New `compliance-report`: server-side generator returning JSON blob covering retention schedule, sharing history, ledger integrity chain check, alert stats. Frontend converts to CSV; PDF built client-side with jsPDF.
- New `notify-user`: fan-out helper called by the alerts function — reads `notification_preferences`, always writes in-app, best-effort email (via existing infra) and Slack webhook (from prefs).

### Frontend
- `AIInsightsModule` upgraded to a full **Alerts Inbox**: severity/status/type filters, resolve / snooze / acknowledge actions, and a right-side drawer showing the "why" (evidence rows, links to the task/workflow/KPI, timeline of escalations).
- New `NotificationPreferences.tsx` on the profile/settings page.
- New public `/trust` page (`TrustCenter.tsx`): premium, investor-tone sections on cryptographic memo sealing, RLS isolation (live probe count), retention, compliance evidence, sub-processors. Follows shared-responsibility copy guidance.
- New `InterOrgAuditLog.tsx` tab in the InterOrg module and Security module: filterable timeline of consent/memo/document events.
- Consent revocation surfaces gain a "propagates immediately" note and now include documents.
- `ComplianceReport.tsx` (Security module): button generates PDF + CSV via the new function and offers download.

### Routing / navigation
- `/trust` added to `App.tsx` (public) and to landing footer.
- Alerts inbox drawer reachable from Dashboard alert widget click.

## Technical notes

- All new tables: `CREATE TABLE` → `GRANT` → `ENABLE RLS` → policies in the same migration.
- Escalation cron: hourly, service-role, org-agnostic scan.
- Trust Center must not claim certifications we don't have — copy uses "app-owner maintained" qualifier and describes enabled controls only.
- Compliance report generation uses Lovable AI only for narrative summary; hard numbers come from SQL. PDF is generated client-side to avoid server memory pressure.
- Ledger integrity check re-hashes every entry in order and reports first break, if any.

## Order of execution

1. Migration (schema + triggers + escalation cron + document_shares).
2. Edge functions (`predictive-alerts` extension, `compliance-report`, `notify-user`).
3. Frontend surfaces: alerts inbox, notification prefs, trust center, audit log, doc share dialog, compliance report.
4. Wire nav, footer link, dashboard widget click-through.
5. Verify with a manual `predictive-alerts` run and a smoke SQL check on `inter_org_audit_log`.

Approve to proceed and I'll ship it end-to-end.
