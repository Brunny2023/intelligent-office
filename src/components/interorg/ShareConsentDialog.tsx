import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props { ownerOrgId: string; partnerOrgId: string; userId: string }

/**
 * Explicit consent surface for Partner Connect: an owner-org exec can grant
 * a partner org read access to selected KPIs or AI insights. Consents live in
 * `org_share_consents` (RLS: either party can read; only owner/exec writes).
 */
export default function ShareConsentDialog({ ownerOrgId, partnerOrgId, userId }: Props) {
  const [open, setOpen] = useState(false);
  const [consents, setConsents] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [shareType, setShareType] = useState<"kpi" | "insight">("kpi");
  const [resourceId, setResourceId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [c, k, i] = await Promise.all([
      supabase.from("org_share_consents" as any).select("*")
        .eq("owner_org_id", ownerOrgId).eq("partner_org_id", partnerOrgId).eq("status", "active"),
      supabase.from("kpis").select("id, title").eq("organization_id", ownerOrgId).limit(50),
      supabase.from("ai_insights").select("id, title").eq("organization_id", ownerOrgId).order("generated_at", { ascending: false }).limit(50),
    ]);
    setConsents((c.data ?? []) as any[]);
    setKpis((k.data ?? []) as any[]);
    setInsights((i.data ?? []) as any[]);
  };

  useEffect(() => { if (open) load(); }, [open, ownerOrgId, partnerOrgId]);

  const grant = async () => {
    if (!resourceId) { toast.error("Pick a resource"); return; }
    setSaving(true);
    const { error } = await supabase.from("org_share_consents" as any).insert({
      owner_org_id: ownerOrgId, partner_org_id: partnerOrgId,
      share_type: shareType, resource_id: resourceId, granted_by: userId, status: "active",
    } as any);
    setSaving(false);
    if (error) { toast.error(error.message.includes("duplicate") ? "Already shared" : error.message); return; }
    toast.success("Consent granted");
    setResourceId("");
    load();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("org_share_consents" as any)
      .update({ status: "revoked" } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Access revoked");
    load();
  };

  const options = shareType === "kpi" ? kpis : insights;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl text-xs">
          <Share2 className="w-3.5 h-3.5 mr-1" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-accent" /> Intelligence sharing consent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Explicitly grant this partner org read access to a specific KPI or AI insight.
            Only owners and executives can grant; either side can view; revoke at any time.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <Label className="text-xs">Type</Label>
              <Select value={shareType} onValueChange={(v: any) => { setShareType(v); setResourceId(""); }}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kpi">KPI</SelectItem>
                  <SelectItem value="insight">AI Insight</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Resource</Label>
              <Select value={resourceId} onValueChange={setResourceId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pick one" /></SelectTrigger>
                <SelectContent>
                  {options.length === 0 ? <SelectItem value="_none" disabled>None available</SelectItem> :
                    options.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={grant} disabled={saving || !resourceId} className="w-full rounded-xl bg-accent text-accent-foreground">
            {saving ? "Granting..." : "Grant consent"}
          </Button>

          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-foreground mb-2">Active shares</p>
            {consents.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing shared yet.</p>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {consents.map(c => {
                  const name = (c.share_type === "kpi" ? kpis : insights).find((x: any) => x.id === c.resource_id)?.title || c.resource_id.slice(0, 8);
                  return (
                    <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                      <Badge variant="outline" className="text-[10px]">{c.share_type}</Badge>
                      <span className="text-xs text-foreground truncate flex-1">{name}</span>
                      <Button size="icon" variant="ghost" onClick={() => revoke(c.id)} className="h-7 w-7">
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