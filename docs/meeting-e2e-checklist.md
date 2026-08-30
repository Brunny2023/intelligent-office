# Meeting End-to-End Verification Checklist

This checklist is intentionally manual because it requires browser permissions, two participants, and a deployed LiveKit/Supabase environment. Run it against a preview or staging deployment before production promotion.

## Regular meetings

1. Sign in as User A, open **Meetings**, create a new room, and click **Join Room**.
2. Confirm the connecting state resolves into the room and remains connected for at least 60 seconds.
3. Confirm the LiveKit control bar is visible and that camera, microphone, and screen-share toggles can be enabled and disabled.
4. Open the generated invite in a second browser session as User B and confirm both participants remain connected for at least 60 seconds.
5. From User A, use the LiveKit hang-up control and confirm the user leaves without seeing the **Connection interrupted** rejoin overlay.
6. Rejoin the same active room and confirm the second participant is not evicted.
7. Simulate a temporary network interruption for one participant. Confirm the interrupted participant sees the rejoin screen and the other participant remains in the room.
8. Enable recording, speak in both browser sessions, stop recording, and confirm the resulting recording is uploaded and produces a post-meeting transcript and analysis.

## Founder and Investor rooms

1. Repeat steps 1–7 using the Founder room and an Investor access link.
2. Confirm the Founder copilot can display a grounded answer with a source citation and follow-up questions.
3. Record the copilot response latency shown in the response and compare it with the server logs containing `founder_copilot_request` events.
4. Confirm the Investor session cannot access founder-only copilot functionality.

## Alert escalation deployment check

Run `supabase/verification/alert_escalation.sql` using a privileged connection after migrations are applied. The script is read-only and fails if the hourly job is missing, has the wrong command, or `postgres` lacks `EXECUTE` on `public.escalate_alerts()`.
