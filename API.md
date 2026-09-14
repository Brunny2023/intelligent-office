# API reference

The application does not expose a custom Node/Express server. The browser uses the Supabase client for authenticated PostgREST queries. The custom application endpoint most relevant to the showcase is the AI insights Edge Function.

## `POST /functions/v1/ai-insights-generate`

Generates structured workplace insights from an organization context.

| Field | Value |
|---|---|
| Authentication | Supabase session/JWT should be required by the deployed function; the calling page invokes it after authentication. |
| Request body | `{ "context": string, "orgId": string }` |
| `context` | Compact, aggregate operational summary assembled by `AIInsightsModule`. |
| `orgId` | Organization UUID used by the caller when persisting returned insights. |
| Response | `{ "insights": [{ "title": string, "content": string, "severity": "info" | "warning" | "critical" | "success", "insight_type": string }] }` |
| Errors | `400` for malformed input where validation is added; `500` when the gateway secret is absent, the model response cannot be parsed, or an upstream request fails. |

The function uses the server-side `AI_GATEWAY_API_KEY` secret. That secret must not be placed in a browser `VITE_*` variable. The page falls back to deterministic local analysis when the function returns an error or no structured insights.

## Supabase data API

The frontend uses the generated client against the configured Supabase project. Representative operations include:

| Operation | Tables | Purpose |
|---|---|---|
| `SELECT` with organization filter | `profiles`, `tasks`, `kpis`, `attendance_records`, `channels`, `messages` | Populate dashboard metrics and AI context. |
| `INSERT` | `ai_insights` | Persist generated insights for review. |
| `UPDATE` | `ai_insights` | Mark insights read, acknowledged, resolved, or dismissed. |
| Auth methods | Supabase Auth | Sign up, sign in, password recovery, session refresh, and sign out. |

PostgREST responses use the standard Supabase `{ data, error, count }` shape. The client checks errors at mutation boundaries and displays user-facing toast feedback where appropriate.

## Supporting Edge Functions

The repository includes optional functions for `predictive-alerts`, `workflow-run`, meeting analysis/token issuance, transcription, email queue processing, and document/file sharing. They are not required for the public landing page or the core dashboard walkthrough. Each function should be deployed only after its provider secrets, authorization checks, and corresponding migrations have been configured.
