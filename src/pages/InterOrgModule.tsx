import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, Send, ArrowLeft, Paperclip, Download, Share2, Shield, Trash2 } from "lucide-react";
import ShareConsentDialog from "@/components/interorg/ShareConsentDialog";
import SharedWithUsPanel from "@/components/interorg/SharedWithUsPanel";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";

const InterOrgModule = () => {
  const { user } = useAuth();
  const { org, loading: orgLoading } = useOrganization();
  const [conversations, setConversations] = useState<any[]>([]);
  const [allOrgs, setAllOrgs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newConvOrg, setNewConvOrg] = useState("");
  const [newConvSubject, setNewConvSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  useEffect(() => {
    if (!org) return;
    const fetchConvos = async () => {
      const { data } = await supabase
        .from("org_conversations" as any)
        .select("*")
        .or(`org_a_id.eq.${org.id},org_b_id.eq.${org.id}`)
        .order("updated_at", { ascending: false });
      setConversations((data || []) as any[]);

      // Fetch all org names for display
      const orgIds = new Set<string>();
      (data || []).forEach((c: any) => { orgIds.add(c.org_a_id); orgIds.add(c.org_b_id); });
      if (orgIds.size > 0) {
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id, name, logo_url")
          .in("id", Array.from(orgIds));
        setAllOrgs(orgs || []);
      }
      setLoading(false);
    };
    fetchConvos();
  }, [org]);

  // Fetch available orgs for new conversation
  const [availableOrgs, setAvailableOrgs] = useState<any[]>([]);
  useEffect(() => {
    if (!dialogOpen || !org) return;
    supabase
      .from("organizations")
      .select("id, name")
      .neq("id", org.id)
      .limit(100)
      .then(({ data }) => setAvailableOrgs(data || []));
  }, [dialogOpen, org]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selected) return;
    const fetchMsgs = async () => {
      const { data } = await supabase
        .from("org_messages" as any)
        .select("*")
        .eq("conversation_id", selected.id)
        .order("created_at", { ascending: true });
      setMessages((data || []) as any[]);
    };
    fetchMsgs();

    const channel = supabase
      .channel(`org-msgs-${selected.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "org_messages",
        filter: `conversation_id=eq.${selected.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as any]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selected]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const getOrgName = (id: string) => allOrgs.find(o => o.id === id)?.name || "Unknown Org";
  const getPartnerOrgId = (conv: any) => conv.org_a_id === org?.id ? conv.org_b_id : conv.org_a_id;

  const createConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org || !newConvOrg) return;
    const { data, error } = await supabase
      .from("org_conversations" as any)
      .insert({
        org_a_id: org.id,
        org_b_id: newConvOrg,
        subject: newConvSubject || null,
        created_by: user.id,
      } as any)
      .select()
      .single();
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Conversation already exists" : "Failed to create conversation");
      return;
    }
    toast.success("Conversation started!");
    setDialogOpen(false);
    setNewConvOrg("");
    setNewConvSubject("");
    setConversations(prev => [data as any, ...prev]);
    // Add org name to allOrgs if not present
    const partnerOrg = availableOrgs.find(o => o.id === newConvOrg);
    if (partnerOrg && !allOrgs.find(o => o.id === newConvOrg)) {
      setAllOrgs(prev => [...prev, partnerOrg]);
    }
    setSelected(data);
  };

  const sendMessage = async () => {
    if (!user || !org || !selected || (!newMsg.trim() && !selectedFile)) return;
    setSending(true);

    let attachmentUrl = null;
    let attachmentName = null;

    if (selectedFile) {
      const filePath = `inter-org/${selected.id}/${Date.now()}-${selectedFile.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(filePath, selectedFile);
      if (upErr) { toast.error("File upload failed"); setSending(false); return; }
      attachmentUrl = filePath;
      attachmentName = selectedFile.name;
    }

    const { error } = await supabase.from("org_messages" as any).insert({
      conversation_id: selected.id,
      sender_id: user.id,
      sender_org_id: org.id,
      content: newMsg.trim() || `Shared file: ${attachmentName}`,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    } as any);

    if (error) { toast.error("Failed to send"); setSending(false); return; }
    setNewMsg("");
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

  const formatTime = (d: string) => {
    const date = new Date(d);
    if (isToday(date)) return format(date, "'Today' HH:mm");
    if (isYesterday(date)) return format(date, "'Yesterday' HH:mm");
    return format(date, "MMM d HH:mm");
  };

  if (orgLoading) {
    return <AppLayout title="Partner Connect"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  return (
    <AppLayout title="Partner Connect">
      <div className="flex h-[calc(100vh-env(safe-area-inset-bottom,0px))] md:h-screen relative">
        {/* Sidebar */}
        <div className={`${selected ? "hidden md:block" : "block"} w-full md:w-72 border-r border-border bg-card/50 p-4 shrink-0 overflow-y-auto`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Partner Connect</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="rounded-lg h-8 w-8"><Plus className="w-4 h-4" /></Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle>Start Conversation</DialogTitle></DialogHeader>
                <form onSubmit={createConversation} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Organization</Label>
                    <Select value={newConvOrg} onValueChange={setNewConvOrg}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select organization" /></SelectTrigger>
                      <SelectContent>
                        {availableOrgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject (optional)</Label>
                    <Input value={newConvSubject} onChange={e => setNewConvSubject(e.target.value)} placeholder="Partnership discussion" className="rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full rounded-xl bg-accent text-accent-foreground">Start Conversation</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${selected?.id === c.id ? "bg-accent/10" : "hover:bg-muted"}`}
                >
                  <p className="font-medium text-sm text-foreground truncate">{getOrgName(getPartnerOrgId(c))}</p>
                  {c.subject && <p className="text-xs text-muted-foreground truncate">{c.subject}</p>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className={`${selected ? "block" : "hidden md:block"} flex-1 flex flex-col`}>
          {selected ? (
            <>
              <div className="h-14 border-b border-border flex items-center gap-3 px-4 shrink-0">
                <button onClick={() => setSelected(null)} className="md:hidden p-1.5 rounded-lg hover:bg-muted">
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <Building2 className="w-4 h-4 text-accent" />
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{getOrgName(getPartnerOrgId(selected))}</h3>
                  {selected.subject && <p className="text-[10px] text-muted-foreground">{selected.subject}</p>}
                </div>
                <div className="ml-auto">
                  <SharedWithUsPanel myOrgId={org!.id} partnerOrgId={getPartnerOrgId(selected)} />
                  <ShareConsentDialog ownerOrgId={org!.id} partnerOrgId={getPartnerOrgId(selected)} userId={user!.id} />
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                <AnimatePresence initial={false}>
                  {messages.map(msg => {
                    const isOwn = msg.sender_org_id === org?.id;
                    return (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwn ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"}`}>
                          <p className="text-sm">{msg.content}</p>
                          {msg.attachment_url && (
                            <button
                              onClick={() => downloadAttachment(msg.attachment_url, msg.attachment_name)}
                              className="flex items-center gap-1 mt-1 text-xs underline opacity-80 hover:opacity-100"
                            >
                              <Paperclip className="w-3 h-3" /> {msg.attachment_name}
                            </button>
                          )}
                          <p className={`text-[10px] mt-1 ${isOwn ? "text-accent-foreground/60" : "text-muted-foreground"}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              <div className="border-t border-border p-4 shrink-0">
                {selectedFile && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-1.5">
                    <Paperclip className="w-3 h-3" /> {selectedFile.name}
                    <button onClick={() => setSelectedFile(null)} className="ml-auto text-destructive">×</button>
                  </div>
                )}
                <div className="flex gap-2">
                  <label className="shrink-0 self-end">
                    <input type="file" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                    <div className="h-10 w-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted cursor-pointer transition-colors">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </label>
                  <Textarea
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    placeholder="Type a message..."
                    className="rounded-xl resize-none text-sm min-h-[40px] max-h-[120px]"
                    rows={1}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  />
                  <Button size="icon" onClick={sendMessage} disabled={sending || (!newMsg.trim() && !selectedFile)}
                    className="rounded-xl bg-accent text-accent-foreground shrink-0 self-end h-10 w-10">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <Building2 className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Partner Connect</h3>
              <p className="text-sm text-muted-foreground mt-1">Communicate with other organizations on the platform</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default InterOrgModule;
