import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, ArrowRight, Sparkles } from "lucide-react";

type Step = { key: string; label: string; hint: string; path: string; done: boolean };

export default function OnboardingChecklist() {
  const { org, profile } = useOrganization();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!org?.id) return;
    if (localStorage.getItem(`onboarding-dismissed-${org.id}`) === "1") { setDismissed(true); return; }
    (async () => {
      const [members, tasks, kpis, docs, channels, workflows] = await Promise.all([
        supabase.from("profiles").select("id", { head: true, count: "exact" }).eq("organization_id", org.id),
        supabase.from("tasks").select("id", { head: true, count: "exact" }).eq("organization_id", org.id),
        supabase.from("kpis").select("id", { head: true, count: "exact" }).eq("organization_id", org.id),
        supabase.from("documents").select("id", { head: true, count: "exact" }).eq("organization_id", org.id),
        supabase.from("channels").select("id", { head: true, count: "exact" }).eq("organization_id", org.id),
        supabase.from("workflows").select("id", { head: true, count: "exact" }).eq("organization_id", org.id),
      ]);
      const brandingDone = !!(org.logo_url && org.mission);
      setSteps([
        { key: "brand", label: "Complete organization branding", hint: "Add your logo and mission", path: "/settings", done: brandingDone },
        { key: "team", label: "Invite your team", hint: "Bring at least one teammate on board", path: "/team", done: (members.count || 0) > 1 },
        { key: "kpis", label: "Define your first KPI", hint: "Set a target for the intelligence layer to track", path: "/intelligence", done: (kpis.count || 0) > 0 },
        { key: "tasks", label: "Create a task or project", hint: "Kick off the execution engine", path: "/execution", done: (tasks.count || 0) > 0 },
        { key: "channel", label: "Open a communication channel", hint: "Where the team talks", path: "/messages", done: (channels.count || 0) > 0 },
        { key: "docs", label: "Upload a working document", hint: "Populate the knowledge base", path: "/documents", done: (docs.count || 0) > 0 },
        { key: "workflow", label: "Automate one workflow", hint: "Let AI handle a repetitive task", path: "/workflows", done: (workflows.count || 0) > 0 },
      ]);
    })();
  }, [org?.id, org?.logo_url, org?.mission, profile?.id]);

  if (dismissed || !steps) return null;
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  if (done === steps.length) return null;

  return (
    <Card className="mb-6 border-svo-gold/30 bg-gradient-to-br from-svo-gold/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-svo-gold" />
            Get Global Office production-ready
          </CardTitle>
          <button
            onClick={() => { localStorage.setItem(`onboarding-dismissed-${org?.id}`, "1"); setDismissed(true); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >Dismiss</button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-svo-gold transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{done}/{steps.length}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-border">
          {steps.map((s) => (
            <li key={s.key}>
              <Link to={s.path} className="flex items-center gap-3 py-2.5 hover:bg-muted/40 rounded-md px-2 -mx-2 group">
                {s.done
                  ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  : <Circle className="w-5 h-5 text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${s.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{s.label}</div>
                  {!s.done && <div className="text-xs text-muted-foreground">{s.hint}</div>}
                </div>
                {!s.done && <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}