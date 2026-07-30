import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/dashboard/kit";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Ticket, Plus, Send, ArrowLeft, MessageSquare } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useProfileNames } from "@/hooks/useProfileNames";

interface TicketItem {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

interface Reply {
  id: string;
  content: string;
  user_id: string;
  is_admin_reply: boolean;
  created_at: string;
}

const SupportModule = () => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const navigate = useNavigate();
  const { resolve, getName, names } = useProfileNames();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    setTickets((data || []) as TicketItem[]);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [user]);

  const createTicket = async () => {
    if (!user || !org || !newSubject.trim() || !newDescription.trim()) return;
    const { data, error } = await supabase.from("support_tickets").insert({
      organization_id: org.id,
      created_by: user.id,
      subject: newSubject.trim(),
      description: newDescription.trim(),
      priority: newPriority,
    }).select().single();
    if (error) { toast.error("Failed to create ticket"); return; }
    // Notify admins
    const { data: admins } = await supabase.from("user_roles").select("user_id").eq("organization_id", org.id).in("role", ["owner", "executive", "manager"]);
    if (admins && admins.length > 0) {
      const notifications = admins.map(a => ({
        user_id: a.user_id,
        organization_id: org.id,
        title: "New Support Ticket",
        message: newSubject.trim(),
        type: "ticket",
        link: `/support/${(data as any).id}`,
      }));
      await supabase.from("notifications").insert(notifications);
    }
    toast.success("Ticket created!");
    setDialogOpen(false);
    // Wave 5 rewire: high/urgent tickets route to the cognition layer for a
    // CX/COO advisory (severity, ownership, playbook) without slowing the user.
    if (newPriority === "high" || newPriority === "urgent") {
      const { triggerCognition } = await import("@/lib/cognition");
      void triggerCognition(
        `Support ticket [${newPriority}] "${newSubject.trim()}": ${newDescription.trim().slice(0, 500)}. Advise on triage, owner, SLA, and any systemic risk.`,
      );
    }
    setNewSubject("");
    setNewDescription("");
    setNewPriority("medium");
    fetchTickets();
  };

  const selectTicket = async (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    const { data } = await supabase
      .from("ticket_replies")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    const items = (data || []) as Reply[];
    setReplies(items);
    const userIds = [...new Set(items.map(r => r.user_id))];
    if (userIds.length) resolve(userIds);

    // Subscribe to realtime replies
    const channel = supabase
      .channel(`replies-${ticket.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "ticket_replies",
        filter: `ticket_id=eq.${ticket.id}`,
      }, (payload) => {
        const r = payload.new as Reply;
        setReplies(prev => [...prev, r]);
        resolve([r.user_id]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const sendReply = async () => {
    if (!user || !selectedTicket || !replyText.trim()) return;
    setSending(true);
    const { error } = await supabase.from("ticket_replies").insert({
      ticket_id: selectedTicket.id,
      user_id: user.id,
      content: replyText.trim(),
      is_admin_reply: false,
    });
    if (error) toast.error("Failed to send");
    else setReplyText("");
    setSending(false);
  };

  if (selectedTicket) {
    return (
      <AppLayout title="Support">
        <div className="p-4 sm:p-6 md:p-8 space-y-4 flex flex-col h-[calc(100vh-80px)] md:h-screen">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground truncate">{selectedTicket.subject}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="capitalize text-[10px]">{selectedTicket.priority}</Badge>
                <Badge variant={selectedTicket.status === "open" ? "default" : "outline"} className="capitalize text-[10px]">{selectedTicket.status}</Badge>
              </div>
            </div>
          </div>

          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Original description */}
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Original description</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTicket.description}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{format(new Date(selectedTicket.created_at), "MMM d, yyyy 'at' HH:mm")}</p>
              </div>

              {/* Replies */}
              <AnimatePresence initial={false}>
                {replies.map(r => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${r.is_admin_reply ? "justify-start" : "justify-end"}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      r.is_admin_reply
                        ? "bg-accent/10 text-foreground border border-accent/20"
                        : "bg-primary text-primary-foreground"
                    }`}>
                      <p className="text-[10px] font-medium mb-1 opacity-70">
                        {r.is_admin_reply ? "Admin" : ""} {getName(r.user_id)}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{r.content}</p>
                      <p className="text-[9px] opacity-50 mt-1 text-right">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>

            {/* Reply input */}
            {selectedTicket.status !== "resolved" && (
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your message..."
                    className="rounded-xl resize-none min-h-[40px] max-h-[100px] text-sm"
                    rows={1}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  />
                  <Button size="icon" onClick={sendReply} disabled={sending || !replyText.trim()} className="rounded-xl shrink-0 self-end h-10 w-10">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Support">
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <Ticket className="w-6 h-6 text-accent" /> Support
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Submit tickets and get help from your organization admins</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> New Ticket</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <Input placeholder="Subject" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
                <Textarea placeholder="Describe your issue..." value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={4} />
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={createTicket} disabled={!newSubject.trim() || !newDescription.trim()} className="w-full">Submit Ticket</Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No support tickets yet</p>
            <p className="text-sm mt-1">Click "New Ticket" to get help from your admins</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}>
                <Card className="cursor-pointer hover:border-accent/30 transition-colors" onClick={() => selectTicket(t)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{t.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant={t.status === "open" ? "default" : t.status === "resolved" ? "secondary" : "outline"} className="capitalize text-[10px]">{t.status}</Badge>
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SupportModule;
