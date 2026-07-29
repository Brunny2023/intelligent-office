# Executive Intelligence Meeting Room (Founder Mode)

A premium browser-based meeting room launched from the Investor page. Investors see a clean video call with the founder. Only the founder sees a private, real-time Executive Intelligence Copilot — a HUD-style side panel that listens, retrieves grounded answers from company knowledge, and suggests spoken responses.

Built as a reusable **Executive Intelligence Layer**; Investor Mode is the first implementation.

## Scope for this build

Ship a working v1 of the full end-to-end experience:

1. **Investor entry flow** on `/investors`: View Deck → Download → Watch Demo → Book Meeting → Join Meeting.
2. **Meeting Room** at `/exec-room/:roomName?mode=investor|founder`, LiveKit-powered.
3. **Founder-only Copilot Panel** — HUD design, hidden from investors, gated by `is_platform_admin` or explicit host role.
4. **Live captions** via browser SpeechRecognition (fallback: manual query box).
5. **Copilot backend** — new edge function `exec-intel-copilot` returning grounded answers in the Instant / Clarify / Expand response contract, plus a predictive follow-ups list.
6. **Knowledge sources** — Investor Pack files (`public/investor-pack/*`), Documents table, KPIs, Financial Model highlights. Uses existing `intelligence-query` graph facts + new investor pack retrieval.
7. **Meeting Intelligence** — auto transcript + post-meeting summary reused from existing `meeting-analyze` pipeline; new investor-specific fields (questions, objections, next steps).
8. **Investor Analytics** — deck views, downloads, demo watched, meeting attendance saved to `activity_logs` with a new `investor_analytics` view for the founder.

Out of scope for v1 (leave hooks): CRM sync, board mode, media mode, founder-voice cloning, persistent per-founder style memory (v1 uses a simple style profile row).

## User flows

**Investor**
1. Lands on `/investors` → clicks *Book Meeting* → picks slot (simple form, emails founder) → gets `/exec-room/:roomName?mode=investor&t=<token>`.
2. Joins room: HD video, screen share, chat, deck viewer, file downloads. No AI UI anywhere.

**Founder**
1. Notified in `/dashboard` and via email of scheduled meeting.
2. Opens `/exec-room/:roomName?mode=founder` — must be signed in AND platform admin.
3. Sees standard meeting UI + right-side **Executive Intelligence Panel** (collapsible, private overlay only in founder DOM).
4. Live captions stream investor speech → copilot pre-fetches likely answers → HUD shows: **big answer • tiny source • Expand**.
5. Ambiguous question → single clarification prompt only.
6. Click source → private slide/document opens in founder's side drawer, investor unaffected.
7. Post-meeting: auto summary with investor questions, objections, next steps, action items.

## Copilot response contract

Edge function returns strictly one of:
```
{ mode: "answer", headline: string, source: { label, ref }, expand?: {...} }
{ mode: "clarify", question: string }
{ mode: "manual", hint: string }         // low confidence → founder answers manually
```
Plus `followUps: string[]` (max 6) precomputed for the next likely questions.

Model: `openai/gpt-5.6-sol`, `reasoning_effort: "none"`, strict system prompt enforcing the three-second-rule format and forbidding paragraphs/chain-of-thought.

## Technical details

**Frontend**
- `src/pages/ExecMeetingRoom.tsx` — new route `/exec-room/:roomName`. Uses existing `MeetingRoomView` for video. Adds `<FounderCopilotPanel />` only when `mode=founder` and viewer passes `usePlatformAdmin` (or is meeting host).
- `src/components/execintel/FounderCopilotPanel.tsx` — HUD layout: caption strip (top), answer card (center), follow-ups rail (bottom), manual ask input.
- `src/components/execintel/AnswerCard.tsx` — Instant / Clarify / Manual variants, source chip, Expand drawer.
- `src/components/execintel/LiveCaptions.tsx` — `webkitSpeechRecognition` wrapper, sentence boundary detection, pushes utterances to copilot.
- `src/components/investors/BookMeetingDialog.tsx` — name/email/date; creates row in new `investor_meetings` table and returns join link.
- `src/pages/Investors.tsx` — wire *Book Meeting* & *Join Meeting* buttons; add lightweight analytics beacons (deck view, download click, demo watched).

**Backend**
- Migration: `investor_meetings` (id, room_name, investor_name, investor_email, scheduled_at, host_user_id, status, created_at) + RLS (platform admins full, investor row visible by token). `investor_analytics` (event_type, meeting_id nullable, metadata, occurred_at). GRANTs + service_role.
- Edge function `exec-intel-copilot`: input `{ utterance, meetingId, history }`; retrieves from Documents, KPIs, investor-pack markdown (loaded from `public/investor-pack/` via fetch at cold start & cached), calls model with strict schema, returns structured response + follow-ups.
- Reuse `meeting-analyze` for post-meeting summary; extend prompt to extract investor-specific fields.

**Performance**
- Copilot uses streaming + server-side prefetch on partial captions (debounced 400ms).
- Aggressive client cache of retrieved chunks by keyword.

## Files to create

```
src/pages/ExecMeetingRoom.tsx
src/components/execintel/FounderCopilotPanel.tsx
src/components/execintel/AnswerCard.tsx
src/components/execintel/LiveCaptions.tsx
src/components/execintel/ExpandDrawer.tsx
src/components/execintel/FollowUpsRail.tsx
src/components/investors/BookMeetingDialog.tsx
src/hooks/useInvestorAnalytics.ts
supabase/functions/exec-intel-copilot/index.ts
```

Files to edit: `src/App.tsx` (route), `src/pages/Investors.tsx` (buttons + analytics), `supabase/functions/meeting-analyze/index.ts` (investor fields).

## Open decisions

1. **Founder authorization for founder-mode**: platform admin only, or also organization `owner` role? Default: platform admin OR org owner.
2. **Scheduling**: v1 = simple form + email notification (no calendar sync). OK?
3. **Live captions**: browser SpeechRecognition (Chrome/Edge) with a "captions unavailable" fallback + manual ask box. Add Whisper streaming later. OK?

I'll assume the defaults above unless you say otherwise; reply with any changes and I'll build.
