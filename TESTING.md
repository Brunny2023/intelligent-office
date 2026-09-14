# Testing

## Strategy

The repository uses Vitest with a JSDOM environment and Testing Library setup. Tests focus on pure utilities, feature-level business rules, and selected UI behavior rather than manufacturing coverage around every presentational component.

## Existing coverage

- Tenant hostname parsing and safe fallback behavior in `src/lib/tenant.test.ts`.
- Meeting room policy and participant rules in `src/components/meetings/meetingRoomPolicy.test.ts`.
- Supabase LiveKit egress webhook behavior in `supabase/functions/livekit-egress-webhook/index.test.ts`.
- Shared test setup and a small component smoke test under `src/test/` and landing components.

## Critical workflow

The most important manual workflow is:

1. Create or sign in to a user.
2. Complete organization onboarding.
3. Open the protected dashboard.
4. Confirm organization-scoped metrics render with loading/empty states.
5. Open AI Intelligence.
6. Generate insights, observe the AI Edge Function request or local fallback, and confirm insights appear in the inbox.
7. Filter, search, mark an insight read, and change its status.

A configured Supabase project is required for this end-to-end path. The public landing page and static build do not require a live project.

## Commands

```bash
npm test        # Run Vitest once
npm run lint    # Run ESLint
npm run build   # Type-check through the Vite production build and bundle assets
```

## Error and validation checks

Tests should be extended when changing organization scoping, status transitions, AI response parsing, or Edge Function authorization. The AI workflow must be tested both with a valid structured response and with a missing/invalid response to preserve the deterministic fallback. Database policy changes should be validated against users in different organizations in a disposable Supabase project.

## Known gap

Browser-level automation is not currently committed. Playwright coverage for the authenticated task-to-insight workflow is a planned improvement, not a claim about the current test suite.
