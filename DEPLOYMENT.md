# Deployment

Intelligent Office can be deployed as a static Vite build with Supabase as the managed backend. This document describes a portfolio deployment, not a production readiness claim.

## Requirements

- Node.js 18+ and npm.
- A Supabase project for Auth, Postgres, Storage, and Edge Functions.
- A static host that can serve an SPA fallback to `index.html`.
- Optional: an AI gateway secret for generated insights, plus provider secrets for optional meeting/transcription/email functions.

## Build process

```bash
npm ci
npm run lint
npm test
npm run build
```

The generated `dist/` directory is the static deployment artifact. Configure the host to rewrite unknown routes to `index.html` so React Router can render client-side routes.

## Supabase setup

1. Create a project and copy its URL, publishable key, and project ID into the deployment environment.
2. Apply the migrations under `supabase/migrations/` using the Supabase CLI or migration pipeline.
3. Configure Auth redirect URLs for the deployed origin and password-recovery route.
4. Create/configure Storage buckets required by the document and meeting workflows.
5. Deploy only the Edge Functions needed for the chosen demo scope.
6. Add the server-side AI gateway key as an Edge Function secret named `AI_GATEWAY_API_KEY` (or adapt the function to the provider secret convention used by the deployment).

## Hosting assumptions

Set the following build-time variables in the static host:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Never add `SUPABASE_SERVICE_ROLE_KEY`, an AI provider key, or other server secret to a `VITE_*` variable or commit it to Git.

## Troubleshooting

- **Blank authenticated route:** confirm the host rewrites SPA routes to `index.html` and that the Supabase URL/key are present at build time.
- **Sign-in succeeds but dashboard is empty:** verify migrations, organization membership rows, RLS policies, and that the user completed onboarding.
- **AI generation falls back:** inspect the deployed Edge Function logs and confirm its server-side AI secret and upstream gateway URL; fallback behavior is expected when the secret is absent.
- **CORS or redirect errors:** add the exact deployed origin to Supabase Auth URL configuration and verify the function CORS policy.
- **Optional meeting failures:** configure LiveKit and related function secrets only if those surfaces are included in the deployed walkthrough.

## Portfolio limitations

No hosted production URL is claimed by this repository. Capacity planning, observability, automated migrations, rate limiting, and browser end-to-end coverage are intentionally left as future improvements.
