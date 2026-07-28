import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, CheckCircle2, FileText, ListChecks, Languages } from "lucide-react";
import { toast } from "sonner";

interface Props {
  recordingId: string;
  onDone?: () => void;
}

export default function PostMeetingPanel({ recordingId, onDone }: Props) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [picked, setPicked] = useState<Record<number, boolean>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from("meeting_transcripts").select("*").eq("recording_id", recordingId).order("created_at",{ascending:false}).limit(1).maybeSingle(),
      supabase.from("meeting_summaries").select("*").eq("recording_id", recordingId).order("created_at",{ascending:false}).limit(1).maybeSingle(),
    ]);
    setTranscript(t); setSummary(s);
    const items = (s?.action_items as any[]) ?? [];
    setPicked(Object.fromEntries(items.map((_, i) => [i, true])));
    setLoading(false);
  };

  useEffect(() => { load(); }, [recordingId]);

  const runAnalysis = async () => {
    setProcessing(true);
    const { error, data } = await supabase.functions.invoke("meeting-analyze", {
      body: { mode: "full", recording_id: recordingId },
    });
    setProcessing(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error ?? error?.message ?? "Analysis failed"); return; }
    toast.success("Transcribed & summarized");
    load();
  };

  const pushTasks = async () => {
    const indexes = Object.entries(picked).filter(([_, v]) => v).map(([k]) => Number(k));
    if (!indexes.length) { toast.error("Pick at least one action item"); return; }
    setProcessing(true);
    const { data, error } = await supabase.functions.invoke("meeting-analyze", {
      body: { mode: "push_tasks", recording_id: recordingId, indexes },
    });
    setProcessing(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error ?? error?.message ?? "Failed"); return; }
    toast.success(`Created ${(data as any).created} task(s)`);
    onDone?.();
  };

  const translate = async (target: string) => {
    setProcessing(true);
    const { data, error } = await supabase.functions.invoke("meeting-analyze", {
      body: { mode: "translate", recording_id: recordingId, target_lang: target },
    });
    setProcessing(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error ?? error?.message ?? "Translate failed"); return; }
    toast.success(`Translated to ${target}`);
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  const items: any[] = summary?.action_items ?? [];

  return (
    <div className="space-y-4">
      {!transcript && (
        <div className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Recording is uploaded but not yet analyzed.</div>
          <Button onClick={runAnalysis} disabled={processing} className="rounded-xl bg-svo-blue text-white">
            {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Transcribe & Summarize
          </Button>
        </div>
      )}

      {transcript && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold"><FileText className="w-4 h-4" /> Transcript
            {transcript.language && <Badge variant="outline" className="ml-1 text-[10px]"><Languages className="w-3 h-3 mr-1" />{transcript.language}</Badge>}
          </div>
          <div className="max-h-40 overflow-y-auto text-sm text-muted-foreground whitespace-pre-wrap">{transcript.full_text}</div>
        </div>
      )}

      {summary && (
        <>
          <div className="glass-card rounded-xl p-4 space-y-2">
            <div className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> Summary</div>
            <p className="text-sm text-muted-foreground">{summary.summary}</p>
            {summary.sentiment && <Badge variant="outline" className="text-[10px]">Sentiment: {summary.sentiment}</Badge>}
            <div className="flex gap-2 pt-1">
              {["en","es","fr","de","zh","ar","hi","yo"].map(l => (
                <button key={l} disabled={processing} onClick={() => translate(l)}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-border hover:bg-muted/50 disabled:opacity-50">{l}</button>
              ))}
            </div>
            {summary.translated_summary && Object.entries(summary.translated_summary as any).map(([lang, v]: any) => (
              <div key={lang} className="mt-2 pt-2 border-t border-border/50">
                <Badge variant="outline" className="text-[10px] mb-1"><Languages className="w-3 h-3 mr-1" />{lang}</Badge>
                <p className="text-sm text-muted-foreground">{v?.summary}</p>
              </div>
            ))}
          </div>
          {(summary.key_decisions ?? []).length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <div className="text-sm font-semibold mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Key Decisions</div>
              <ul className="list-disc pl-5 text-sm space-y-1">{(summary.key_decisions as string[]).map((d, i) => <li key={i}>{d}</li>)}</ul>
            </div>
          )}
          {items.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold flex items-center gap-2"><ListChecks className="w-4 h-4 text-svo-blue" /> Action Items</div>
                <Button size="sm" onClick={pushTasks} disabled={processing} className="rounded-lg h-8 bg-accent text-accent-foreground">
                  {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Push to tasks"}
                </Button>
              </div>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <label key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40 cursor-pointer">
                    <Checkbox checked={picked[i] ?? false} onCheckedChange={(v) => setPicked({ ...picked, [i]: !!v })} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{it.title}</div>
                      {it.description && <div className="text-xs text-muted-foreground">{it.description}</div>}
                      <div className="flex gap-1 mt-1">
                        {it.assignee_hint && <Badge variant="outline" className="text-[10px]">{it.assignee_hint}</Badge>}
                        {it.due_hint && <Badge variant="outline" className="text-[10px]">due {it.due_hint}</Badge>}
                        {it.priority && <Badge variant="outline" className="text-[10px]">{it.priority}</Badge>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}