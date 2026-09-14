# Architecture

## System overview

Intelligent Office is a Vite-served React single-page application backed by Supabase. The browser owns presentation, routing, optimistic UI state, and user interaction. Supabase provides authentication, Postgres data access, storage, and Edge Functions. The main product workflow is a protected dashboard that reads organization-scoped activity and task data, then sends an intentionally compact operational context to an AI Edge Function for structured insight generation.

```text
User
  │
  ▼
React + TypeScript SPA (Vite)
  │  React Router / TanStack Query / typed Supabase client
  ├──────────────► Supabase Auth (session + protected routes)
  │
  ├──────────────► Supabase Postgres + RLS
  │                 profiles, organizations, tasks, KPIs,
  │                 attendance, channels, messages, ai_insights
  │
  ├──────────────► Supabase Storage (documents and meeting files)
  │
  └──────────────► Supabase Edge Functions
                    │
                    ├─ AI insights context + JSON response
                    ├─ workflow, meeting, and transcription helpers
                    └─ server-side secrets / external providers
```

## Frontend

The frontend is composed of route-level pages, a shared `AppLayout`, reusable dashboard cards, Radix/shadcn UI primitives, and feature components. `AuthProvider` listens to Supabase auth state changes. `ProtectedRoute` prevents unauthenticated access to workspace surfaces, while public routes expose the landing page, feature overview, sign-in, and sign-up flows.

The dashboard is the primary showcase surface. It loads organization-scoped counts in parallel, computes a transparent health score from completion, KPI, and attendance rates, and presents modules for execution, communication, meetings, documents, workflows, team administration, and AI insights. Loading states and empty states are rendered rather than hidden behind a blank screen.

## Backend and database

There is no separate Node API server. Browser CRUD uses the generated Supabase client and PostgREST. Supabase migrations define the relational schema, indexes, policies, triggers, and storage configuration. Organization IDs are carried through queries and enforced by database policies in the deployed Supabase project.

The most important data entities for the showcase are organizations, profiles, tasks, KPIs, attendance records, channels, messages, activity logs, and AI insights. Optional tables support meetings, documents, workflows, and notification delivery.

## Authentication and authorization

Supabase Auth manages email/password and recovery flows. The client persists sessions in browser local storage. `AuthProvider` exposes the current user and session, and protected routes redirect unauthenticated users to sign-in. Application hooks resolve organization membership and role information; database Row Level Security is the required enforcement boundary for tenant isolation.

## AI integration

The AI workflow is deliberately server-side. `AIInsightsModule` gathers aggregate task, attendance, KPI, and staffing context, then invokes the `ai-insights-generate` Edge Function. The function calls a configured server-side AI gateway, requests a JSON array with title, content, severity, and insight type fields, parses the response, and returns it to the browser. If the function is unavailable, the page uses deterministic local heuristics so the workflow remains demonstrable without pretending that a model responded.

AI output is advisory. The application stores generated insights for review, filtering, acknowledgement, and resolution; it does not auto-execute business actions.

## External services

Supabase is required for authenticated and persistent behavior. The AI gateway is optional and configured only through Edge Function secrets. LiveKit, email delivery, and transcription providers are optional integrations used by supporting meeting and notification functions, not by the public landing page.

## Important design decisions

1. **Keep the core workflow inspectable.** A recruiter can follow the path from a dashboard metric to the AI Insights Center without understanding commercial product concepts.
2. **Use the database as the authorization boundary.** Client-side route protection improves UX, but RLS is responsible for tenant isolation.
3. **Prefer structured AI output.** The Edge Function requests a small, parseable schema rather than rendering unbounded model text.
4. **Provide a safe fallback.** Local analysis keeps the demo useful when a model secret is absent and makes failure behavior explicit.
5. **Keep optional integrations at the edges.** Meeting and media providers are not required to understand or run the dashboard workflow.

## Security considerations

No service-role keys, AI keys, or production credentials belong in the repository. Browser variables contain only the Supabase URL and publishable key. Server-only secrets must be configured in Supabase. RLS policies should be tested whenever schema changes are made. AI prompts must contain aggregate workplace context rather than secrets or unnecessary personal data.

## Scalability considerations

Parallel aggregate queries reduce dashboard latency for the current showcase scale. In a larger deployment, dashboard metrics should move to database views or materialized aggregates, AI context should be queued, and insight generation should be rate-limited and audited. Realtime subscriptions, pagination, and background jobs should be added deliberately rather than assumed from the current client implementation.
