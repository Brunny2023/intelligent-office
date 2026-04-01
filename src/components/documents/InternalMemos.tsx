import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useProfileNames } from "@/hooks/useProfileNames";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, PenLine, Send, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import SignaturePad from "@/components/signatures/SignaturePad";

const InternalMemos = () => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const { resolve, getName } = useProfileNames();
  const [memos, setMemos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMemo, setViewMemo] = useState<any>(null);
  const [form, setForm] = useState({ title: "", content: "", attachSignature: false });
  const [signature, setSignature] = useState<{ id: string; data: string } | null>(null);
  const [creating, setCreating] = useState(false);

  // Load user's signature
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_signatures" as any)
      .select("id, signature_data")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSignature({ id: (data as any).id, data: (data as any).signature_data });
      });
  }, [user]);

  const fetchMemos = async () => {
    if (!org) return;
    const { data } = await supabase
      .from("internal_memos" as any)
      .select("*")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false });
    const items = (data || []) as any[];
    setMemos(items);
    if (items.length) resolve(items.map((m: any) => m.created_by));
    setLoading(false);
  };

  useEffect(() => { fetchMemos(); }, [org]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org) return;
    setCreating(true);
    const { error } = await supabase.from("internal_memos" as any).insert({
      organization_id: org.id,
      created_by: user.id,
      title: form.title,
      content: form.content,
      signature_id: form.attachSignature && signature ? signature.id : null,
      status: "published",
      published_at: new Date().toISOString(),
    } as any);
    if (error) { toast.error("Failed to create memo"); setCreating(false); return; }
    toast.success("Memo published!");
    setDialogOpen(false);
    setForm({ title: "", content: "", attachSignature: false });
    fetchMemos();
    setCreating(false);
  };

  // Load signature for a viewed memo
  const [viewSignatureData, setViewSignatureData] = useState<string | null>(null);
  useEffect(() => {
    if (!viewMemo?.signature_id) { setViewSignatureData(null); return; }
    supabase
      .from("user_signatures" as any)
      .select("signature_data")
      .eq("id", viewMemo.signature_id)
      .single()
      .then(({ data }) => {
        setViewSignatureData(data ? (data as any).signature_data : null);
      });
  }, [viewMemo]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-foreground">Internal Memos & Correspondence</h3>
        <div className="flex gap-2">
          <SignaturePad
            onSaved={(id, data) => setSignature({ id, data })}
            trigger={
              <Button variant="outline" size="sm" className="rounded-xl text-xs">
                <PenLine className="w-3.5 h-3.5 mr-1" /> {signature ? "Edit Signature" : "Set Signature"}
              </Button>
            }
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl bg-accent text-accent-foreground text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" /> New Memo
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Internal Memo</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Memo subject" className="rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="rounded-xl resize-none" rows={6} required />
                </div>
                {signature && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-2">
                      <PenLine className="w-4 h-4 text-accent" />
                      <span className="text-sm text-foreground">Attach your signature</span>
                    </div>
                    <Switch checked={form.attachSignature} onCheckedChange={v => setForm({ ...form, attachSignature: v })} />
                  </div>
                )}
                {form.attachSignature && signature && (
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-2">Signature preview:</p>
                    <img src={signature.data} alt="Your signature" className="h-12 object-contain" />
                  </div>
                )}
                <Button type="submit" disabled={creating} className="w-full rounded-xl bg-accent text-accent-foreground">
                  <Send className="w-4 h-4 mr-1" /> {creating ? "Publishing..." : "Publish Memo"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* View memo dialog */}
      <Dialog open={!!viewMemo} onOpenChange={() => setViewMemo(null)}>
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto max-w-2xl">
          <DialogHeader><DialogTitle>{viewMemo?.title}</DialogTitle></DialogHeader>
          {viewMemo && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>From: {getName(viewMemo.created_by)}</span>
                <span>·</span>
                <span>{format(new Date(viewMemo.created_at), "MMM d, yyyy 'at' HH:mm")}</span>
              </div>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap border-t border-border pt-4">
                {viewMemo.content}
              </div>
              {viewSignatureData && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground mb-1">Signed by {getName(viewMemo.created_by)}</p>
                  <img src={viewSignatureData} alt="Signature" className="h-16 object-contain" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : memos.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No internal memos yet</p>
        </div>
      ) : (
        <AnimatePresence>
          {memos.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
              className="glass-card rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setViewMemo(m)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-foreground text-sm truncate">{m.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-muted-foreground">{getName(m.created_by)}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), "MMM d, yyyy")}</span>
                    {m.signature_id && <Badge variant="outline" className="text-[10px] h-4"><PenLine className="w-2.5 h-2.5 mr-0.5" />Signed</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 rounded-lg">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
};

export default InternalMemos;
