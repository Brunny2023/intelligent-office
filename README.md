# Intelligent Office

Intelligent Office is an independently understandable portfolio implementation of an AI-assisted digital workplace. It turns a small set of workplace signals—tasks, attendance, KPIs, messages, and team activity—into a responsive command center for organizing work and coordinating action.

The project is intentionally scoped as a technical showcase rather than a commercial product. It demonstrates how a modern React frontend can combine authenticated Supabase data, reusable UI primitives, realtime-friendly collaboration patterns, and an AI workflow that summarizes operational context into actionable insights.

## Features

- Responsive workplace dashboard with loading states and data-backed health metrics.
- Authenticated onboarding, organization membership, roles, and protected routes.
- Task execution, team activity, messaging, meetings, documents, and workflow surfaces.
- AI Insights Center that gathers task, attendance, KPI, and staffing context before requesting structured insights from a Supabase Edge Function, with a deterministic local fallback.
- Insight inbox with search, severity/status filters, read state, and resolution workflow.
- Reusable shadcn/ui components, typed Supabase client, motion, charts, and mobile-aware layouts.

## Technical highlights

- **Frontend:** React 18, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, Radix/shadcn UI, Framer Motion, and Recharts.
- **Backend/data:** Supabase Postgres, Auth, Storage, Realtime-compatible queries, Row Level Security migrations, and Edge Functions.
- **AI integration:** `ai-insights-generate` receives a compact operational context, requests JSON-shaped insights from a server-side gateway, parses the response, and falls back to local analysis if the model is unavailable.
- **Quality:** ESLint, TypeScript build checks, Vitest tests, security-oriented environment handling, and documentation of intentional limitations.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the system diagram, data flow, AI boundary, and security decisions.

## Screenshots

The `screenshots/` directory contains presentation-ready views of the public landing page and showcase workflow. Screenshots use synthetic content only.

## Getting started

```bash
npm install
cp .env.example .env
# Fill in Supabase URL, publishable key, and project ID.
npm run dev
```

Open `http://localhost:8080`. Without Supabase configuration, the public landing page is still available; authenticated workflows require a configured project and the included migrations.

## Environment variables

Copy `.env.example` to `.env`. Only the Supabase URL and publishable/anonymous browser key belong in `VITE_*` variables. Service-role credentials and AI provider keys must be configured as Supabase Edge Function secrets and must never be committed.

## Running locally

```bash
npm run dev       # Vite development server
npm run lint      # ESLint
npm test          # Vitest once
npm run build     # Production build
npm run preview   # Serve the production build locally
```

## API and edge functions

The browser uses Supabase's typed data API for CRUD operations. The principal custom AI endpoint is documented in [API.md](API.md). The repository also contains focused meeting, workflow, transcription, and notification Edge Functions inherited as optional supporting surfaces; they require the corresponding Supabase secrets and services.

## Testing

See [TESTING.md](TESTING.md) for the testing strategy and commands.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for static hosting, Supabase migrations, environment configuration, and troubleshooting.

## Limitations

This is a portfolio implementation, not a production SaaS offering. The repository does not include production credentials, private datasets, billing, enterprise compliance claims, or a hosted demo environment. Some optional collaboration surfaces require LiveKit or additional Supabase Edge Function secrets. The AI feature is designed to show a real application boundary, not to claim model accuracy or production-scale performance.

## Future improvements

- Add Playwright coverage for the authenticated task-to-insight journey.
- Add seeded demo data and a one-command local Supabase setup.
- Replace the gateway-specific prompt adapter with a provider-neutral structured-output client.
- Add audit-log views and stronger per-organization policy tests.

## License and provenance

This repository is a separate job-hunting showcase derived from engineering concepts in an existing workplace application. It is not the proprietary commercial product from which the initial codebase originated.
