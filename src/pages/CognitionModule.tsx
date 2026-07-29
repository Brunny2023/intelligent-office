import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Brain, Crown, Users, Building2, Sparkles, Send, Loader2, ChevronRight, BookOpen } from "lucide-react";

interface Executive { id: string; role: string; title: string; mandate: string | null; tone: string | null; is_active: boolean; }
interface Consultant { id: string; domain: string; title: string; expertise: string | null; is_active: boolean; reporting_executive_id: string | null; }
interface Department { id: string; name: string; charter: string | null; consultant_id: string | null; is_active: boolean; }
interface RequestRow { id: string; request: string; intent: string | null; status: string; outcome: any; created_at: string; latency_ms: number | null; }

export default function CognitionModule() {
  const { org } = useOrganization();
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [targetDept, setTargetDept] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [trace, setTrace] = useState<any | null>(null);

  const load = async () => {
    if (!org?.id) return;
    const [e, c, d, r, m] = await Promise.all([
      supabase.from("ai_executives").select("*").eq("organization_id", org.id).order("role"),
      supabase.from("ai_consultants").select("*").eq("organization_id", org.id).order("domain"),
      supabase.from("ai_departments").select("*").eq("organization_id", org.id).order("name"),
      supabase.from("cognition_requests").select("*").eq("organization_id", org.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("organizational_memory").select("id", { count: "exact", head: true }).eq("organization_id", org.id),
    ]);
    setExecutives((e.data as Executive[]) ?? []);
    setConsultants((c.data as Consultant[]) ?? []);
    setDepartments((d.data as Department[]) ?? []);
    setRequests((r.data as RequestRow[]) ?? []);
    setMemoryCount((m.count as number) ?? 0);
  };

  useEffect(() => { load(); }, [org?.id]);

  const toggleExec = async (row: Executive) => {
    await supabase.from("ai_executives").update({ is_active: !row.is_active }).eq("id", row.id);
    load();
  };

  const runDeliberation = async () => {
    if (!prompt.trim()) return;
    setRunning(true);
    setTrace(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cognition-deliberate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ request: prompt.trim(), targetDepartmentId: targetDept || null }),
      });
      const data = await res.json();
      if (data.error) {
        toast({ title: "Deliberation failed", description: data.error, variant: "destructive" });
      } else {
        setTrace(data);
        setActiveRequestId(data.request_id);
        setPrompt("");
        load();
      }
    } catch (err) {
      toast({ title: "Network error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const openHistoric = async (r: RequestRow) => {
    setActiveRequestId(r.id);
    setTrace({ request_id: r.id, ...r.outcome });
  };

  return (
    <AppLayout title="Cognition Center">
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Brain className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Enterprise Cognition</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your organization's virtual leadership, consultants, and departments — reasoning, planning, and remembering on your own knowledge.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-xs text-muted-foreground">Organizational memory</span>
            <span className="text-2xl font-bold text-accent">{memoryCount}</span>
          </div>
        </motion.div>

        <Tabs defaultValue="deliberations" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="deliberations" className="gap-1.5"><Sparkles className="w-4 h-4" /> Deliberations</TabsTrigger>
            <TabsTrigger value="executives" className="gap-1.5"><Crown className="w-4 h-4" /> Executive Team</TabsTrigger>
            <TabsTrigger value="consultants" className="gap-1.5"><Users className="w-4 h-4" /> Consultants</TabsTrigger>
            <TabsTrigger value="departments" className="gap-1.5"><Building2 className="w-4 h-4" /> Departments</TabsTrigger>
          </TabsList>

          <TabsContent value="deliberations" className="space-y-4">
            <div className="glass-card-strong rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <h2 className="font-semibold">Ask your virtual leadership</h2>
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe a decision, initiative, or problem. Your AI executives will deliberate, a consultant will recommend, and a department will own execution."
                className="min-h-[110px] bg-background/60"
              />
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <select value={targetDept} onChange={(e) => setTargetDept(e.target.value)}
                  className="text-sm bg-background border border-input rounded-md px-3 py-2 max-w-xs">
                  <option value="">Route to best-fit department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <Button onClick={runDeliberation} disabled={running || !prompt.trim()} className="gap-2">
                  {running ? <><Loader2 className="w-4 h-4 animate-spin" /> Deliberating…</> : <><Send className="w-4 h-4" /> Run deliberation</>}
                </Button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {trace && (
                <motion.div key={activeRequestId ?? "trace"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="glass-card rounded-2xl p-5 space-y-4">
                  {trace.intent && (
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Intent</div>
                      <p className="text-sm text-foreground">{trace.intent}</p>
                    </div>
                  )}
                  {Array.isArray(trace.executive_deliberation) && trace.executive_deliberation.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Executive deliberation</div>
                      <div className="grid md:grid-cols-2 gap-2">
                        {trace.executive_deliberation.map((e: any, i: number) => (
                          <div key={i} className="border-l-2 border-accent/50 pl-3 py-1">
                            <div className="text-xs font-semibold text-accent uppercase">{e.role}</div>
                            <p className="text-sm text-foreground/90 mt-1">{e.position}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {trace.consultant && (
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Consultant · {trace.consultant.domain}</div>
                      <p className="text-sm text-foreground/90">{trace.consultant.recommendation}</p>
                    </div>
                  )}
                  {trace.department && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-accent border-accent/40">{trace.department.name}</Badge>
                      <span className="text-muted-foreground">{trace.department.rationale}</span>
                    </div>
                  )}
                  {Array.isArray(trace.execution_plan) && trace.execution_plan.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Execution plan</div>
                      <ol className="space-y-2">
                        {trace.execution_plan.map((s: any, i: number) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold shrink-0">{s.step ?? i + 1}</span>
                            <div>
                              <div className="font-medium text-foreground">{s.action}</div>
                              <div className="text-xs text-muted-foreground">Owner: {s.owner} · Success: {s.success_criteria}</div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  <div className="grid md:grid-cols-3 gap-3 pt-2 border-t border-border">
                    {trace.risk && <FactBox label="Risk" value={trace.risk} />}
                    {trace.compliance && <FactBox label="Compliance" value={trace.compliance} />}
                    {trace.financial_impact && <FactBox label="Financial impact" value={trace.financial_impact} />}
                  </div>
                  {trace.decision_summary && (
                    <div className="rounded-xl bg-accent/5 border border-accent/20 p-4">
                      <div className="text-[10px] uppercase tracking-widest text-accent mb-1">CEO decision</div>
                      <p className="text-sm text-foreground">{trace.decision_summary}</p>
                    </div>
                  )}
                  {Array.isArray(trace.follow_ups) && trace.follow_ups.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {trace.follow_ups.map((f: string, i: number) => (
                        <button key={i} onClick={() => setPrompt(f)} className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 text-muted-foreground">
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> Recent deliberations</h3>
              <div className="space-y-1">
                {requests.length === 0 && <p className="text-sm text-muted-foreground">No deliberations yet. Ask your leadership above.</p>}
                {requests.map((r) => (
                  <button key={r.id} onClick={() => openHistoric(r)}
                    className={`w-full text-left flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition ${activeRequestId === r.id ? "bg-muted/60" : ""}`}>
                    <ChevronRight className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground truncate">{r.request}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <span>{new Date(r.created_at).toLocaleString()}</span>
                        <Badge variant="outline" className="text-[10px] py-0 h-4">{r.status}</Badge>
                        {r.latency_ms && <span>{Math.round(r.latency_ms / 100) / 10}s</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="executives">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {executives.map((e) => (
                <div key={e.id} className={`glass-card rounded-xl p-4 border ${e.is_active ? "border-accent/30" : "border-border opacity-70"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-accent">{e.role}</div>
                      <div className="font-semibold text-foreground">{e.title}</div>
                    </div>
                    <button onClick={() => toggleExec(e)} className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${e.is_active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                      {e.is_active ? "Active" : "Paused"}
                    </button>
                  </div>
                  {e.mandate && <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{e.mandate}</p>}
                  {e.tone && <p className="text-[10px] mt-2 italic text-muted-foreground">Tone: {e.tone}</p>}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="consultants">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {consultants.map((c) => (
                <div key={c.id} className="glass-card rounded-xl p-4">
                  <div className="text-[10px] uppercase tracking-widest text-accent">{c.domain.replace(/_/g, " ")}</div>
                  <div className="font-semibold text-foreground">{c.title}</div>
                  {c.expertise && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{c.expertise}</p>}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="departments">
            <div className="grid sm:grid-cols-2 gap-3">
              {departments.map((d) => (
                <div key={d.id} className="glass-card rounded-xl p-4">
                  <div className="font-semibold text-foreground">{d.name}</div>
                  {d.charter && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{d.charter}</p>}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function FactBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <p className="text-xs text-foreground/90 leading-relaxed">{value}</p>
    </div>
  );
}