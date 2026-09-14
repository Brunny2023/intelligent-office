# Intelligent Office

**Intelligent Office is a full-stack AI workplace application that transforms operational workplace data into actionable insights through a typed React/Supabase architecture and a server-side AI workflow.**

**Live Demo:** [globaloffice.cloud/demo](https://globaloffice.cloud/demo)
The hosted demonstration runs in an existing demo environment; this repository is the independently scoped Intelligent Office codebase and is not presented as the commercial Global Office product.

## Why this project

Workplace data is useful only when teams can turn it into coordinated action. Intelligent Office brings together a responsive workplace dashboard, work execution, collaboration signals, operational metrics, and a human-reviewed AI insight inbox. The central flow is:

```text
Workplace data → context aggregation → AI analysis → structured insight → human review/action
```

The implementation demonstrates practical full-stack and AI application engineering: organization-scoped data access, authenticated routes, reusable UI, explicit loading/error states, server-side secret handling, structured model output, and a deterministic fallback when the AI service is unavailable.

## Key capabilities

- **Workplace command center:** organization-scoped task, attendance, KPI, message, and team-activity signals with responsive dashboard metrics.
- **Execution and collaboration:** task/workflow surfaces, team activity, messaging, meetings, documents, and team administration.
- **AI Insights:** aggregate operational context, request structured insight objects through a Supabase Edge Function, persist results, and present them in an actionable inbox.
- **Human review loop:** search and filter insights by status/severity, mark them read, and acknowledge, resolve, or dismiss them.
- **Secure application boundary:** Supabase Auth, protected routes, organization-aware queries, Row Level Security migrations, and server-only AI configuration.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router, TanStack Query |
| UI | Tailwind CSS, Radix/shadcn components, Framer Motion, Recharts |
| Backend/data | Supabase Auth, PostgreSQL, PostgREST, Storage, Edge Functions |
| AI | Server-side OpenAI-compatible chat-completions gateway with structured JSON parsing and local fallback |
| Quality | ESLint, Vitest, Testing Library, production Vite build |

## Screenshots

The hosted demo is the best way to see the workflow in motion. The repository also includes representative captures:

| View | Preview |
|---|---|
| Hosted demo dashboard | [Open image](screenshots/live-demo-dashboard.webp) |
| Hosted demo AI Insights | [Open image](screenshots/live-demo-ai-insights.webp) |
| Responsive landing page | [Open image](screenshots/landing-mobile.png) |

## AI workflow

1. `AIInsightsModule` aggregates task, attendance, KPI, and staffing context for the active organization.
2. The browser invokes `ai-insights-generate` only after authentication; the function is the server-side boundary for provider credentials.
3. The Edge Function requests a JSON array containing `title`, `content`, `severity`, and `insight_type` fields.
4. The response is parsed and validated before the UI persists insights to `ai_insights`.
5. The insight inbox supports human filtering, review, status changes, and follow-up action.
6. If the function or model response fails, deterministic local heuristics keep the workflow usable and make degraded behavior explicit.

The server-side boundary prevents AI credentials from reaching the browser. AI output is advisory and human-reviewed; it does not autonomously execute workplace actions.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the system diagram, data flow, security boundary, and design decisions. See [API.md](API.md) for the actual Supabase Edge Function and data-access surface.

## Getting started

The canonical package manager is **npm**.

```bash
npm ci
cp .env.example .env
# Fill in the Supabase browser-safe variables.
npm run dev
```

Open `http://localhost:8080`. The public landing page renders without Supabase configuration. Authenticated workspace flows require a configured Supabase project and the included migrations.

## Environment variables

Copy `.env.example` to `.env`. Only the Supabase URL, project ID, and publishable browser key belong in `VITE_*` variables. Configure `AI_GATEWAY_URL` and `AI_GATEWAY_API_KEY` as Supabase Edge Function secrets; never commit server secrets.

## Commands

```bash
npm ci
npm run dev       # Vite development server
npm run lint      # ESLint
npm test          # Vitest once
npm run build     # Production build
npm run preview   # Preview the production build
```

## Testing and deployment

See [TESTING.md](TESTING.md) for the verified test strategy and manual workflow. See [DEPLOYMENT.md](DEPLOYMENT.md) for local setup, Supabase configuration, static hosting, server-side secrets, and the distinction between this repository and the [hosted demo](https://globaloffice.cloud/demo).

## Project structure

```text
src/                    React routes, components, hooks, and Supabase client
supabase/functions/     Edge Functions, including ai-insights-generate
supabase/migrations/    PostgreSQL schema, RLS, and storage migrations
tests and *.test.ts     Vitest and feature-level tests
screenshots/            Recruiter-facing local and hosted-demo captures
```

## Limitations and provenance

This repository does not claim production scale, commercial customers, billing, enterprise compliance certification, or a hosted deployment of its own. Optional meeting/media integrations require their own services and secrets. Browser-level Playwright coverage and seeded one-command local Supabase setup remain future improvements.

Intelligent Office is an independently scoped engineering project derived from concepts explored in a broader workplace software project. Proprietary business logic, confidential data, credentials, private infrastructure, and commercial-only functionality have been excluded.
