import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, type RemoteParticipant } from "livekit-client";
import { AiCaptioner } from "@/lib/aiCaptions";
import { publishUtterance } from "@/lib/liveTranscript";

/**
 * Live captions for every meeting room.
 *
 * Captures the local microphone once, transcribes each utterance with the
 * platform speech service, shows it as a subtitle bar, and broadcasts it over
 * the LiveKit data channel so every participant sees what others are saying.
 */
export default function CaptionsLayer({
  enabled,
  vocabularyHint,
}: {
  enabled: boolean;
  vocabularyHint?: string;
}) {
  const room = useRoomContext();
  const [subtitles, setSubtitles] = useState<Array<{ speaker: string; text: string }>>([]);
  const [status, setStatus] = useState<"listening" | "transcribing" | "idle">("idle");
  const [error, setError] = useState<string | null>(null);
  const hideTimer = useRef<number | null>(null);

  const show = useCallback((speaker: string, text: string) => {
    setSubtitles((prev) => [...prev.slice(-1), { speaker, text }]);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setSubtitles([]), 9000);
  }, []);

  // Local speech → subtitle + shared transcript + broadcast to the room.
  useEffect(() => {
    if (!enabled) { setStatus("idle"); return; }
    const me = room?.localParticipant?.name || room?.localParticipant?.identity || "You";
    const captioner = new AiCaptioner({
      vocabularyHint,
      onStatus: setStatus,
      onError: (message) => setError(message),
      onUtterance: (text) => {
        setError(null);
        show(me, text);
        publishUtterance(text, me);
        try {
          room?.localParticipant?.publishData(
            new TextEncoder().encode(JSON.stringify({ kind: "caption", speaker: me, text })),
            { reliable: true },
          );
        } catch { /* data channel unavailable */ }
      },
    });
    void captioner.start();
    return () => captioner.stop();
  }, [enabled, room, vocabularyHint, show]);

  // Remote captions (and shared-file notices are handled elsewhere).
  useEffect(() => {
    if (!room) return;
    const onData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg?.kind !== "caption" || !msg.text) return;
        const speaker = msg.speaker || participant?.name || participant?.identity || "Participant";
        show(speaker, msg.text);
        publishUtterance(msg.text, speaker);
      } catch { /* not a caption frame */ }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => { room.off(RoomEvent.DataReceived, onData); };
  }, [room, show]);

  useEffect(() => () => { if (hideTimer.current) window.clearTimeout(hideTimer.current); }, []);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 sm:bottom-28 z-40 flex flex-col items-center gap-1 px-4">
      {error && (
        <span className="rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-100 px-3 py-1 text-[11px]">
          {error}
        </span>
      )}
      {subtitles.length === 0 && !error && (
        <span className="rounded-full bg-black/60 text-white/60 px-3 py-1 text-[11px]">
          {status === "transcribing" ? "Captioning…" : "Captions on — listening"}
        </span>
      )}
      {subtitles.map((line, i) => (
        <p
          key={`${line.text}-${i}`}
          className="max-w-3xl rounded-lg bg-black/75 px-4 py-2 text-center text-sm sm:text-base text-white leading-snug backdrop-blur"
        >
          <span className="text-white/50 mr-2 text-xs uppercase tracking-wide">{line.speaker}</span>
          {line.text}
        </p>
      ))}
    </div>
  );
}
