import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { LiveKitRoom, VideoConference, RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import "@livekit/components-styles";
import { motion } from "framer-motion";
import { Circle, Square, PhoneOff, Link as LinkIcon, Cloud, RotateCw, Check, Captions, VideoOff, Maximize, Minimize } from "lucide-react";
import { DisconnectReason, RoomEvent, type Room } from "livekit-client";
import { getDisconnectAction } from "./meetingRoomPolicy";

const LiveTranscriptPanel = lazy(() => import("./LiveTranscriptPanel"));

/**
 * Turns the local mic + camera on once the room is actually connected and
 * surfaces a clear reason when the browser refuses. Devices are acquired AFTER
 * connection (never as a pre-connect requirement) so a blocked camera can no
 * longer stop the room from connecting at all.
 */
function MediaBootstrap() {
  const room = useRoomContext();
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!room) return;
    let cancelled = false;

    const describe = (err: unknown) => {
      const name = (err as { name?: string })?.name ?? "";
      const message = (err as Error)?.message ?? "";
      if (name === "NotAllowedError" || /permission|denied|disallowed/i.test(message)) {
        return "Camera/microphone blocked. Allow access for this site (or open the meeting in a new tab), then use the buttons in the control bar.";
      }
      if (name === "NotFoundError" || /device/i.test(message)) return "No camera detected on this device. Audio still works.";
      return `Device could not start: ${message || "unknown error"}`;
    };

    const enableMedia = async () => {
      let issue: string | null = null;
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch (err) {
        issue = describe(err);
      }
      try {
        await room.localParticipant.setCameraEnabled(true);
      } catch (err) {
        issue = describe(err);
      }
      if (!cancelled) setProblem(issue);
    };

    if (room.state === "connected") void enableMedia();
    room.on(RoomEvent.Connected, enableMedia);
    return () => {
      cancelled = true;
      room.off(RoomEvent.Connected, enableMedia);
    };
  }, [room]);

  if (!problem) return null;
  return (
    <div className="absolute top-20 right-4 z-50 max-w-xs rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-100 px-3 py-2 text-xs flex items-start gap-2 backdrop-blur">
      <VideoOff className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span>{problem}</span>
    </div>
  );
}





interface Props {
  token: string;
  serverUrl: string;
  recording: boolean;
  egressActive?: boolean;
  onStartRecording: (getRoom: () => Room | null) => void | Promise<void>;
  onStopRecording: () => void | Promise<void>;
  onLeave: () => void | Promise<void>;
  onCopyInvite: () => void;
}

// Inner overlay so we can read the LiveKit Room via context for full-room mixing
function Overlay({ recording, egressActive, onStart, onStop, onLeave, onCopyInvite, transcriptOn, onToggleTranscript, fullscreen, onToggleFullscreen }: {
  recording: boolean;
  egressActive?: boolean;
  onStart: (getRoom: () => Room | null) => void | Promise<void>;
  onStop: () => void | Promise<void>;
  onLeave: () => void | Promise<void>;
  onCopyInvite: () => void;
  transcriptOn: boolean;
  onToggleTranscript: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const room = useRoomContext();
  const roomRef = useRef<Room | null>(room ?? null);
  roomRef.current = room ?? null;
  const [copied, setCopied] = useState(false);

  return (
    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 left-2 sm:left-auto z-50 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
      {egressActive && (
        <div className="bg-svo-blue text-white rounded-full px-3 py-2 shadow-lg flex items-center gap-2 text-[11px] sm:text-xs font-medium">
          <Cloud className="w-3.5 h-3.5" />
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="hidden sm:inline">Cloud recording</span>
        </div>
      )}
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onToggleFullscreen}
        aria-label={fullscreen ? "Exit full screen" : "Enter full screen"}
        className="bg-background/80 backdrop-blur border border-border text-foreground rounded-full p-2 sm:px-3 sm:py-2 shadow-lg flex items-center gap-2 text-[11px] sm:text-xs font-medium">
        {fullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">{fullscreen ? "Exit full screen" : "Full screen"}</span>
      </motion.button>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onToggleTranscript}
        aria-pressed={transcriptOn}
        aria-label="Toggle live transcript"
        className={`rounded-full p-2 sm:px-3 sm:py-2 shadow-lg flex items-center gap-2 text-[11px] sm:text-xs font-medium border ${transcriptOn ? "bg-svo-blue text-white border-transparent" : "bg-background/80 backdrop-blur border-border text-foreground"}`}>
        <Captions className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{transcriptOn ? "Transcript on" : "Transcript"}</span>
      </motion.button>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => { onCopyInvite(); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }}
        aria-label="Copy invite link"
        className="bg-background/80 backdrop-blur border border-border text-foreground rounded-full p-2 sm:px-3 sm:py-2 shadow-lg flex items-center gap-2 text-[11px] sm:text-xs font-medium">
        {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> <span className="hidden sm:inline">Link copied</span></> : <><LinkIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Invite</span></>}
      </motion.button>

      {egressActive ? null : !recording ? (
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => onStart(() => roomRef.current)}
          aria-label="Record for AI"
          className="bg-svo-blue text-white rounded-full p-2 sm:px-4 sm:py-2 shadow-lg flex items-center gap-2 text-xs sm:text-sm font-medium">
          <Circle className="w-4 h-4 fill-current" /> <span className="hidden sm:inline">Record for AI</span>
        </motion.button>
      ) : (
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onStop}
          aria-label="Stop and analyze"
          className="bg-red-500 text-white rounded-full p-2 sm:px-4 sm:py-2 shadow-lg flex items-center gap-2 text-xs sm:text-sm font-medium animate-pulse">
          <Square className="w-4 h-4 fill-current" /> <span className="hidden sm:inline">Stop & Analyze</span>
        </motion.button>
      )}
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onLeave}
        className="bg-destructive text-destructive-foreground rounded-full p-2 sm:p-3 shadow-lg" aria-label="Leave meeting">
        <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
      </motion.button>
    </div>
  );
}


export default function MeetingRoomView({ token, serverUrl, recording, egressActive, onStartRecording, onStopRecording, onLeave, onCopyInvite }: Props) {
  // The meeting stays open until a participant explicitly leaves. A dropped
  // connection (network blip, duplicate mount, server restart) shows a rejoin
  // prompt instead of silently kicking the user back to the previous page.
  const [connectKey, setConnectKey] = useState(0);
  const [dropped, setDropped] = useState(false);
  const [transcriptOn, setTranscriptOn] = useState(false);
  const leavingRef = useRef(false);
  // Tracks whether this session ever reached a connected state. LiveKit emits a
  // CLIENT_INITIATED disconnect while a connection attempt is being torn down
  // (remount, token swap, failed handshake); treating that as a hang-up is what
  // bounced users straight back out of the room during "Connecting…".
  const connectedRef = useRef(false);

  const handleLeave = useCallback(() => {
    leavingRef.current = true;
    return onLeave();
  }, [onLeave]);

  const handleConnected = useCallback(() => {
    connectedRef.current = true;
  }, []);

  const handleDisconnected = useCallback((reason?: DisconnectReason) => {
    if (leavingRef.current) return;
    // Never exit on a disconnect that happens before the room was ever joined —
    // offer a rejoin instead so the user stays on the meeting page.
    if (!connectedRef.current) { setDropped(true); return; }
    // A hang-up from LiveKit's own control bar (or an intentional room end)
    // is a real exit — leave the meeting instead of showing the rejoin prompt.
    if (getDisconnectAction(reason) === "leave") {
      leavingRef.current = true;
      void onLeave();
      return;
    }
    setDropped(true);
  }, [onLeave]);

  const rejoin = useCallback(() => {
    connectedRef.current = false;
    setDropped(false);
    setConnectKey((k) => k + 1);
  }, []);

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      <LiveKitRoom
        key={connectKey}
        token={token}
        serverUrl={serverUrl}
        connect={!dropped}
        video={false}
        audio={false}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
        onError={(err) => console.error("[meeting] livekit error", err)}

        data-lk-theme="default"
        style={{ height: "100%" }}
      >

        <VideoConference />
        <RoomAudioRenderer />
        <MediaBootstrap />

        <Overlay
          recording={recording}
          egressActive={egressActive}
          onStart={onStartRecording}
          onStop={onStopRecording}
          onLeave={handleLeave}
          onCopyInvite={onCopyInvite}
          transcriptOn={transcriptOn}
          onToggleTranscript={() => setTranscriptOn((v) => !v)}
        />
        {transcriptOn && (
          <Suspense fallback={null}>
            <LiveTranscriptPanel onClose={() => setTranscriptOn(false)} />
          </Suspense>
        )}
      </LiveKitRoom>

      {dropped && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-background/90 backdrop-blur">
          <div className="text-center max-w-sm px-6">
            <h2 className="text-lg font-semibold mb-2">Connection interrupted</h2>
            <p className="text-sm text-muted-foreground mb-5">
              The meeting is still open. Rejoin to continue — the room only ends when participants leave it.
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={rejoin} className="rounded-full bg-svo-blue text-white px-5 py-2 text-sm font-medium flex items-center gap-2">
                <RotateCw className="w-4 h-4" /> Rejoin meeting
              </button>
              <button onClick={handleLeave} className="rounded-full border border-border px-5 py-2 text-sm font-medium">
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
