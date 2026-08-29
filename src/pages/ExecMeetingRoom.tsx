import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { useInvestorAnalytics } from "@/hooks/useInvestorAnalytics";
import { Loader2 } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";

const MeetingRoomView = lazy(() => import("@/components/meetings/MeetingRoomView"));
const FounderCopilotPanel = lazy(() => import("@/components/execintel/FounderCopilotPanel"));

/**
 * Executive Intelligence Meeting Room.
 * - Investor mode (`?mode=investor&t=<access_token>`): no auth required, uses guest token.
 * - Founder mode (default): requires signed-in platform admin; loads the private Copilot panel.
 */
export default function ExecMeetingRoom() {
  const { roomName = "", code = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isPlatformAdmin, loading: adminLoading } = usePlatformAdmin();
  const { track } = useInvestorAnalytics();

  const mode = code || params.get("mode") === "investor" ? "investor" : "founder";
  const accessToken = params.get("t");

  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [shortCode, setShortCode] = useState<string | null>(code || null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const joinedRef = useRef(false);

  useEffect(() => {
    if (mode === "founder") {
      if (authLoading || adminLoading) return;
      if (!user) { navigate(`/signin?redirect=/exec-room/${roomName}`); return; }
      if (!isPlatformAdmin) { setError("Only the platform admin can enter founder mode."); setLoading(false); return; }
    }

    // Only ever mint one token per mount. Re-running this effect would swap the
    // LiveKitRoom token prop, forcing a reconnect that drops the live session.
    if (joinedRef.current) return;
    joinedRef.current = true;

    const run = async () => {

      try {
        if (mode === "investor") {
          if (!accessToken && !code) { setError("Missing meeting access token."); setLoading(false); return; }
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-guest-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
            body: JSON.stringify(code ? { code } : { accessToken }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Could not join meeting");
          setToken(data.token); setServerUrl(data.url); setMeetingId(data.meetingId);

        } else {
          const { data: session } = await supabase.auth.getSession();
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.session?.access_token ?? ""}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ roomName }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Could not join meeting");
          setToken(data.token); setServerUrl(data.url);
          const { data: meeting } = await supabase.from("investor_meetings").select("id, short_code").eq("room_name", roomName).maybeSingle();
          setMeetingId(meeting?.id ?? null);
          setShortCode((meeting as { short_code?: string } | null)?.short_code ?? null);

          track("meeting_joined", { role: "founder" }, meeting?.id ?? null);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [mode, accessToken, roomName, user, authLoading, isPlatformAdmin, adminLoading, navigate, track]);

  const onOpenSource = useMemo(() => (ref: string) => {
    window.open(`/investor-pack/${ref}`, "_blank");
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Preparing your room…</div>
      </div>
    );
  }

  if (error || !token || !serverUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-3">Can&apos;t join this meeting</h1>
          <p className="text-white/70 mb-6">{error || "Meeting session unavailable."}</p>
          <a href="/investors" className="underline text-amber-400">Back to Investor Brief</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 text-white">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-400/80">
            {mode === "founder" ? "Founder Mode" : "Investor Session"}
          </div>
          <div className="text-sm font-medium">Global Office · Executive Room</div>
        </div>
        <a href={mode === "founder" ? "/dashboard" : "/investors"} className="text-xs text-white/60 hover:text-white">Leave</a>
      </div>
      <Suspense fallback={<div className="p-8 text-white/60">Loading room…</div>}>
        <MeetingRoomView
          token={token}
          serverUrl={serverUrl}
          recording={false}
          onStartRecording={() => {}}
          onStopRecording={() => {}}
          onLeave={() => navigate(mode === "founder" ? "/dashboard" : "/investors")}
          onCopyInvite={() => {
            const url = shortCode
              ? `${window.location.origin}/m/${shortCode}`
              : `${window.location.origin}/exec-room/${roomName}?t=${accessToken ?? ""}&mode=investor`;
            copyToClipboard(url, "Meeting link copied");
          }}
        />
        {mode === "founder" && isPlatformAdmin && (
          <FounderCopilotPanel meetingId={meetingId} roomName={roomName} onOpenSource={onOpenSource} />
        )}
      </Suspense>
    </div>
  );
}