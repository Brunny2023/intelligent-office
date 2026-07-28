import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";

interface Props { ownerOrgId: string; partnerOrgId: string; userId: string }

export default function DocumentShareDialog({ ownerOrgId, partnerOrgId, userId }: Props) {
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [docId, setDocId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [d, s] = await Promise.all([
      supabase.from("documents").select("id, title").eq("organization_id", ownerOrgId).order("created_at", { ascending: false }).limit(100),
      supabase.from("document_shares" as any).select("*").eq("owner_org_id", ownerOrgId).eq("partner_org_id", partnerOrgId).eq("status", "active"),
    ]);
    setDocs((d.data ?? []) as any[]);
    setShares((s.data ?? []) as any[]);
  };

  useEffect(() => { if (open) load(); }, [open, ownerOrgId, partnerOrgId]);

  const grant = async () => {
    if (!docId) return;
    setSaving(true);
    const { error } = await supabase.from("document_shares" as any).insert({
      owner_org_id: ownerOrgId, partner_org_id: partnerOrgId, document_id: docId, granted_by: userId, status: "active",
    } as any);
    setSaving(false);
    if (error) toast.error(error.message.includes("duplicate") ? "Already shared" : error.message);
    else { toast.success("Document shared"); setDocId(""); load(); }
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("document_shares" as any).update({ status: "revoked" } as any).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Access revoked - propagated immediately"); load(); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl text-xs">
          <FileText className="w-3.5 h-3.5 mr-1" /> Documents
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-accent" /> Share documents with partner</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Grants read-only access to the selected document. Revoke at any time - access disappears instantly on the partner side.
          </p>
          <div>
            <Label className="text-xs">Document</Label>
            <Select value={docId} onValueChange={setDocId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pick a document" /></SelectTrigger>
              <SelectContent>
                {docs.length === 0 ? <SelectItem value="_none" disabled>No documents</SelectItem> :
                  docs.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={grant} disabled={saving || !docId} className="w-full rounded-xl bg-accent text-accent-foreground">
            {saving ? "Sharing..." : "Share document"}
          </Button>
          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-foreground mb-2">Active shares</p>
            {shares.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing shared yet.</p>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {shares.map(s => {
                  const title = docs.find(d => d.id === s.document_id)?.title || s.document_id.slice(0, 8);
                  return (
                    <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                      <Badge variant="outline" className="text-[10px]">doc</Badge>
                      <span className="text-xs text-foreground truncate flex-1">{title}</span>
                      <Button size="icon" variant="ghost" onClick={() => revoke(s.id)} className="h-7 w-7">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}