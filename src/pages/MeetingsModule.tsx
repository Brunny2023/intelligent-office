import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/dashboard/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Video, PhoneCall, Mic, Upload, Sparkles, FileAudio, Link as LinkIcon, Users } from "lucide-react";
import { toast } from "sonner";
import PostMeetingPanel from "@/components/meetings/PostMeetingPanel";
import { formatDistanceToNow } from "date-fns";
import MeetingRoomView from "@/components/meetings/MeetingRoomView";

const MAX_RECORDING_BYTES = 500 * 1024 * 1024; // 500 MB

const MeetingsModule = () => {
  const { user } = useAuth();
  const { org, loading } = useOrganization();
  const params = useParams();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [lkToken, setLkToken] = useState("");
  const [lkUrl, setLkUrl] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentParticipantRowId, setCurrentParticipantRowId] = useState<string | null>(null);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [openRecording, setOpenRecording] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [egressActive, setEgressActive] = useState(false);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const roomStartRef = useRef<number>(0);
  const rescanRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRecordings = useCallback(async () => {
    if (!org) return;
    const { data } = await supabase.from("meeting_recordings")
      .select("*, meeting_rooms(title, room_name), meeting_summaries(summary)")
      .eq("organization_id", org.id).order("created_at",{ascending:false}).limit(20);
    setRecordings(data || []);
  }, [org]);

  const fetchActiveRooms = useCallback(async () => {
    if (!org) return;
    const { data } = await supabase.from("meeting_rooms")
      .select("id, room_name, title, host_id, started_at")
      .eq("organization_id", org.id).eq("status", "active")
      .order("started_at", { ascending: false });
    setActiveRooms(data || []);
  }, [org]);

  useEffect(() => { fetchRecordings(); fetchActiveRooms(); }, [fetchRecordings, fetchActiveRooms]);

  // Realtime: recordings & active rooms
  useEffect(() => {
    if (!org) return;
    const ch = supabase.channel(`meetings-${org.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_recordings", filter: `organization_id=eq.${org.id}` }, () => fetchRecordings())
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_rooms", filter: `organization_id=eq.${org.id}` }, () => fetchActiveRooms())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [org, fetchRecordings, fetchActiveRooms]);

  const startMeeting = useCallback(async (overrideName?: string) => {
    const raw = (overrideName ?? roomName).trim();
    if (!raw) { toast.error("Please enter a room name"); return; }
    const normalized = raw.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
    if (!normalized) { toast.error("Room name must contain letters or numbers"); return; }
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !org || !user) { toast.error("Not authenticated"); setConnecting(false); return; }
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/livekit-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ roomName: normalized }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to get token"); setConnecting(false); return; }

      // Join existing active room in this org, or create one
      const { data: existing } = await supabase.from("meeting_rooms")
        .select("id").eq("organization_id", org.id).eq("room_name", normalized).eq("status", "active").maybeSingle();
      let roomId = existing?.id ?? null;
      if (!roomId) {
        const { data: mroom, error: rmErr } = await supabase.from("meeting_rooms").insert({
          organization_id: org.id, room_name: normalized, title: raw, host_id: user.id,
        }).select("id").single();
        if (rmErr) { toast.error(rmErr.message); setConnecting(false); return; }
        roomId = mroom.id;
      }
      setCurrentRoomId(roomId);
      const { data: prow } = await supabase.from("meeting_participants").insert({
        room_id: roomId, user_id: user.id, organization_id: org.id,
      }).select("id").single();
      setCurrentParticipantRowId(prow?.id ?? null);
      roomStartRef.current = Date.now();

      setLkToken(data.token);
      setLkUrl(data.url);
      setDialogOpen(false);

      // Auto-start server-side LiveKit Egress if enabled for this tenant.
      // Only the host initiates; other joiners get idempotent "reused" response.
      if (org.egress_enabled && roomId) {
        try {
          const { data: egRes, error: egErr } = await supabase.functions.invoke("livekit-egress-start", {
            body: { roomName: normalized, roomId },
          });
          if (egErr || (egRes as any)?.error) {
            toast.error((egRes as any)?.error ?? egErr?.message ?? "Cloud recording failed to start");
          } else {
            setEgressActive(true);
            toast.success("Cloud recording started — safe to close your tab");
          }
        } catch (e: any) {
          toast.error(e.message || "Cloud recording start failed");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Connection failed");
    }
    setConnecting(false);
  }, [roomName, org, user]);

  // Deep-link: /meetings/:roomName auto-joins
  useEffect(() => {
    const rn = (params as any).roomName as string | undefined;
    if (rn && !lkToken && org && user) {
      setRoomName(rn);
      startMeeting(rn);
    }
  }, [params, lkToken, org, user, startMeeting]);

  const uploadRecording = async (blob: Blob) => {
    if (!org || !user) return;
    if (blob.size === 0) { toast.error("Empty recording — nothing to upload"); return; }
    setUploading(true);
    const path = `${org.id}/${currentRoomId ?? "adhoc"}/${Date.now()}.webm`;
    const { error: upErr } = await supabase.storage.from("recordings").upload(path, blob, { contentType: "audio/webm" });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data: rec, error } = await supabase.from("meeting_recordings").insert({
      organization_id: org.id, room_id: currentRoomId, uploaded_by: user.id,
      storage_path: path, file_size: blob.size, mime_type: "audio/webm",
    }).select().single();
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Recording uploaded — analyzing…");
    setOpenRecording(rec.id);
    supabase.functions.invoke("meeting-analyze", { body: { mode: "full", recording_id: rec.id } })
      .then(({ data, error }) => {
        if (error || (data as any)?.error) toast.error((data as any)?.error ?? error?.message ?? "Analysis failed");
        else toast.success("Meeting analyzed");
        fetchRecordings();
      });
  };

  // Mixes local mic + all remote audio tracks via WebAudio, chunked at 5s
  const startRecording = async (getRoom?: () => any | null) => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AC: typeof AudioContext = (window as any).AudioContext ?? (window as any).webkitAudioContext;
      const ctx = new AC();
      const dest = ctx.createMediaStreamDestination();
      const sources: MediaStreamAudioSourceNode[] = [];
      const localSrc = ctx.createMediaStreamSource(localStream);
      localSrc.connect(dest); sources.push(localSrc);

      const lkRoom = getRoom?.();
      const attached = new Set<string>();
      const scanRemote = () => {
        if (!lkRoom) return;
        lkRoom.remoteParticipants?.forEach?.((rp: any) => {
          const pubs = rp.audioTrackPublications ?? rp.getTrackPublications?.() ?? [];
          (pubs.values ? Array.from(pubs.values()) : pubs).forEach((pub: any) => {
            const mt: MediaStreamTrack | undefined = pub?.track?.mediaStreamTrack;
            if (mt && mt.kind === "audio" && !attached.has(mt.id)) {
              attached.add(mt.id);
              try {
                const s = ctx.createMediaStreamSource(new MediaStream([mt]));
                s.connect(dest); sources.push(s);
              } catch (e) { console.warn("mix attach failed", e); }
            }
          });
        });
      };
      scanRemote();
      rescanRef.current = setInterval(scanRemote, 2000);

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const mr = new MediaRecorder(dest.stream, { mimeType: mime, audioBitsPerSecond: 64000 });
      chunksRef.current = [];
      let total = 0;
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          total += e.data.size;
          if (total > MAX_RECORDING_BYTES) {
            toast.error("Recording reached 500 MB cap — stopping");
            if (mr.state !== "inactive") mr.stop();
          }
        }
      };
      mr.onstop = async () => {
        if (rescanRef.current) { clearInterval(rescanRef.current); rescanRef.current = null; }
        localStream.getTracks().forEach(t => t.stop());
        sources.forEach(s => { try { s.disconnect(); } catch { /* noop */ } });
        try { await ctx.close(); } catch { /* noop */ }
        const blob = new Blob(chunksRef.current, { type: mime });
        await uploadRecording(blob);
      };
      mr.start(5000);
      mediaRecRef.current = mr;
      setRecording(true);
      toast.success("Recording full-room audio for AI");
    } catch (e: any) { toast.error(e.message || "Mic access denied"); }
  };

  const stopRecording = async () => {
    return new Promise<void>((resolve) => {
      const mr = mediaRecRef.current;
      if (!mr) return resolve();
      const prev = mr.onstop;
      mr.onstop = async (ev) => { try { await (prev as any)?.call(mr, ev); } finally { resolve(); } };
      if (mr.state !== "inactive") mr.stop(); else resolve();
      setRecording(false);
    });
  };

  const leaveMeeting = async () => {
    if (recording) await stopRecording();
    if (currentParticipantRowId) {
      await supabase.from("meeting_participants").update({ left_at: new Date().toISOString() }).eq("id", currentParticipantRowId);
    }
    if (currentRoomId) {
      const { data: remaining } = await supabase.from("meeting_participants")
        .select("id").eq("room_id", currentRoomId).is("left_at", null);
      if (!remaining || remaining.length === 0) {
        const dur = Math.max(1, Math.round((Date.now() - roomStartRef.current) / 1000));
        await supabase.from("meeting_rooms").update({
          status: "ended", ended_at: new Date().toISOString(), duration_seconds: dur,
        }).eq("id", currentRoomId);
      }
    }
    setLkToken(""); setLkUrl(""); setRoomName("");
    setCurrentRoomId(null); setCurrentParticipantRowId(null);
    setEgressActive(false);
    if ((params as any).roomName) navigate("/meetings", { replace: true });
    fetchRecordings(); fetchActiveRooms();
  };

  const handleFileUpload = async (file: File) => {
    if (!org || !user) return;
    if (file.size > MAX_RECORDING_BYTES) { toast.error("File exceeds 500 MB limit"); return; }
    setUploading(true);
    const path = `${org.id}/uploads/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("recordings").upload(path, file, { contentType: file.type });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data: rec, error } = await supabase.from("meeting_recordings").insert({
      organization_id: org.id, uploaded_by: user.id, storage_path: path,
      file_size: file.size, mime_type: file.type,
    }).select().single();
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    setOpenRecording(rec.id);
    fetchRecordings();
    toast.success("Recording uploaded — analyzing…");
    supabase.functions.invoke("meeting-analyze", { body: { mode: "full", recording_id: rec.id } })
      .then(({ data, error }) => {
        if (error || (data as any)?.error) toast.error((data as any)?.error ?? error?.message ?? "Analysis failed");
        else toast.success("Meeting analyzed");
        fetchRecordings();
      });
  };

  const copyInvite = (name: string) => {
    const url = `${window.location.origin}/meetings/${encodeURIComponent(name)}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Invite link copied"));
  };

  if (loading) {
    return (
      <AppLayout title="Meetings">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (lkToken && lkUrl) {
    const currentName = activeRooms.find(r => r.id === currentRoomId)?.room_name || roomName || "meeting";
    return (
      <AppLayout title="Meeting">
        <Suspense fallback={<div className="h-[calc(100vh-4rem)] flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
          <MeetingRoomView
            token={lkToken}
            serverUrl={lkUrl}
            recording={recording}
            egressActive={egressActive}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onLeave={leaveMeeting}
            onCopyInvite={() => copyInvite(currentName)}
          />
        </Suspense>
      </AppLayout>
    );
  }

  const previewSlug = roomName.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");

  return (
    <AppLayout title="Meetings">
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          eyebrow="Collaboration"
          icon={Video}
          title="Video Meetings"
          subtitle="Real-time video conferencing with AI capabilities"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            whileHover={{ y: -4, boxShadow: "0 12px 40px hsl(var(--svo-navy) / 0.12)" }}
            className="glass-card-strong rounded-2xl p-6 cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-svo-blue/10 flex items-center justify-center mb-4 group-hover:bg-svo-blue/20 transition-colors">
              <Video className="w-7 h-7 text-svo-blue" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Start Instant Meeting</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Launch a quick video call and invite your team
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-svo-blue text-white hover:bg-svo-blue/90">
                  <PhoneCall className="w-4 h-4 mr-2" /> Start Now
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle>Start or Join a Meeting</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Room Name</Label>
                    <Input
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="e.g. team-standup"
                      className="rounded-xl"
                      onKeyDown={e => e.key === "Enter" && startMeeting()}
                    />
                    <p className="text-xs text-muted-foreground break-all">
                      Share to invite: <span className="font-mono">{window.location.origin}/meetings/{previewSlug || "…"}</span>
                    </p>
                  </div>
                  <Button onClick={() => startMeeting()} disabled={connecting} className="w-full rounded-xl bg-svo-blue text-white">
                    {connecting ? "Connecting..." : <><Video className="w-4 h-4 mr-2" /> Join Room</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            whileHover={{ y: -4, boxShadow: "0 12px 40px hsl(var(--svo-navy) / 0.12)" }}
            className="glass-card-strong rounded-2xl p-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Mic className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">AI Transcription</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Record any meeting → automatic transcript, summary, decisions & action items.
            </p>
            <label className="cursor-pointer">
              <input type="file" accept="audio/*,video/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.currentTarget.value = ""; }} />
              <span className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-accent-foreground text-sm font-medium">
                {uploading ? "Uploading…" : <><Upload className="w-4 h-4" /> Upload recording</>}
              </span>
            </label>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
            whileHover={{ y: -4, boxShadow: "0 12px 40px hsl(var(--svo-navy) / 0.12)" }}
            className="glass-card-strong rounded-2xl p-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-svo-gold/10 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-svo-gold" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">AI Meeting Intelligence</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Auto-generated decisions, action items pushed straight into your task board.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-svo-gold/10 text-svo-gold">Transcripts</span>
              <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">Summaries</span>
              <span className="text-xs px-2 py-1 rounded-full bg-svo-blue/10 text-svo-blue">Action items</span>
            </div>
          </motion.div>
        </div>

        {activeRooms.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card-strong rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-svo-blue" /> Active Meetings
            </h3>
            <div className="space-y-2">
              {activeRooms.map(r => (
                <div key={r.id} className="glass-card rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.title || r.room_name}</div>
                    <div className="text-xs text-muted-foreground">
                      started {formatDistanceToNow(new Date(r.started_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="rounded-lg h-8" onClick={() => copyInvite(r.room_name)}>
                      <LinkIcon className="w-3 h-3 mr-1" /> Invite
                    </Button>
                    <Button size="sm" className="rounded-lg h-8 bg-svo-blue text-white"
                      onClick={() => startMeeting(r.room_name)}>
                      <PhoneCall className="w-3 h-3 mr-1" /> Join
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
          className="glass-card-strong rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Recordings</h3>
          {recordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileAudio className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground">No recordings yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Record a meeting or upload an audio file to analyze it</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recordings.map((r) => (
                <button key={r.id} onClick={() => setOpenRecording(r.id)}
                  className="w-full text-left glass-card rounded-xl p-3 flex items-center justify-between hover:bg-muted/40">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {r.meeting_rooms?.title || r.storage_path.split("/").pop()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })} · {r.status}
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-accent" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <Dialog open={!!openRecording} onOpenChange={(v) => !v && setOpenRecording(null)}>
          <DialogContent className="rounded-2xl max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Meeting Intelligence</DialogTitle></DialogHeader>
            {openRecording && <PostMeetingPanel recordingId={openRecording} onDone={() => { setOpenRecording(null); fetchRecordings(); }} />}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default MeetingsModule;