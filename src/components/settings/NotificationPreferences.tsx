import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, Slack, Send } from "lucide-react";
import { toast } from "sonner";

export default function NotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("notification_preferences" as any)
        .select("*").eq("user_id", user.id).maybeSingle();
      if (data) setPrefs(data);
      else setPrefs({
        user_id: user.id, in_app: true, email: false, slack: false, slack_webhook_url: "",
        escalation_after_hours: 24, escalate_to_manager: true,
        event_prefs: {
          cognition_finished: { in_app: true, realtime: true },
          policy_blocked: { in_app: true, realtime: true },
          insight_escalation: { in_app: true, realtime: true },
        },
      });
    })();
  }, [user]);

  const save = async () => {
    if (!user || !prefs) return;
    setSaving(true);
    const { error } = await supabase.from("notification_preferences" as any)
      .upsert({ ...prefs, user_id: user.id }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Preferences saved");
  };

  const test = async () => {
    if (!user) return;
    setTesting(true);
    const { data: prof } = await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
    const { error } = await supabase.from("notifications").insert({
      user_id: user.id,
      organization_id: prof?.organization_id,
      title: "Test alert",
      message: "This is a test notification. If your inbox shows it, in-app delivery works.",
      type: "test", is_read: false,
    } as any);
    if (prefs?.slack && prefs?.slack_webhook_url) {
      try {
        await fetch(prefs.slack_webhook_url, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "Global Office test alert - Slack delivery is wired up." }),
        });
      } catch { /* CORS on some webhooks */ }
    }
    setTesting(false);
    if (error) toast.error(error.message);
    else toast.success("Test sent. Check your inbox" + (prefs?.slack ? " and Slack channel." : "."));
  };

  if (!prefs) return null;

  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Bell className="w-4 h-4 text-accent" /> Notification preferences</CardTitle>
        <CardDescription>Choose where predictive alerts and escalations reach you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Row icon={<Bell className="w-4 h-4" />} label="In-app inbox" hint="Always recommended; powers the Alerts Inbox.">
          <Switch checked={prefs.in_app} onCheckedChange={v => setPrefs({ ...prefs, in_app: v })} />
        </Row>
        <Row icon={<Mail className="w-4 h-4" />} label="Email" hint="Delivered to your sign-in email address.">
          <Switch checked={prefs.email} onCheckedChange={v => setPrefs({ ...prefs, email: v })} />
        </Row>
        <Row icon={<Slack className="w-4 h-4" />} label="Slack" hint="Post to a Slack channel via incoming webhook.">
          <Switch checked={prefs.slack} onCheckedChange={v => setPrefs({ ...prefs, slack: v })} />
        </Row>
        {prefs.slack && (
          <div className="pl-6 space-y-1">
            <Label className="text-xs">Slack incoming webhook URL</Label>
            <Input value={prefs.slack_webhook_url ?? ""} onChange={e => setPrefs({ ...prefs, slack_webhook_url: e.target.value })}
              placeholder="https://hooks.slack.com/services/..." className="rounded-xl" />
          </div>
        )}
        <div className="border-t border-border pt-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Event alerts</p>
            <p className="text-xs text-muted-foreground mb-3">Choose which events land in your inbox and which pop as realtime toasts.</p>
            <div className="rounded-xl border border-border divide-y divide-border/60">
              {[
                { key: "cognition_finished", label: "Cognition finished", hint: "Leadership completes a deliberation you triggered." },
                { key: "policy_blocked", label: "Blocked by policy", hint: "A deliberation is halted by a blocking governance policy." },
                { key: "insight_escalation", label: "Insight escalation", hint: "An AI insight is escalated to a manager or executive." },
              ].map((row) => {
                const ev = prefs.event_prefs?.[row.key] ?? { in_app: true, realtime: true };
                const setEv = (patch: any) => setPrefs({
                  ...prefs,
                  event_prefs: { ...(prefs.event_prefs ?? {}), [row.key]: { ...ev, ...patch } },
                });
                return (
                  <div key={row.key} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.hint}</p>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Switch checked={!!ev.in_app} onCheckedChange={(v) => setEv({ in_app: v })} />
                      In-app
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Switch checked={!!ev.realtime} onCheckedChange={(v) => setEv({ realtime: v })} />
                      Realtime
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Escalate open alerts</p>
              <p className="text-xs text-muted-foreground">Ping a manager when an alert stays open past the window.</p>
            </div>
            <Switch checked={prefs.escalate_to_manager} onCheckedChange={v => setPrefs({ ...prefs, escalate_to_manager: v })} />
          </div>
          <div>
            <Label className="text-xs">Escalation window</Label>
            <Select value={String(prefs.escalation_after_hours)} onValueChange={v => setPrefs({ ...prefs, escalation_after_hours: Number(v) })}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[4, 8, 12, 24, 48, 72].map(h => <SelectItem key={h} value={String(h)}>{h} hours</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={save} disabled={saving} className="rounded-xl bg-accent text-accent-foreground">{saving ? "Saving..." : "Save preferences"}</Button>
          <Button variant="outline" onClick={test} disabled={testing} className="rounded-xl">
            <Send className="w-3.5 h-3.5 mr-1" /> {testing ? "Sending..." : "Send test alert"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ icon, label, hint, children }: { icon: React.ReactNode; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-2">
        <div className="text-muted-foreground mt-0.5">{icon}</div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}