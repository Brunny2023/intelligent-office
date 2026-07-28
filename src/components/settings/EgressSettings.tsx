import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Video } from "lucide-react";
import { toast } from "sonner";

interface Props { organizationId: string; }

export default function EgressSettings({ organizationId }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<"audio_video" | "audio_only">("audio_video");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("organizations")
        .select("egress_enabled, egress_mode").eq("id", organizationId).maybeSingle();
      if (data) {
        setEnabled(!!data.egress_enabled);
        setMode((data.egress_mode as "audio_video" | "audio_only") ?? "audio_video");
      }
      setLoading(false);
    })();
  }, [organizationId]);

  const save = async (next: { enabled?: boolean; mode?: "audio_video" | "audio_only" }) => {
    setSaving(true);
    const payload = {
      egress_enabled: next.enabled ?? enabled,
      egress_mode: next.mode ?? mode,
    };
    const { error } = await supabase.from("organizations").update(payload).eq("id", organizationId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (next.enabled !== undefined) setEnabled(next.enabled);
    if (next.mode !== undefined) setMode(next.mode);
    toast.success("Meeting recording settings updated");
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Video className="w-5 h-5" /> Cloud Meeting Recording</CardTitle>
        <CardDescription>
          Route recordings through LiveKit Cloud Egress so meetings keep recording even if the host closes their tab or drops off the call.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Server-side recording (LiveKit Egress)</Label>
            <p className="text-xs text-muted-foreground mt-1">
              When on, recordings run on our servers and upload directly to the recordings bucket.
            </p>
          </div>
          <Switch checked={enabled} disabled={saving} onCheckedChange={(v) => save({ enabled: v })} />
        </div>

        <div className={enabled ? "" : "opacity-60 pointer-events-none"}>
          <Label className="text-sm font-medium mb-2 block">Recording mode</Label>
          <RadioGroup value={mode} onValueChange={(v) => save({ mode: v as "audio_video" | "audio_only" })} className="grid gap-2">
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="audio_video" className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">Audio + video composite</div>
                <div className="text-xs text-muted-foreground">Full room grid, MP4 output. Best for playback and richer AI.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="audio_only" className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">Audio only</div>
                <div className="text-xs text-muted-foreground">OGG output, lower cost, transcript & summary only.</div>
              </div>
            </label>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}