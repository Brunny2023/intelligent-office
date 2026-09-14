import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useUserRole } from "@/hooks/useUserRole";
import { stepsForRole, type RoleStep } from "@/lib/roleNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, ArrowRight, Sparkles } from "lucide-react";

type ResolvedStep = RoleStep & { done: boolean };

const ROLE_TITLE: Record<string, string> = {
  owner: "Set up your organization",
  executive: "Set up your executive view",
  manager: "Set up your team's workspace",
  staff: "Get started in Intelligent Office",
  contractor: "Get started on your engagement",
  auditor: "Set up your audit workspace",
};

export default function OnboardingChecklist() {
  const { org, profile } = useOrganization();
  const { role, loading: roleLoading } = useUserRole();
  const [steps, setSteps] = useState<ResolvedStep[] | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!org?.id || !profile?.id || roleLoading) return;
    const key = `onboarding-dismissed-${org.id}-${profile.id}`;
    if (localStorage.getItem(key) === "1") { setDismissed(true); return; }

    (async () => {
      const dayStart = new Date(new Date().toDateString()).toISOString();
      const [members, tasks, kpis, docs, channels, workflows, myTasks, myPlans, myClock, activity] = await Promise.all([
        supabase.from("profiles").select("id", { head: true, count: "exact" }).eq("organization_id", org.id),
        supabase.from("tasks").select("id", { head: true, count: "exact" }).eq("organization_id", org.id),
        supabase.from("kpis").select("id", { head: true, count: "exact" }).eq("organization_id", org.id),
        supabase.from("documents").select("id", { head: true, count: "exact" }).eq("organization_id", org.id),
        supabase.from("channels").select("id", { head: true, count: "exact" }).eq("organization_id", org.id),
        supabase.from("workflows").select("id", { head: true, count: "exact" }).eq("organization_id", org.id),
        supabase.from("tasks").select("id", { head: true, count: "exact" }).eq("organization_id", org.id).eq("assigned_to", profile.id),
        supabase.from("job_plans").select("id", { head: true, count: "exact" }).eq("organization_id", org.id).eq("user_id", profile.id),
        supabase.from("attendance_records").select("id", { head: true, count: "exact" }).eq("user_id", profile.id).gte("clock_in", dayStart),
        supabase.from("activity_logs").select("id", { head: true, count: "exact" }).eq("organization_id", org.id),
      ]);

      const signals: Record<RoleStep["signal"], boolean> = {
        branding: !!(org.logo_url && org.mission),
        team: (members.count || 0) > 1,
        kpis: (kpis.count || 0) > 0,
        tasks: (tasks.count || 0) > 0,
        channels: (channels.count || 0) > 0,
        docs: (docs.count || 0) > 0,
        workflows: (workflows.count || 0) > 0,
        profile: !!(profile.job_title && profile.avatar_url),
        clockedIn: (myClock.count || 0) > 0,
        myTasks: (myTasks.count || 0) > 0,
        myPlan: (myPlans.count || 0) > 0,
        reviewedActivity: (activity.count || 0) > 0,
      };

      setSteps(stepsForRole(role).map((s) => ({ ...s, done: signals[s.signal] })));
    })();
  }, [org?.id, org?.logo_url, org?.mission, profile?.id, profile?.job_title, profile?.avatar_url, role, roleLoading]);

  if (dismissed || !steps || steps.length === 0) return null;
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  if (done === steps.length) return null;

  return (
    <Card className="mb-6 border-svo-gold/30 bg-gradient-to-br from-svo-gold/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-svo-gold" />
            {ROLE_TITLE[role || "staff"] || ROLE_TITLE.staff}
          </CardTitle>
          <button
            onClick={() => {
              if (org?.id && profile?.id) localStorage.setItem(`onboarding-dismissed-${org.id}-${profile.id}`, "1");
              setDismissed(true);
            }}
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
