import { useState, useCallback, useEffect, useRef } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Plus, PhoneCall, Mic, MicOff, VideoOff, Monitor, PhoneOff, X, Upload, Sparkles, Circle, Square, FileAudio } from "lucide-react";
import { toast } from "sonner";
import PostMeetingPanel from "@/components/meetings/PostMeetingPanel";
import { formatDistanceToNow } from "date-fns";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
} from "@livekit/components-react";

const MeetingsModule = () => {
  const { user } = useAuth();
  const { org, loading } = useOrganization();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [lkToken, setLkToken] = useState("");
  const [lkUrl, setLkUrl] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [openRecording, setOpenRecording] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const fetchRecordings = useCallback(async () => {
    if (!org) return;
    const { data } = await supabase.from("meeting_recordings")
      .select("*, meeting_rooms(title, room_name), meeting_summaries(summary)")
      .eq("organization_id", org.id).order("created_at",{ascending:false}).limit(20);
    setRecordings(data || []);
  }, [org]);

  useEffect(() => { fetchRecordings(); }, [fetchRecordings]);

  const startMeeting = useCallback(async () => {
    if (!roomName.trim()) { toast.error("Please enter a room name"); return; }
    setConnecting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !org || !user) { toast.error("Not authenticated"); setConnecting(false); return; }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const normalized = roomName.trim().toLowerCase().replace(/\s+/g, "-");
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/livekit-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ roomName: normalized }),
        }
      );

      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to get token"); setConnecting(false); return; }

      const { data: mroom } = await supabase.from("meeting_rooms").insert({
        organization_id: org.id, room_name: normalized, title: roomName.trim(), host_id: user.id,
      }).select().single();
      if (mroom) {
        setCurrentRoomId(mroom.id);
        await supabase.from("meeting_participants").insert({
          room_id: mroom.id, user_id: user.id, organization_id: org.id,
        }).select();
      }

      setLkToken(data.token);
      setLkUrl(data.url);
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Connection failed");
    }
    setConnecting(false);
  }, [roomName, org, user]);

  const leaveMeeting = async () => {
    if (recording) await stopRecording();
    if (currentRoomId) {
      await supabase.from("meeting_rooms").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", currentRoomId);
    }
    setLkToken("");
    setLkUrl("");
    setRoomName("");
    setCurrentRoomId(null);
    fetchRecordings();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await uploadRecording(blob);
      };
      mr.start();
      mediaRecRef.current = mr;
      setRecording(true);
      toast.success("Recording audio for AI transcription");
    } catch (e: any) { toast.error(e.message || "Mic access denied"); }
  };

  const stopRecording = async () => {
    return new Promise<void>((resolve) => {
      const mr = mediaRecRef.current;
      if (!mr) return resolve();
      mr.onstop = async () => {
        const stream = mr.stream;
        stream?.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await uploadRecording(blob);
        resolve();
      };
      mr.stop();
      setRecording(false);
    });
  };

  const uploadRecording = async (blob: Blob) => {
    if (!org || !user) return;
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

  const handleFileUpload = async (file: File) => {
    if (!org || !user) return;
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

  // Active meeting view
  if (lkToken && lkUrl) {
    return (
      <AppLayout title="Meeting">
        <div className="relative h-[calc(100vh-4rem)]">
          <LiveKitRoom
            token={lkToken}
            serverUrl={lkUrl}
            connect={true}
            onDisconnected={leaveMeeting}
            data-lk-theme="default"
            style={{ height: "100%" }}
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            {!recording ? (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className="bg-svo-blue text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm font-medium">
                <Circle className="w-4 h-4 fill-current" /> Record for AI
              </motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={stopRecording}
                className="bg-red-500 text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm font-medium animate-pulse">
                <Square className="w-4 h-4 fill-current" /> Stop & Analyze
              </motion.button>
            )}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={leaveMeeting}
              className="bg-destructive text-destructive-foreground rounded-full p-3 shadow-lg">
              <PhoneOff className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Meetings">
      <div className="p-6 md:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Video Meetings</h1>
          <p className="text-muted-foreground mt-1">Real-time video conferencing with AI capabilities</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Meeting Card */}
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
                <DialogHeader>
                  <DialogTitle>Start a Meeting</DialogTitle>
                </DialogHeader>
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
                  </div>
                  <Button onClick={startMeeting} disabled={connecting} className="w-full rounded-xl bg-svo-blue text-white">
                    {connecting ? "Connecting..." : <><Video className="w-4 h-4 mr-2" /> Join Room</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* AI Features Card */}
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
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
              <span className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-accent-foreground text-sm font-medium">
                {uploading ? "Uploading…" : <><Upload className="w-4 h-4" /> Upload recording</>}
              </span>
            </label>
          </motion.div>

          {/* Recent Analyzed Meetings */}
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

        {/* Recordings list */}
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
