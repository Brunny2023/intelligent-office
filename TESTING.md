# Testing

## Strategy

The repository uses Vitest with a JSDOM environment and Testing Library setup. Tests focus on pure utilities, feature-level business rules, Edge Function behavior, and selected UI behavior rather than manufacturing coverage around every presentational component.

## Existing coverage

- Tenant hostname parsing and safe fallback behavior in `src/lib/tenant.test.ts`.
- Meeting room policy and participant rules in `src/components/meetings/meetingRoomPolicy.test.ts`.
- Supabase LiveKit egress webhook behavior in `supabase/functions/livekit-egress-webhook/index.test.ts`.
- Landing footer rendering and public navigation in `src/components/landing/Footer.test.tsx`.
- Shared test setup and a component smoke test under `src/test/`.

## Verified commands

The final refinement pass verified the npm scripts from a clean dependency installation:

```bash
npm ci
npm run lint
npm test -- --run
npm run build
```

`npm run lint` completes with zero errors; inherited modules still emit explicit-`any` and React hook dependency warnings. The Vitest suite passes all committed test files. The Vite production build completes successfully, with existing bundle-size and dynamic-import warnings documented by the build tool.

## Critical workflow

The most important application workflow is:

1. Open the [hosted demonstration](https://globaloffice.cloud/demo) or run the app locally.
2. Navigate from workplace dashboard context to AI Insights.
3. Inspect generated insight severity, source context, and recommended action.
4. Filter/search the insight inbox and perform a human action such as read, acknowledge, resolve, or dismiss.

The hosted demo was manually opened and verified to load its sample dashboard and AI Insights views. It demonstrates the product flow but is not claimed to be a deployment of this repository. A fully authenticated local end-to-end run requires a configured Supabase project, organization membership, migrations, and Edge Function secrets.

## Error and validation checks

The AI workflow should be tested with both a valid structured response and missing/invalid provider output. The Edge Function validates request fields and insight shape; the browser fallback preserves a usable workflow when the function fails. Database policy changes should be validated against users in different organizations in a disposable Supabase project.

## Known gap

Browser-level automation is not currently committed. Playwright coverage for the authenticated task-to-insight journey is a planned improvement, not a claim about the current test suite.
