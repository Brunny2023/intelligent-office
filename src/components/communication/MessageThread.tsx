import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Hash, Paperclip, Download } from "lucide-react";
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

const MessageThread = ({ channelId, channelName }: MessageThreadProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

    // Fetch profile names for unique user_ids
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

    // Realtime subscription
    const channel = supabase
      .channel(`messages-${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          if (!newMsg.parent_message_id) {
            setMessages((prev) => [...prev, newMsg]);
            // Fetch profile if needed
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

  const sendMessage = async () => {
    if (!user || (!newMessage.trim() && !selectedFile)) return;
    setSending(true);

    let attachmentUrl = null;
    let attachmentName = null;

    if (selectedFile) {
      const filePath = `chat/${channelId}/${Date.now()}-${selectedFile.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(filePath, selectedFile);
      if (upErr) { toast.error("File upload failed"); setSending(false); return; }
      attachmentUrl = filePath;
      attachmentName = selectedFile.name;
    }

    const { error } = await supabase.from("messages").insert({
      channel_id: channelId,
      user_id: user.id,
      content: newMessage.trim() || `Shared file: ${attachmentName}`,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    } as any);

    if (error) {
      toast.error("Failed to send message");
    }
    setNewMessage("");
    setSelectedFile(null);
    setSending(false);
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

  const formatTimestamp = (date: Date) => {
    if (isToday(date)) return format(date, "'Today at' HH:mm");
    if (isYesterday(date)) return format(date, "'Yesterday at' HH:mm");
    return format(date, "MMM d 'at' HH:mm");
  };

  return (
    <div className="flex flex-col h-full">
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
            {messages.map((msg) => {
              const isOwn = msg.user_id === user?.id;
              return (
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
                    <button
                      onClick={() => downloadAttachment(msg.attachment_url!, msg.attachment_name!)}
                      className="flex items-center gap-1 mt-1 text-xs text-accent hover:underline"
                    >
                      <Paperclip className="w-3 h-3" /> {msg.attachment_name}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
            disabled={sending || !newMessage.trim()}
            className="rounded-xl bg-accent text-accent-foreground shrink-0 self-end h-10 w-10"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;
