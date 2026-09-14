# API reference

The application does not expose a custom Node/Express server. The browser uses the generated Supabase client for authenticated PostgREST queries. The principal custom endpoint is the AI Insights Edge Function.

## `POST /functions/v1/ai-insights-generate`

Generates structured workplace insights from an aggregate organization context.

| Field | Contract |
|---|---|
| Purpose | Convert task, attendance, KPI, and staffing context into reviewable insight records. |
| Authentication | Call from an authenticated Supabase session. The deployed function should enforce JWT verification; the client invokes it only from the protected AI Insights route. |
| Request body | `{ "context": string, "orgId": string }` |
| `context` | Required non-empty aggregate operational summary assembled by `AIInsightsModule`. |
| `orgId` | Required organization UUID used by the caller when persisting returned insights. |
| Success response | `{ "insights": [{ "title": string, "content": string, "severity": "info" | "warning" | "critical" | "success", "insight_type": "daily_summary" | "anomaly" | "performance" | "task_priority" }] }` |
| Errors | `400` for missing/invalid request fields; `502` for an unavailable or unsuccessful upstream provider; `500` for missing server configuration or malformed provider output. |

The function reads these **server-side Edge Function secrets**:

- `AI_GATEWAY_URL`: OpenAI-compatible chat-completions base URL.
- `AI_GATEWAY_API_KEY`: provider credential.

Neither secret belongs in a browser `VITE_*` variable. The client handles a function error by running deterministic local analysis and notifying the user that the fallback was used.

### Example request

```json
{
  "context": "Organization analytics for the past week:\n- Total tasks: 24\n- Completed: 16\n- Blocked: 2\n- KPIs: 3 total, 2 on target",
  "orgId": "00000000-0000-0000-0000-000000000000"
}
```

### Example response shape

```json
{
  "insights": [
    {
      "title": "Blocked work needs attention",
      "content": "Two active tasks are blocked. Review ownership and dependencies before the next planning cycle.",
      "severity": "warning",
      "insight_type": "task_priority"
    }
  ]
}
```

The Edge Function validates that returned insight objects contain non-empty strings and an allowed severity before returning them. The browser persists the validated records to `ai_insights` for human review.

## Supabase data API

The frontend uses the generated Supabase client against the configured project. Representative operations include:

| Operation | Tables/services | Purpose |
|---|---|---|
| `SELECT` with organization filter | `profiles`, `tasks`, `kpis`, `attendance_records`, `channels`, `messages` | Populate dashboard metrics and AI context. |
| `INSERT` | `ai_insights` | Persist generated insights for review. |
| `UPDATE` | `ai_insights` | Mark insights read, acknowledged, resolved, or dismissed. |
| Auth methods | Supabase Auth | Sign up, sign in, recovery, session refresh, and sign out. |
| Storage operations | Supabase Storage | Document and meeting-file upload/download flows. |

PostgREST responses use the standard Supabase `{ data, error, count }` shape. The client checks errors at mutation boundaries and provides user-facing feedback where appropriate. RLS policies are the required authorization boundary for organization-scoped records.

## Supporting Edge Functions

The repository also contains optional functions for `predictive-alerts`, `workflow-run`, meeting analysis/token issuance, transcription, and document/file sharing. They are not required for the public landing page or the core dashboard-to-insight walkthrough. Deploy them only after their provider secrets, authorization checks, and corresponding migrations are configured.
