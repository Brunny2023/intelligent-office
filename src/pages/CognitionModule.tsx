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
import { Brain, Crown, Users, Building2, Sparkles, Send, Loader2, ChevronRight, BookOpen, CheckSquare, ThumbsUp, ThumbsDown, MessageSquare, Shield, ShieldCheck, ShieldAlert, Activity, Search as SearchIcon, TrendingUp, TrendingDown, Trash2, Check, X, History } from "lucide-react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import GovernancePanel from "@/components/cognition/GovernancePanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface Executive { id: string; role: string; title: string; mandate: string | null; tone: string | null; is_active: boolean; }
interface Consultant { id: string; domain: string; title: string; expertise: string | null; is_active: boolean; reporting_executive_id: string | null; }
interface Department { id: string; name: string; charter: string | null; consultant_id: string | null; is_active: boolean; }
interface RequestRow { id: string; request: string; intent: string | null; status: string; outcome: any; created_at: string; latency_ms: number | null; }
interface MemoryRow { id: string; title: string; content: string; memory_type: string; tags: string[] | null; relevance_score: number | null; last_referenced_at?: string | null; created_at: string; }

export default function CognitionModule() {
  const { org } = useOrganization();
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const [memory, setMemory] = useState<MemoryRow[]>([]);
  const [memoryQuery, setMemoryQuery] = useState("");
  const [memoryComment, setMemoryComment] = useState<Record<string, string>>({});
  const [memorySaving, setMemorySaving] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [targetDept, setTargetDept] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [trace, setTrace] = useState<any | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSaving, setFeedbackSaving] = useState<string | null>(null);
  const [feedbackDone, setFeedbackDone] = useState<Record<string, string>>({});
  const [auditSteps, setAuditSteps] = useState<any[] | null>(null);
  const [activeTab, setActiveTab] = useState("deliberations");
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviewTarget, setReviewTarget] = useState<{ memory: MemoryRow; action: "approve" | "reject" } | null>(null);
  const [reviewReason, setReviewReason] = useState("");

  // Wave 6: honor ?prefill=… so proactive nominations and the Ask Leadership
  // FAB can land the user directly on the composer with the prompt loaded.
  useEffect(() => {
    const pre = searchParams.get("prefill");
    if (pre) {
      setPrompt(pre);
      setActiveTab("deliberations");
      const next = new URLSearchParams(searchParams);
      next.delete("prefill");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

  // Wave-3 gap fix: users had no visibility into what the organization
  // remembers. This surfaces the top memories (relevance-ranked or search).
  const loadMemory = async () => {
    if (!org?.id) return;
    const q = memoryQuery.trim();
    if (q.length > 1) {
      const { data } = await supabase.rpc("search_memory", { _org: org.id, _query: q, _limit: 40 });
      setMemory((data as MemoryRow[]) ?? []);
    } else {
      const { data } = await supabase.from("organizational_memory")
        .select("id, title, content, memory_type, tags, relevance_score, last_referenced_at, created_at")
        .eq("organization_id", org.id)
        .order("relevance_score", { ascending: false })
        .order("last_referenced_at", { ascending: false, nullsFirst: false })
        .limit(40);
      setMemory((data as MemoryRow[]) ?? []);
    }
  };

  useEffect(() => {
    if (activeTab === "memory") loadMemory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, org?.id]);

  const logMemoryEvent = async (m: MemoryRow | null, action: string, extras: { reason?: string | null; prev_score?: number | null; new_score?: number | null; }) => {
    if (!org?.id) return;
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    await supabase.from("memory_feedback_events" as any).insert({
      organization_id: org.id,
      memory_id: m?.id ?? null,
      user_id: uid,
      action,
      reason: extras.reason ?? null,
      prev_score: extras.prev_score ?? null,
      new_score: extras.new_score ?? null,
      memory_title: m?.title ?? null,
    } as any);
  };

  const rateMemory = async (m: MemoryRow, direction: "up" | "down") => {
    setMemorySaving(m.id);
    const delta = direction === "up" ? 0.5 : -0.5;
    const current = typeof m.relevance_score === "number" ? m.relevance_score : 1;
    const next = Math.max(0.1, Math.min(10, current + delta));
    const { error } = await supabase.from("organizational_memory")
      .update({ relevance_score: next, last_referenced_at: new Date().toISOString() })
      .eq("id", m.id);
    setMemorySaving(null);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setMemory(prev => prev.map(x => x.id === m.id ? { ...x, relevance_score: next } : x));
    await logMemoryEvent(m, direction === "up" ? "boost" : "dampen", { prev_score: current, new_score: next });
    toast({ title: direction === "up" ? "Boosted" : "Dampened", description: "Leadership will weigh this memory accordingly." });
  };

  const submitMemoryFeedback = async (m: MemoryRow) => {
    if (!org?.id) return;
    const note = (memoryComment[m.id] ?? "").trim();
    if (!note) return;
    setMemorySaving(m.id);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("organizational_memory").insert({
      organization_id: org.id,
      memory_type: "feedback",
      title: `Feedback on: ${m.title}`.slice(0, 120),
      content: note,
      tags: ["feedback", "memory_review", ...(m.tags?.slice(0, 3) ?? [])],
      created_by: userData.user?.id ?? null,
      relevance_score: 2.0,
    } as any);
    setMemorySaving(null);
    if (error) return toast({ title: "Feedback failed", description: error.message, variant: "destructive" });
    setMemoryComment(prev => ({ ...prev, [m.id]: "" }));
    await logMemoryEvent(m, "comment", { reason: note });
    toast({ title: "Feedback saved", description: "Recorded as a new memory the leadership will consult." });
    loadMemory();
  };

  const removeMemory = async (m: MemoryRow) => {
    if (!confirm(`Remove "${m.title}" from organizational memory?`)) return;
    setMemorySaving(m.id);
    const { error } = await supabase.from("organizational_memory").delete().eq("id", m.id);
    setMemorySaving(null);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    setMemory(prev => prev.filter(x => x.id !== m.id));
    await logMemoryEvent(m, "delete", { prev_score: m.relevance_score ?? null });
    toast({ title: "Memory removed" });
  };

  const openReview = (m: MemoryRow, action: "approve" | "reject") => {
    setReviewTarget({ memory: m, action });
    setReviewReason("");
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    const reason = reviewReason.trim();
    if (!reason) {
      toast({ title: "Reason required", description: "Tell leadership why this memory is being " + reviewTarget.action + "d.", variant: "destructive" });
      return;
    }
    const { memory: m, action } = reviewTarget;
    setMemorySaving(m.id);
    const current = typeof m.relevance_score === "number" ? m.relevance_score : 1;
    const next = action === "approve"
      ? Math.min(10, current + 1.5)
      : Math.max(0.1, current - 2.0);
    const { error } = await supabase.from("organizational_memory")
      .update({ relevance_score: next, last_referenced_at: new Date().toISOString() })
      .eq("id", m.id);
    if (error) {
      setMemorySaving(null);
      return toast({ title: "Review failed", description: error.message, variant: "destructive" });
    }
    await logMemoryEvent(m, action, { reason, prev_score: current, new_score: next });
    setMemory(prev => prev.map(x => x.id === m.id ? { ...x, relevance_score: next } : x));
    setMemorySaving(null);
    setReviewTarget(null);
    setReviewReason("");
    toast({ title: action === "approve" ? "Memory approved" : "Memory rejected", description: "Recorded in the memory audit trail." });
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
    setFeedbackComment("");
    const { data } = await supabase.from("cognition_steps").select("*").eq("request_id", r.id).order("step_order");
    setAuditSteps(data ?? []);
  };

  const openFromGovernance = async (id: string) => {
    const r = requests.find((x) => x.id === id);
    if (r) { await openHistoric(r); setActiveTab("deliberations"); return; }
    const { data } = await supabase.from("cognition_requests").select("*").eq("id", id).maybeSingle();
    if (data) { await openHistoric(data as RequestRow); setActiveTab("deliberations"); }
  };

  const sendFeedback = async (outcome: "approved" | "revised" | "rejected") => {
    if (!activeRequestId || !org?.id) return;
    setFeedbackSaving(outcome);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) { setFeedbackSaving(null); return; }
    const rating = outcome === "approved" ? 5 : outcome === "revised" ? 3 : 1;
    const { error } = await supabase.from("cognition_feedback").insert({
      organization_id: org.id, request_id: activeRequestId, user_id: uid,
      rating, outcome, comment: feedbackComment.trim() || null,
    });
    setFeedbackSaving(null);
    if (error) {
      toast({ title: "Feedback failed", description: error.message, variant: "destructive" });
      return;
    }
    setFeedbackDone((s) => ({ ...s, [activeRequestId]: outcome }));
    setFeedbackComment("");
    toast({ title: "Feedback recorded", description: "The organization will remember this." });
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="deliberations" className="gap-1.5"><Sparkles className="w-4 h-4" /> Deliberations</TabsTrigger>
            <TabsTrigger value="executives" className="gap-1.5"><Crown className="w-4 h-4" /> Executive Team</TabsTrigger>
            <TabsTrigger value="consultants" className="gap-1.5"><Users className="w-4 h-4" /> Consultants</TabsTrigger>
            <TabsTrigger value="departments" className="gap-1.5"><Building2 className="w-4 h-4" /> Departments</TabsTrigger>
            <TabsTrigger value="governance" className="gap-1.5"><Shield className="w-4 h-4" /> Governance</TabsTrigger>
            <TabsTrigger value="memory" className="gap-1.5"><BookOpen className="w-4 h-4" /> Memory</TabsTrigger>
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
                  {Array.isArray(trace.policy_checks) && trace.policy_checks.length > 0 && (
                    <div className="rounded-xl border border-border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-accent" />
                        <div className="text-sm font-semibold text-foreground">Policy checks</div>
                      </div>
                      <ul className="space-y-1.5">
                        {trace.policy_checks.map((c: any, i: number) => {
                          const Icon = c.status === "violation" ? ShieldAlert : c.status === "caution" ? Shield : ShieldCheck;
                          const color = c.status === "violation" ? "text-destructive" : c.status === "caution" ? "text-amber-500" : "text-emerald-500";
                          return (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${color}`} />
                              <div><span className="font-medium text-foreground">{c.policy}</span> — <span className="text-muted-foreground">{c.note}</span></div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {auditSteps && auditSteps.length > 0 && (
                    <details className="rounded-xl border border-border p-4">
                      <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
                        <Activity className="w-4 h-4 text-accent" /> Audit trail ({auditSteps.length} steps)
                      </summary>
                      <ol className="mt-3 space-y-2">
                        {auditSteps.map((s: any) => (
                          <li key={s.id} className="text-xs border-l-2 border-accent/30 pl-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] uppercase tracking-widest text-accent">{s.stage}</span>
                              <span className="text-muted-foreground">· {s.actor_label}</span>
                            </div>
                            {s.reasoning && <p className="text-foreground/90 mt-0.5">{s.reasoning}</p>}
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                  {Array.isArray(trace.tasks_created) && trace.tasks_created.length > 0 && (
                    <div className="rounded-xl border border-border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckSquare className="w-4 h-4 text-accent" />
                        <div className="text-sm font-semibold text-foreground">{trace.tasks_created.length} tasks dispatched to the AI workforce</div>
                        <Link to="/execution" className="ml-auto text-xs text-accent hover:underline">Open Execution →</Link>
                      </div>
                      <ul className="space-y-1">
                        {trace.tasks_created.map((t: any) => (
                          <li key={t.id} className="text-xs text-muted-foreground truncate">• {t.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {activeRequestId && (
                    <div className="rounded-xl border border-border p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-accent" />
                        <div className="text-sm font-semibold text-foreground">Validate & feed back</div>
                        {feedbackDone[activeRequestId] && (
                          <Badge variant="outline" className="ml-auto text-[10px] capitalize">{feedbackDone[activeRequestId]}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Your rating and comment feed organizational memory so future deliberations learn from this outcome.</p>
                      <Input value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="What worked? What should the leadership change next time?" className="bg-background/60" />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={!!feedbackSaving} onClick={() => sendFeedback("approved")} className="gap-1.5">
                          <ThumbsUp className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" disabled={!!feedbackSaving} onClick={() => sendFeedback("revised")} className="gap-1.5">
                          Needs revision
                        </Button>
                        <Button size="sm" variant="outline" disabled={!!feedbackSaving} onClick={() => sendFeedback("rejected")} className="gap-1.5">
                          <ThumbsDown className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
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

          <TabsContent value="governance">
            <GovernancePanel onSelectRequest={openFromGovernance} />
          </TabsContent>

          <TabsContent value="memory" className="space-y-3">
            <div className="glass-card rounded-xl p-3 flex items-center gap-2">
              <SearchIcon className="w-4 h-4 text-muted-foreground ml-1" />
              <Input
                value={memoryQuery}
                onChange={(e) => setMemoryQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") loadMemory(); }}
                placeholder="Search what the organization has learned…"
                className="h-9 rounded-xl border-0 bg-transparent focus-visible:ring-0"
              />
              <Button size="sm" variant="outline" className="rounded-xl" onClick={loadMemory}>Search</Button>
            </div>
            {memory.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">
                No memories yet. As leadership deliberates and the nightly learn job runs, lessons will accumulate here.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {memory.map((m) => (
                  <div key={m.id} className="glass-card rounded-xl p-4 flex flex-col">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px] capitalize">{m.memory_type.replace(/_/g, " ")}</Badge>
                      {typeof m.relevance_score === "number" && (
                        <span className="text-[10px] text-muted-foreground">weight {m.relevance_score.toFixed(1)}</span>
                      )}
                    </div>
                    <div className="font-semibold text-sm text-foreground">{m.title}</div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-4">{m.content}</p>
                    {m.tags && m.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {m.tags.slice(0, 6).map((t) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-xs"
                          disabled={memorySaving === m.id} onClick={() => rateMemory(m, "up")}>
                          <TrendingUp className="w-3 h-3" /> Boost
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-xs"
                          disabled={memorySaving === m.id} onClick={() => rateMemory(m, "down")}>
                          <TrendingDown className="w-3 h-3" /> Dampen
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-xs text-emerald-500 hover:text-emerald-600"
                          disabled={memorySaving === m.id} onClick={() => openReview(m, "approve")}>
                          <Check className="w-3 h-3" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-xs text-destructive hover:text-destructive"
                          disabled={memorySaving === m.id} onClick={() => openReview(m, "reject")}>
                          <X className="w-3 h-3" /> Reject
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs ml-auto text-muted-foreground hover:text-destructive"
                          disabled={memorySaving === m.id} onClick={() => removeMemory(m)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex gap-1.5">
                        <Input
                          value={memoryComment[m.id] ?? ""}
                          onChange={(e) => setMemoryComment(prev => ({ ...prev, [m.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitMemoryFeedback(m); } }}
                          placeholder="Add a note leadership should remember…"
                          className="h-7 text-xs bg-background/60"
                        />
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                          disabled={memorySaving === m.id || !(memoryComment[m.id]?.trim())}
                          onClick={() => submitMemoryFeedback(m)}>
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        <div className="flex justify-end">
          <Link to="/memory-audit" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
            <History className="w-3 h-3" /> View memory audit trail
          </Link>
        </div>
      </div>
      <Dialog open={!!reviewTarget} onOpenChange={(open) => { if (!open) { setReviewTarget(null); setReviewReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewTarget?.action === "approve" ? "Approve memory" : "Reject memory"}
            </DialogTitle>
            <DialogDescription>
              {reviewTarget?.action === "approve"
                ? "Leadership will weight this memory more heavily in future deliberations."
                : "Leadership will avoid relying on this memory. A reason is required and recorded to the audit trail."}
            </DialogDescription>
          </DialogHeader>
          {reviewTarget && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-xs font-medium text-foreground truncate">{reviewTarget.memory.title}</div>
                <p className="text-xs text-muted-foreground line-clamp-3 mt-1">{reviewTarget.memory.content}</p>
              </div>
              <Textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="Reason (required) — explain why this memory should be trusted or avoided…"
                className="min-h-[100px]"
                autoFocus
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReviewTarget(null); setReviewReason(""); }}>Cancel</Button>
            <Button onClick={submitReview} disabled={!reviewReason.trim() || !!memorySaving}
              className={reviewTarget?.action === "reject" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
              {reviewTarget?.action === "approve" ? "Approve memory" : "Reject memory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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