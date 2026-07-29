import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Shield, Plus, Trash2, Gauge, Activity, AlertTriangle } from "lucide-react";

interface Policy {
  id: string;
  category: string;
  title: string;
  rule: string;
  severity: string;
  is_active: boolean;
}

interface Scorecard {
  window_days?: number;
  deliberations_total?: number;
  feedback_approved?: number;
  feedback_revised?: number;
  feedback_rejected?: number;
  approval_rate?: number | null;
  avg_latency_ms?: number;
  active_policies?: number;
  memory_entries?: number;
  high_risk_decisions?: number;
  compliance_flags?: number;
  error?: string;
}

export default function GovernancePanel({ onSelectRequest }: { onSelectRequest?: (id: string) => void }) {
  const { org } = useOrganization();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [scorecard, setScorecard] = useState<Scorecard>({});
  const [recent, setRecent] = useState<Array<{ id: string; request: string; created_at: string; outcome: any }>>([]);
  const [form, setForm] = useState({ category: "risk", title: "", rule: "", severity: "advisory" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!org?.id) return;
    const [p, s, r] = await Promise.all([
      supabase.from("cognition_policies").select("*").eq("organization_id", org.id).order("created_at", { ascending: false }),
      supabase.rpc("cognition_governance_scorecard", { _org: org.id, _days: 30 }),
      supabase.from("cognition_requests").select("id, request, created_at, outcome").eq("organization_id", org.id).eq("status", "completed").order("created_at", { ascending: false }).limit(10),
    ]);
    setPolicies((p.data as Policy[]) ?? []);
    setScorecard((s.data as Scorecard) ?? {});
    setRecent((r.data as any[]) ?? []);
  };

  useEffect(() => { load(); }, [org?.id]);

  const addPolicy = async () => {
    if (!org?.id || !form.title.trim() || !form.rule.trim()) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("cognition_policies").insert({
      organization_id: org.id, category: form.category, title: form.title.trim(),
      rule: form.rule.trim(), severity: form.severity, created_by: u.user!.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Could not save policy", description: error.message, variant: "destructive" }); return; }
    setForm({ category: "risk", title: "", rule: "", severity: "advisory" });
    load();
  };

  const togglePolicy = async (p: Policy) => {
    await supabase.from("cognition_policies").update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  };

  const removePolicy = async (id: string) => {
    await supabase.from("cognition_policies").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric icon={<Activity className="w-4 h-4" />} label="Deliberations (30d)" value={scorecard.deliberations_total ?? 0} />
        <Metric icon={<Gauge className="w-4 h-4" />} label="Approval rate"
          value={scorecard.approval_rate == null ? "—" : `${scorecard.approval_rate}%`} />
        <Metric icon={<AlertTriangle className="w-4 h-4" />} label="High-risk decisions" value={scorecard.high_risk_decisions ?? 0} />
        <Metric icon={<Shield className="w-4 h-4" />} label="Active policies" value={scorecard.active_policies ?? 0} />
      </div>

      <div className="glass-card-strong rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" />
          <h2 className="font-semibold">Governance policies</h2>
          <span className="text-xs text-muted-foreground ml-auto">Guardrails every deliberation must respect</span>
        </div>
        <div className="grid md:grid-cols-4 gap-2">
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="text-sm bg-background border border-input rounded-md px-3 py-2">
            <option value="risk">Risk</option>
            <option value="compliance">Compliance</option>
            <option value="finance">Finance</option>
            <option value="brand">Brand</option>
            <option value="hr">People</option>
            <option value="security">Security</option>
            <option value="general">General</option>
          </select>
          <Input placeholder="Policy title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="md:col-span-2" />
          <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
            className="text-sm bg-background border border-input rounded-md px-3 py-2">
            <option value="advisory">Advisory</option>
            <option value="blocking">Blocking</option>
          </select>
        </div>
        <Textarea placeholder="Rule the leadership must respect (e.g. 'Never approve marketing spend above $25k without CFO sign-off')."
          value={form.rule} onChange={(e) => setForm({ ...form, rule: e.target.value })} className="min-h-[80px] bg-background/60" />
        <div className="flex justify-end">
          <Button size="sm" onClick={addPolicy} disabled={saving || !form.title.trim() || !form.rule.trim()} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add policy
          </Button>
        </div>
        <div className="divide-y divide-border">
          {policies.length === 0 && <p className="text-sm text-muted-foreground py-3">No policies yet. Add your first guardrail above.</p>}
          {policies.map((p) => (
            <div key={p.id} className="py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground text-sm">{p.title}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{p.category}</Badge>
                  <Badge variant={p.severity === "blocking" ? "destructive" : "outline"} className="text-[10px] capitalize">{p.severity}</Badge>
                  {!p.is_active && <Badge variant="outline" className="text-[10px]">Paused</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.rule}</p>
              </div>
              <button onClick={() => togglePolicy(p)} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
                {p.is_active ? "Pause" : "Activate"}
              </button>
              <button onClick={() => removePolicy(p.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          <h2 className="font-semibold">Recent decisions — click to audit</h2>
        </div>
        <div className="space-y-1">
          {recent.length === 0 && <p className="text-sm text-muted-foreground">No completed deliberations yet.</p>}
          {recent.map((r) => (
            <button key={r.id} onClick={() => onSelectRequest?.(r.id)}
              className="w-full text-left rounded-lg px-3 py-2 hover:bg-muted/50 transition">
              <div className="text-sm text-foreground truncate">{r.request}</div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                <span>{new Date(r.created_at).toLocaleString()}</span>
                {r.outcome?.risk && /high|critical|severe/i.test(r.outcome.risk) && (
                  <Badge variant="destructive" className="text-[10px] py-0 h-4">High risk</Badge>
                )}
                {Array.isArray(r.outcome?.policy_checks) && r.outcome.policy_checks.some((c: any) => c.status === "violation") && (
                  <Badge variant="destructive" className="text-[10px] py-0 h-4">Policy violation</Badge>
                )}
                {Array.isArray(r.outcome?.policy_checks) && r.outcome.policy_checks.some((c: any) => c.status === "caution") && (
                  <Badge variant="outline" className="text-[10px] py-0 h-4">Caution</Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">{icon}{label}</div>
      <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
    </div>
  );
}