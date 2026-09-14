import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Hash, Paperclip, Download, FileText, FileSpreadsheet, Presentation,
  Image as ImageIcon, File as FileIcon, Loader2, X,
} from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_message_id: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
}

interface MessageThreadProps {
  channelId: string;
  channelName: string;
}

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "bmp"];
const SLIDE_EXT = ["ppt", "pptx", "key", "odp"];
const SHEET_EXT = ["xls", "xlsx", "csv", "ods"];
const DOC_EXT = ["pdf", "doc", "docx", "txt", "md", "rtf", "odt"];

const extOf = (name: string) => name.split(".").pop()?.toLowerCase() || "";
const kindOf = (name: string) => {
  const e = extOf(name);
  if (IMAGE_EXT.includes(e)) return "image" as const;
  if (SLIDE_EXT.includes(e)) return "slide" as const;
  if (SHEET_EXT.includes(e)) return "sheet" as const;
  if (DOC_EXT.includes(e)) return "doc" as const;
  return "file" as const;
};
const KindIcon = ({ name, className }: { name: string; className?: string }) => {
  const kind = kindOf(name);
  if (kind === "image") return <ImageIcon className={className} />;
  if (kind === "slide") return <Presentation className={className} />;
  if (kind === "sheet") return <FileSpreadsheet className={className} />;
  if (kind === "doc") return <FileText className={className} />;
  return <FileIcon className={className} />;
};
const prettySize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const MessageThread = ({ channelId, channelName }: MessageThreadProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("channel_id", channelId)
      .is("parent_message_id", null)
      .order("created_at", { ascending: true })
      .limit(100);
    setMessages(data || []);
    setLoading(false);

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((m) => m.user_id))];
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      if (profileData) {
        const map: Record<string, string> = {};
        profileData.forEach((p) => { map[p.id] = p.full_name; });
        setProfiles(map);
      }
    }
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`messages-${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          if (!newMsg.parent_message_id) {
            setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
            if (!profiles[newMsg.user_id]) {
              supabase.from("profiles").select("id, full_name").eq("id", newMsg.user_id).single()
                .then(({ data }) => {
                  if (data) setProfiles((prev) => ({ ...prev, [data.id]: data.full_name }));
                });
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [channelId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Signed preview links for shared images so they render inline in the thread.
  useEffect(() => {
    const pending = messages.filter(
      (m) => m.attachment_url && m.attachment_name && kindOf(m.attachment_name) === "image" && !previews[m.attachment_url]
    );
    if (pending.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        pending.map(async (m) => {
          const { data } = await supabase.storage.from("documents").createSignedUrl(m.attachment_url!, 3600);
          return [m.attachment_url!, data?.signedUrl || ""] as const;
        })
      );
      if (cancelled) return;
      setPreviews((prev) => {
        const next = { ...prev };
        entries.forEach(([k, v]) => { if (v) next[k] = v; });
        return next;
      });
    })();
    return () => { cancelled = true; };
  }, [messages, previews]);

  const addFiles = useCallback((files: FileList | File[] | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    const valid = incoming.filter((f) => {
      if (f.size > MAX_FILE_BYTES) { toast.error(`${f.name} is larger than 25 MB`); return false; }
      return true;
    });
    if (valid.length) setSelectedFiles((prev) => [...prev, ...valid].slice(0, 10));
  }, []);

  const sendMessage = async () => {
    if (!user || (!newMessage.trim() && selectedFiles.length === 0)) return;
    setSending(true);

    try {
      if (selectedFiles.length === 0) {
        const { error } = await supabase.from("messages").insert({
          channel_id: channelId,
          user_id: user.id,
          content: newMessage.trim(),
        } as any);
        if (error) throw error;
      } else {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const safeName = file.name.replace(/[^\w.-]+/g, "_");
          const filePath = `chat/${channelId}/${Date.now()}-${i}-${safeName}`;
          const { error: upErr } = await supabase.storage
            .from("documents")
            .upload(filePath, file, { contentType: file.type || undefined, upsert: false });
          if (upErr) throw new Error(`${file.name}: ${upErr.message}`);

          const { error } = await supabase.from("messages").insert({
            channel_id: channelId,
            user_id: user.id,
            content: i === 0 && newMessage.trim() ? newMessage.trim() : `Shared ${kindOf(file.name)}: ${file.name}`,
            attachment_url: filePath,
            attachment_name: file.name,
          } as any);
          if (error) throw error;
        }
      }
      setNewMessage("");
      setSelectedFiles([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const downloadAttachment = async (url: string, name: string) => {
    const { data, error } = await supabase.storage.from("documents").download(url);
    if (error || !data) { toast.error("Download failed"); return; }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(data);
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const openAttachment = async (url: string) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(url, 3600);
    if (error || !data?.signedUrl) { toast.error("Could not open file"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const formatTimestamp = (date: Date) => {
    if (isToday(date)) return format(date, "'Today at' HH:mm");
    if (isYesterday(date)) return format(date, "'Yesterday at' HH:mm");
    return format(date, "MMM d 'at' HH:mm");
  };

  return (
    <div
      className="flex flex-col h-full relative"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
    >
      {dragging && (
        <div className="absolute inset-0 z-20 bg-background/85 border-2 border-dashed border-accent rounded-xl flex items-center justify-center pointer-events-none">
          <p className="text-sm font-medium text-accent">Drop documents, images or slides to share</p>
        </div>
      )}

      {/* Channel header */}
      <div className="h-14 border-b border-border flex items-center gap-2 px-4 shrink-0">
        <Hash className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">{channelName}</h3>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Hash className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No messages in #{channelName} yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Be the first to say something!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group py-1.5 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {profiles[msg.user_id] || msg.user_id.slice(0, 8)}
                  </span>
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatTimestamp(new Date(msg.created_at))}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{msg.content}</p>

                {msg.attachment_url && msg.attachment_name && (
                  <div className="mt-2 max-w-sm">
                    {kindOf(msg.attachment_name) === "image" && previews[msg.attachment_url] ? (
                      <button onClick={() => openAttachment(msg.attachment_url!)} className="block">
                        <img
                          src={previews[msg.attachment_url]}
                          alt={msg.attachment_name}
                          loading="lazy"
                          className="rounded-xl border border-border max-h-64 object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2">
                        <KindIcon name={msg.attachment_name} className="w-5 h-5 text-accent shrink-0" />
                        <button
                          onClick={() => openAttachment(msg.attachment_url!)}
                          className="text-xs font-medium text-foreground truncate hover:underline text-left flex-1"
                        >
                          {msg.attachment_name}
                        </button>
                        <button
                          onClick={() => downloadAttachment(msg.attachment_url!, msg.attachment_name!)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 shrink-0">
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedFiles.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-1.5">
                <KindIcon name={file.name} className="w-3.5 h-3.5 text-accent" />
                <span className="max-w-[160px] truncate">{file.name}</span>
                <span className="text-[10px] opacity-70">{prettySize(file.size)}</span>
                <button
                  onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-destructive"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <label className="shrink-0 self-end">
            <input
              type="file"
              multiple
              accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.md,.rtf,.odt,.ppt,.pptx,.key,.odp,.xls,.xlsx,.csv,.ods,.zip"
              className="hidden"
              onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }}
            />
            <div
              className="h-10 w-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted cursor-pointer transition-colors"
              title="Attach documents, images or slides"
            >
              <Paperclip className="w-4 h-4 text-muted-foreground" />
            </div>
          </label>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onPaste={(e) => {
              const files = Array.from(e.clipboardData.files || []);
              if (files.length) { e.preventDefault(); addFiles(files); }
            }}
            placeholder={`Message #${channelName}`}
            className="rounded-xl resize-none text-sm min-h-[40px] max-h-[120px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={sending || (!newMessage.trim() && selectedFiles.length === 0)}
            className="rounded-xl bg-accent text-accent-foreground shrink-0 self-end h-10 w-10"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;
