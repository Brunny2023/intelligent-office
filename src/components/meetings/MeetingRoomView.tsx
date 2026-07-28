import { useRef } from "react";
import { LiveKitRoom, VideoConference, RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import { motion } from "framer-motion";
import { Circle, Square, PhoneOff, Link as LinkIcon, Cloud } from "lucide-react";
import type { Room } from "livekit-client";

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
function Overlay({ recording, egressActive, onStart, onStop, onLeave, onCopyInvite }: {
  recording: boolean;
  egressActive?: boolean;
  onStart: (getRoom: () => Room | null) => void | Promise<void>;
  onStop: () => void | Promise<void>;
  onLeave: () => void | Promise<void>;
  onCopyInvite: () => void;
}) {
  const room = useRoomContext();
  const roomRef = useRef<Room | null>(room ?? null);
  roomRef.current = room ?? null;

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
      {egressActive && (
        <div className="bg-svo-blue text-white rounded-full px-3 py-2 shadow-lg flex items-center gap-2 text-xs font-medium">
          <Cloud className="w-3.5 h-3.5" />
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          Cloud recording
        </div>
      )}
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onCopyInvite}
        className="bg-background/80 backdrop-blur border border-border text-foreground rounded-full px-3 py-2 shadow-lg flex items-center gap-2 text-xs font-medium">
        <LinkIcon className="w-3.5 h-3.5" /> Invite
      </motion.button>
      {egressActive ? null : !recording ? (
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => onStart(() => roomRef.current)}
          className="bg-svo-blue text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm font-medium">
          <Circle className="w-4 h-4 fill-current" /> Record for AI
        </motion.button>
      ) : (
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onStop}
          className="bg-red-500 text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm font-medium animate-pulse">
          <Square className="w-4 h-4 fill-current" /> Stop & Analyze
        </motion.button>
      )}
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onLeave}
        className="bg-destructive text-destructive-foreground rounded-full p-3 shadow-lg" aria-label="Leave meeting">
        <PhoneOff className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

export default function MeetingRoomView({ token, serverUrl, recording, egressActive, onStartRecording, onStopRecording, onLeave, onCopyInvite }: Props) {
  return (
    <div className="relative h-[calc(100vh-4rem)]">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        onDisconnected={onLeave}
        data-lk-theme="default"
        style={{ height: "100%" }}
      >
        <VideoConference />
        <RoomAudioRenderer />
        <Overlay
          recording={recording}
          egressActive={egressActive}
          onStart={onStartRecording}
          onStop={onStopRecording}
          onLeave={onLeave}
          onCopyInvite={onCopyInvite}
        />
      </LiveKitRoom>
    </div>
  );
}