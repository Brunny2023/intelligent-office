import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfileNames } from "@/hooks/useProfileNames";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Reply {
  id: string;
  content: string;
  user_id: string;
  is_admin_reply: boolean;
  created_at: string;
}

const SupportTicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { org } = useOrganization();
  const { isAdmin } = useUserRole();
  const { resolve, getName } = useProfileNames();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<any>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: t } = await supabase.from("support_tickets").select("*").eq("id", id).single();
      if (!t) { navigate("/support"); return; }
      setTicket(t);

      const { data: r } = await supabase.from("ticket_replies").select("*").eq("ticket_id", id).order("created_at", { ascending: true });
      const items = (r || []) as Reply[];
      setReplies(items);
      resolve([t.created_by, ...items.map(i => i.user_id)]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`replies-detail-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_replies", filter: `ticket_id=eq.${id}` },
        (payload) => { const r = payload.new as Reply; setReplies(prev => [...prev, r]); resolve([r.user_id]); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const sendReply = async () => {
    if (!user || !ticket || !replyText.trim()) return;
    setSending(true);
    const { error } = await supabase.from("ticket_replies").insert({
      ticket_id: ticket.id,
      user_id: user.id,
      content: replyText.trim(),
      is_admin_reply: isAdmin,
    });
    if (error) toast.error("Failed to send");
    else {
      // Notify ticket creator if admin reply
      if (isAdmin && ticket.created_by !== user.id && org) {
        await supabase.from("notifications").insert({
          user_id: ticket.created_by,
          organization_id: org.id,
          title: "Admin replied to your ticket",
          message: ticket.subject,
          type: "ticket",
          link: `/support/${ticket.id}`,
        });
      }
      setReplyText("");
    }
    setSending(false);
  };

  const resolveTicket = async () => {
    await supabase.from("support_tickets").update({ status: "resolved", updated_at: new Date().toISOString() }).eq("id", ticket.id);
    setTicket((prev: any) => ({ ...prev, status: "resolved" }));
    toast.success("Ticket resolved");
  };

  if (loading) {
    return <AppLayout title="Ticket"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  if (!ticket) return null;

  return (
    <AppLayout title="Ticket Detail">
      <div className="p-4 sm:p-6 md:p-8 space-y-4 flex flex-col h-[calc(100vh-80px)] md:h-screen">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(isAdmin ? "/admin" : "/support")}><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">{ticket.subject}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="capitalize text-[10px]">{ticket.priority}</Badge>
              <Badge variant={ticket.status === "open" ? "default" : "outline"} className="capitalize text-[10px]">{ticket.status}</Badge>
              <span className="text-[10px] text-muted-foreground">by {getName(ticket.created_by)}</span>
            </div>
          </div>
          {isAdmin && ticket.status !== "resolved" && (
            <Button size="sm" variant="outline" onClick={resolveTicket} className="gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Resolve
            </Button>
          )}
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="bg-muted/30 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Original description</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>
              <p className="text-[10px] text-muted-foreground mt-2">{format(new Date(ticket.created_at), "MMM d, yyyy 'at' HH:mm")}</p>
            </div>
            <AnimatePresence initial={false}>
              {replies.map(r => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${r.is_admin_reply ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    r.is_admin_reply ? "bg-accent/10 text-foreground border border-accent/20" : "bg-primary text-primary-foreground"
                  }`}>
                    <p className="text-[10px] font-medium mb-1 opacity-70">{r.is_admin_reply ? "🛡 Admin · " : ""}{getName(r.user_id)}</p>
                    <p className="text-sm whitespace-pre-wrap">{r.content}</p>
                    <p className="text-[9px] opacity-50 mt-1 text-right">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>

          {ticket.status !== "resolved" && (
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={isAdmin ? "Reply as admin..." : "Type your message..."} className="rounded-xl resize-none min-h-[40px] max-h-[100px] text-sm" rows={1}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }} />
                <Button size="icon" onClick={sendReply} disabled={sending || !replyText.trim()} className="rounded-xl shrink-0 self-end h-10 w-10"><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default SupportTicketDetail;
