# Deployment

Intelligent Office can be deployed as a static Vite build with Supabase as the managed backend. The repository also has a hosted demonstration at [globaloffice.cloud/demo](https://globaloffice.cloud/demo). That URL is an existing demo environment for evaluating the workplace workflow; it is not claimed to be a deployment of this GitHub repository.

## Local development

Requirements:

- Node.js 18+ and npm.
- A Supabase project for Auth, Postgres, Storage, and Edge Functions when using authenticated workflows.
- A static host that can serve an SPA fallback to `index.html` for a deployed build.

```bash
npm ci
cp .env.example .env
# Fill in the browser-safe Supabase variables.
npm run dev
```

## Build process

```bash
npm ci
npm run lint
npm test -- --run
npm run build
```

The generated `dist/` directory is the static deployment artifact. Configure the host to rewrite unknown routes to `index.html` so React Router can render client-side routes.

## Supabase setup

1. Create a Supabase project and copy its URL, publishable key, and project ID into the deployment environment.
2. Apply the migrations under `supabase/migrations/` using the Supabase CLI or migration pipeline.
3. Configure Auth redirect URLs for the deployed origin and password-recovery route.
4. Create/configure Storage buckets required by document and meeting workflows.
5. Deploy only the Edge Functions required by the selected application scope.
6. Configure `AI_GATEWAY_URL` and `AI_GATEWAY_API_KEY` as server-side Edge Function secrets when enabling AI generation.

## Environment boundaries

Set these build-time variables in the static host:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Set these only as Supabase Edge Function secrets:

- `AI_GATEWAY_URL`
- `AI_GATEWAY_API_KEY`
- Any provider-specific service-role, LiveKit, transcription, or email credentials required by optional functions.

Never add `SUPABASE_SERVICE_ROLE_KEY`, an AI provider key, or other server secret to a `VITE_*` variable or commit it to Git.

## Troubleshooting

- **Blank authenticated route:** confirm the host rewrites SPA routes to `index.html` and that Supabase browser variables were present at build time.
- **Sign-in succeeds but dashboard is empty:** verify migrations, organization membership rows, RLS policies, and completed onboarding.
- **AI generation falls back:** inspect Edge Function logs and confirm both server-side AI secrets and the provider response shape; fallback behavior is expected when the provider is absent or unavailable.
- **CORS or redirect errors:** add the exact deployed origin to Supabase Auth configuration and verify the function CORS policy.
- **Optional meeting failures:** configure LiveKit and related function secrets only if those surfaces are included in the deployment.

## Limitations

No hosted production deployment of this repository is claimed. Capacity planning, observability, automated migration orchestration, rate limiting, and browser end-to-end coverage remain future improvements.
