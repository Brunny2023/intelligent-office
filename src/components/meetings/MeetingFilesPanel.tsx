import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, type RemoteParticipant } from "livekit-client";
import {
  Paperclip, X, Loader2, Download, FileText, Image as ImageIcon, Presentation,
  FileSpreadsheet, Music, Video, File as FileIcon,
} from "lucide-react";

export interface SharedFile {
  name: string;
  url: string;
  size: number;
  by: string;
}

const extOf = (name: string) => name.split(".").pop()?.toLowerCase() || "";
const IconFor = ({ name, className }: { name: string; className?: string }) => {
  const e = extOf(name);
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "bmp", "heic"].includes(e)) return <ImageIcon className={className} />;
  if (["ppt", "pptx", "key", "odp"].includes(e)) return <Presentation className={className} />;
  if (["xls", "xlsx", "csv", "ods"].includes(e)) return <FileSpreadsheet className={className} />;
  if (["mp3", "wav", "m4a", "aac", "ogg", "flac"].includes(e)) return <Music className={className} />;
  if (["mp4", "mov", "webm", "avi", "mkv", "m4v"].includes(e)) return <Video className={className} />;
  if (["pdf", "doc", "docx", "txt", "md", "rtf", "odt"].includes(e)) return <FileText className={className} />;
  return <FileIcon className={className} />;
};
const prettySize = (b: number) =>
  b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

/**
 * In-room file sharing: pick documents, images, slides, audio or video from the
 * device (or any cloud drive through the system file picker) and share them
 * with everyone in the meeting instantly.
 */
export default function MeetingFilesPanel({
  roomName,
  onClose,
}: {
  roomName: string;
  onClose: () => void;
}) {
  const room = useRoomContext();
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meeting-file-share`;
  const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  // Load anything already shared so late joiners see the same materials.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey },
          body: JSON.stringify({ roomName }),
        });
        const data = await res.json();
        if (!cancelled && Array.isArray(data.files)) {
          setFiles(data.files.map((f: SharedFile) => ({ ...f, by: "Shared earlier" })));
        }
      } catch { /* panel still works for new uploads */ }
    })();
    return () => { cancelled = true; };
  }, [endpoint, apikey, roomName]);

  // Files shared by other participants arrive over the LiveKit data channel.
  useEffect(() => {
    if (!room) return;
    const onData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg?.kind !== "file" || !msg.url) return;
        setFiles((prev) => [
          ...prev,
          { name: msg.name, url: msg.url, size: msg.size || 0, by: msg.by || participant?.name || "Participant" },
        ]);
      } catch { /* not a file frame */ }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => { room.off(RoomEvent.DataReceived, onData); };
  }, [room]);

  const upload = useCallback(async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setError(null);
    const me = room?.localParticipant?.name || room?.localParticipant?.identity || "You";
    try {
      for (const file of Array.from(list)) {
        const form = new FormData();
        form.append("roomName", roomName);
        form.append("file", file);
        const res = await fetch(endpoint, { method: "POST", headers: { apikey }, body: form });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error === "file_too_large" ? `${file.name} is larger than 200 MB` : `Could not share ${file.name}`);
        setFiles((prev) => [...prev, { name: file.name, url: data.url, size: file.size, by: me }]);
        try {
          room?.localParticipant?.publishData(
            new TextEncoder().encode(JSON.stringify({ kind: "file", name: file.name, url: data.url, size: file.size, by: me })),
            { reliable: true },
          );
        } catch { /* offline data channel */ }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [endpoint, apikey, roomName, room]);

  return (
    <motion.aside
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute right-2 sm:right-4 bottom-24 z-40 w-[340px] max-w-[calc(100vw-1rem)] flex flex-col gap-2"
    >
      <div className="flex items-center justify-between rounded-xl bg-black/70 border border-white/10 px-3 py-2 backdrop-blur">
        <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Shared files</span>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-white/10 text-white/70" title="Close files">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/60 p-3 backdrop-blur space-y-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { void upload(e.target.files); e.currentTarget.value = ""; }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-svo-blue text-white px-3 py-2 text-xs font-medium disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
          {busy ? "Sharing…" : "Pick files to share"}
        </button>
        <p className="text-[11px] text-white/40 text-center">
          Documents, images, slides, sheets, audio and video — from this device or your cloud drive. Up to 200 MB each.
        </p>
        {error && <p className="text-[11px] text-amber-300">{error}</p>}
      </div>

      <div className="max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-black/60 px-3 py-2 space-y-1.5 backdrop-blur">
        {files.length === 0 ? (
          <p className="text-xs text-white/40">Nothing shared yet in this meeting.</p>
        ) : (
          files.map((f, i) => (
            <div key={`${f.url}-${i}`} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5">
              <IconFor name={f.name} className="w-4 h-4 text-svo-blue shrink-0" />
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 text-xs text-white/85 truncate hover:underline"
                title={f.name}
              >
                {f.name}
                <span className="block text-[10px] text-white/40">{f.by}{f.size ? ` · ${prettySize(f.size)}` : ""}</span>
              </a>
              <a href={f.url} download={f.name} className="p-1 rounded hover:bg-white/10 text-white/60" title="Download">
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          ))
        )}
      </div>
    </motion.aside>
  );
}
