// Deno tests for the Egress webhook handler.
// Verifies that a simulated LiveKit `egress_ended` payload correctly
// updates the recording with duration and audio artifact metadata,
// even when the originating client has disconnected.
//
// Run with: deno test --allow-env --allow-net supabase/functions/livekit-egress-webhook/index.test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleEgressPayload } from "./index.ts";

type Row = Record<string, unknown>;

function makeMockAdmin(seed: Row[]) {
  const state = {
    recordings: [...seed] as Row[],
    egress_events: [] as Row[],
    ai_insights: [] as Row[],
    updates: [] as Row[],
  };

  const tableApi = (name: keyof typeof state) => ({
    select: (_cols?: string) => ({
      eq: (col: string, val: unknown) => ({
        maybeSingle: async () => {
          const rows = state[name] as Row[];
          const hit = rows.find((r) => r[col] === val);
          return { data: hit ?? null, error: null };
        },
        single: async () => {
          const rows = state[name] as Row[];
          const hit = rows.find((r) => r[col] === val);
          return { data: hit ?? null, error: hit ? null : new Error("not found") };
        },
      }),
    }),
    update: (patch: Row) => ({
      eq: async (col: string, val: unknown) => {
        const rows = state[name] as Row[];
        const i = rows.findIndex((r) => r[col] === val);
        if (i >= 0) {
          rows[i] = { ...rows[i], ...patch };
          state.updates.push({ table: name, id: val, patch });
        }
        return { error: null };
      },
    }),
    insert: async (row: Row) => {
      (state[name] as Row[]).push({ id: crypto.randomUUID(), ...row });
      return { error: null };
    },
  });

  return {
    from: (name: string) => tableApi(name as keyof typeof state),
    __state: state,
  };
}

Deno.test("egress_ended payload records duration + audio artifact after client disconnect", async () => {
  const admin = makeMockAdmin([
    {
      id: "rec-1", organization_id: "org-1",
      egress_id: "EG_abc", egress_status: "active", status: "recording",
      source: "egress",
    },
  ]);

  let analyzedFor: string | null = null;
  const invokeAnalyze = async (id: string) => { analyzedFor = id; };

  // Simulated LiveKit webhook body for a completed egress.
  // The originating client is assumed offline: no client callback runs;
  // only this payload determines the final state.
  const payload = {
    event: "egress_ended",
    egressInfo: {
      egressId: "EG_abc",
      status: "EGRESS_COMPLETE",
      fileResults: [{
        filename: "s3://recordings/org-1/room-9/1732982400000.mp4",
        // 42 minutes in nanoseconds
        duration: String(42 * 60 * 1_000_000_000),
        size: "218103808", // ~208 MB
      }],
    },
  };

  const result = await handleEgressPayload(payload, admin, invokeAnalyze);

  assertEquals(result.ok, true);
  assertEquals(result.recording_id, "rec-1");

  const rec = admin.__state.recordings[0] as Row;
  assertEquals(rec.egress_status, "complete");
  assertEquals(rec.status, "ready");
  assertEquals(rec.duration_seconds, 42 * 60); // 2520 seconds
  assertEquals(rec.file_size, 218103808);
  assertEquals(rec.storage_path, "org-1/room-9/1732982400000.mp4");
  // Confirm the AI analysis was scheduled for the completed recording
  assertEquals(analyzedFor, "rec-1");

  // Lifecycle event was persisted for the health monitor
  assertEquals(admin.__state.egress_events.length, 1);
  const ev = admin.__state.egress_events[0] as Row;
  assertEquals(ev.event_type, "egress_ended");
  assertEquals(ev.status, "complete");
});

Deno.test("egress_failed payload marks recording failed and raises alert", async () => {
  const admin = makeMockAdmin([
    { id: "rec-2", organization_id: "org-2", egress_id: "EG_fail", egress_status: "active", status: "recording", source: "egress" },
  ]);

  const payload = {
    event: "egress_updated",
    egressInfo: { egressId: "EG_fail", status: "EGRESS_FAILED", error: "upload to s3 failed: access denied" },
  };

  const result = await handleEgressPayload(payload, admin, async () => {});
  assertEquals(result.ok, true);

  const rec = admin.__state.recordings[0] as Row;
  assertEquals(rec.egress_status, "failed");
  assertEquals(rec.status, "failed");
  assertEquals(rec.egress_error, "upload to s3 failed: access denied");
  assertEquals(admin.__state.ai_insights.length, 1);
  assertEquals((admin.__state.ai_insights[0] as Row).insight_type, "egress_failed");
});