import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useProfileNames } from "@/hooks/useProfileNames";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/dashboard/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Workflow, Plus, Play, Pause, Settings, ArrowRight, CheckCircle, Clock, AlertTriangle, Trash2, UserPlus, Zap, ThumbsUp, ThumbsDown, Sparkles, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const triggerTypes = [
  { value: "manual", label: "Manual Trigger" },
  { value: "task_created", label: "When Task Created" },
  { value: "task_completed", label: "When Task Completed" },
  { value: "leave_requested", label: "When Leave Requested" },
  { value: "expense_submitted", label: "When Expense Submitted" },
  { value: "document_uploaded", label: "When Document Uploaded" },
];

const actionTypes = [
  { value: "approval", label: "Approval Step" },
  { value: "notification", label: "Send Notification" },
  { value: "assign_task", label: "Assign Task" },
  { value: "update_status", label: "Update Status" },
  { value: "escalation", label: "Escalation" },
];

const WorkflowsModule = () => {
  const { user } = useAuth();
  const { org, loading: orgLoading } = useOrganization();
  const { resolve, getName } = useProfileNames();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [stepsDialog, setStepsDialog] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", triggerType: "manual" });
  const [steps, setSteps] = useState<Array<{ action_type: string; assignee_id: string; timeout_hours: number }>>([]);
  const [logsFor, setLogsFor] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggesting, setSuggesting] = useState(false);

  const fetchData = async () => {
    if (!org) return;
    const [{ data: wf }, { data: inst }, { data: profs }] = await Promise.all([
      supabase.from("workflows").select("*").eq("organization_id", org.id).order("created_at", { ascending: false }),
      supabase.from("workflow_instances").select("*, workflows(name)").eq("organization_id", org.id).order("started_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("id, full_name").eq("organization_id", org.id),
    ]);
    setWorkflows(wf || []);
    setInstances(inst || []);
    setProfiles(profs || []);
    resolve((wf || []).map((w: any) => w.created_by));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [org]);

  const createWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org) return;
    const { data: wf, error } = await supabase.from("workflows").insert({
      organization_id: org.id, name: form.name, description: form.description,
      trigger_type: form.triggerType, created_by: user.id,
    }).select().single();
    if (error) { toast.error(error.message); return; }

    // Insert steps
    if (steps.length > 0) {
      const stepInserts = steps.map((s, i) => ({
        workflow_id: wf.id, step_order: i, action_type: s.action_type,
        assignee_id: s.assignee_id || null, timeout_hours: s.timeout_hours,
      }));
      await supabase.from("workflow_steps").insert(stepInserts);
    }

    toast.success("Workflow created!");
    setDialogOpen(false);
    setForm({ name: "", description: "", triggerType: "manual" });
    setSteps([]);
    fetchData();
  };

  const toggleWorkflow = async (id: string, isActive: boolean) => {
    await supabase.from("workflows").update({ is_active: !isActive }).eq("id", id);
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, is_active: !isActive } : w));
    toast.success(isActive ? "Workflow paused" : "Workflow activated");
  };

  const startInstance = async (workflowId: string) => {
    if (!user || !org) return;
    const { error } = await supabase.from("workflow_instances").insert({
      workflow_id: workflowId, organization_id: org.id, started_by: user.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Workflow started!");
    fetchData();
  };

  const runEngine = async (mode: "process_org" | "escalate" = "process_org") => {
    const { data, error } = await supabase.functions.invoke("workflow-run", { body: { mode } });
    if (error) { toast.error(error.message); return; }
    toast.success(`Engine ran: ${data?.processed ?? data?.escalated ?? 0} instances`);
    fetchData();
  };

  const advanceInstance = async (instanceId: string) => {
    const { error } = await supabase.functions.invoke("workflow-run", { body: { mode: "advance", instance_id: instanceId } });
    if (error) { toast.error(error.message); return; }
    toast.success("Advanced one step");
    fetchData();
  };

  const decide = async (instanceId: string, mode: "approve" | "reject") => {
    const { error } = await supabase.functions.invoke("workflow-run", { body: { mode, instance_id: instanceId } });
    if (error) { toast.error(error.message); return; }
    toast.success(mode === "approve" ? "Approved & advanced" : "Rejected");
    fetchData();
  };

  const viewLogs = async (instanceId: string) => {
    setLogsFor(instanceId);
    const { data } = await supabase.from("workflow_step_logs").select("*")
      .eq("instance_id", instanceId).order("performed_at", { ascending: true });
    setLogs(data || []);
  };

  const runSuggest = async () => {
    setSuggesting(true); setSuggestOpen(true);
    const { data, error } = await supabase.functions.invoke("workflow-run", { body: { mode: "suggest" } });
    setSuggesting(false);
    if (error) { toast.error(error.message); return; }
    setSuggestions((data as any)?.suggestions ?? []);
  };

  const createFromSuggestion = async (s: any) => {
    if (!user || !org) return;
    const { data: wf, error } = await supabase.from("workflows").insert({
      organization_id: org.id, name: s.name, description: s.why,
      trigger_type: s.trigger ?? "manual", created_by: user.id, is_active: true,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    if (Array.isArray(s.steps) && s.steps.length) {
      await supabase.from("workflow_steps").insert(s.steps.map((st: any, i: number) => ({
        workflow_id: wf.id, step_order: i,
        action_type: st.action_type ?? "notification",
        assignee_id: null, timeout_hours: 24,
      })));
    }
    toast.success(`Created "${s.name}"`);
    setSuggestOpen(false);
    fetchData();
  };

  const viewSteps = async (workflow: any) => {
    const { data } = await supabase.from("workflow_steps").select("*").eq("workflow_id", workflow.id).order("step_order");
    setSelectedWorkflow({ ...workflow, steps: data || [] });
    setStepsDialog(true);
  };

  const addStep = () => setSteps([...steps, { action_type: "approval", assignee_id: "", timeout_hours: 24 }]);
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));

  if (orgLoading) {
    return <AppLayout title="Workflows"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  return (
    <AppLayout title="Workflows">
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          eyebrow="Automation"
          icon={Workflow}
          title="Workflow Automation"
          subtitle="Automated approvals, escalations & conditional logic"
          actions={<>
            <Button variant="outline" className="rounded-xl" onClick={() => runEngine("process_org")}><Zap className="w-4 h-4 mr-1" /> Advance engine</Button>
            <Button variant="outline" className="rounded-xl" onClick={() => runEngine("escalate")}><AlertTriangle className="w-4 h-4 mr-1" /> Escalate stale</Button>
            <Button variant="outline" className="rounded-xl" onClick={runSuggest}><Sparkles className="w-4 h-4 mr-1" /> AI Suggest</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-accent text-accent-foreground"><Plus className="w-4 h-4 mr-1" /> Create Workflow</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Workflow</DialogTitle></DialogHeader>
              <form onSubmit={createWorkflow} className="space-y-4">
                <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Expense Approval Flow" className="rounded-xl" required /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl resize-none" rows={2} /></div>
                <div className="space-y-2"><Label>Trigger</Label>
                  <Select value={form.triggerType} onValueChange={v => setForm({ ...form, triggerType: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{triggerTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Steps builder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Steps</Label>
                    <Button type="button" size="sm" variant="outline" className="rounded-lg text-xs h-7" onClick={addStep}><Plus className="w-3 h-3 mr-1" /> Add Step</Button>
                  </div>
                  {steps.map((step, i) => (
                    <div key={i} className="glass-card rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">Step {i + 1}</Badge>
                        <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeStep(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Select value={step.action_type} onValueChange={v => { const s = [...steps]; s[i].action_type = v; setSteps(s); }}>
                          <SelectTrigger className="rounded-lg text-xs h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>{actionTypes.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={step.assignee_id} onValueChange={v => { const s = [...steps]; s[i].assignee_id = v; setSteps(s); }}>
                          <SelectTrigger className="rounded-lg text-xs h-8"><SelectValue placeholder="Assignee" /></SelectTrigger>
                          <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input type="number" value={step.timeout_hours} onChange={e => { const s = [...steps]; s[i].timeout_hours = Number(e.target.value); setSteps(s); }} className="rounded-lg text-xs h-8" placeholder="Timeout (hrs)" />
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="submit" className="w-full rounded-xl bg-accent text-accent-foreground">Create Workflow</Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Workflows", value: workflows.length, icon: Workflow },
            { label: "Active", value: workflows.filter(w => w.is_active).length, icon: Play },
            { label: "Running Instances", value: instances.filter(i => i.status === "active").length, icon: Clock },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }} className="glass-card rounded-xl p-4">
              <s.icon className="w-5 h-5 text-accent mb-2" />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="workflows">
          <TabsList className="bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="workflows" className="rounded-lg data-[state=active]:bg-card">Workflows</TabsTrigger>
            <TabsTrigger value="instances" className="rounded-lg data-[state=active]:bg-card">Running Instances</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="mt-4 space-y-3">
            {loading ? <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div> :
              workflows.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center">
                  <Workflow className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No workflows yet. Create one to automate processes.</p>
                </div>
              ) : workflows.map((wf, i) => (
                <motion.div key={wf.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                  className="glass-card-strong rounded-xl p-5 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{wf.name}</h3>
                      <Badge variant="outline" className={wf.is_active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}>{wf.is_active ? "Active" : "Paused"}</Badge>
                      <Badge variant="outline" className="bg-svo-blue/10 text-svo-blue text-[10px]">{triggerTypes.find(t => t.value === wf.trigger_type)?.label || wf.trigger_type}</Badge>
                    </div>
                    {wf.description && <p className="text-sm text-muted-foreground">{wf.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Created {formatDistanceToNow(new Date(wf.created_at), { addSuffix: true })} by {getName(wf.created_by)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg h-8" onClick={() => viewSteps(wf)}><Settings className="w-3 h-3 mr-1" /> Steps</Button>
                    <Button size="sm" variant="outline" className="rounded-lg h-8" onClick={() => toggleWorkflow(wf.id, wf.is_active)}>{wf.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}</Button>
                    {wf.trigger_type === "manual" && wf.is_active && (
                      <Button size="sm" className="rounded-lg h-8 bg-accent text-accent-foreground" onClick={() => startInstance(wf.id)}><Play className="w-3 h-3 mr-1" /> Run</Button>
                    )}
                  </div>
                </motion.div>
              ))}
          </TabsContent>

          <TabsContent value="instances" className="mt-4 space-y-3">
            {instances.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No workflow instances running</p>
              </div>
            ) : instances.map((inst, i) => (
              <motion.div key={inst.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                className="glass-card-strong rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground">{inst.workflows?.name || "Workflow"}</h4>
                    <Badge variant="outline" className={inst.status === "active" ? "bg-svo-blue/10 text-svo-blue" : inst.status === "completed" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}>{inst.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Step {inst.current_step + 1} · Started {formatDistanceToNow(new Date(inst.started_at), { addSuffix: true })}</p>
                </div>
                {inst.status === "active" && (
                  <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="rounded-lg h-8" onClick={() => advanceInstance(inst.id)}>
                    <Zap className="w-3 h-3 mr-1" /> Advance
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-green-600" onClick={() => decide(inst.id, "approve")}>
                    <ThumbsUp className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-destructive" onClick={() => decide(inst.id, "reject")}>
                    <ThumbsDown className="w-3 h-3 mr-1" /> Reject
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg h-8" onClick={() => viewLogs(inst.id)}>
                    <ScrollText className="w-3 h-3 mr-1" /> Logs
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg h-8" onClick={async () => {
                    await supabase.from("workflow_instances").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", inst.id);
                    toast.success("Marked complete");
                    fetchData();
                  }}><CheckCircle className="w-3 h-3 mr-1" /> Complete</Button>
                  </div>
                )}
                {inst.status !== "active" && (
                  <Button size="sm" variant="outline" className="rounded-lg h-8" onClick={() => viewLogs(inst.id)}>
                    <ScrollText className="w-3 h-3 mr-1" /> Logs
                  </Button>
                )}
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Steps dialog */}
        <Dialog open={stepsDialog} onOpenChange={setStepsDialog}>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Workflow Steps: {selectedWorkflow?.name}</DialogTitle></DialogHeader>
            {selectedWorkflow?.steps?.length > 0 ? (
              <div className="space-y-3">
                {selectedWorkflow.steps.map((step: any, i: number) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">{i + 1}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{actionTypes.find(a => a.value === step.action_type)?.label || step.action_type}</p>
                      <p className="text-xs text-muted-foreground">Timeout: {step.timeout_hours}h {step.assignee_id ? `· Assigned to ${getName(step.assignee_id)}` : ""}</p>
                    </div>
                    {i < selectedWorkflow.steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-sm">No steps configured</p>}
          </DialogContent>
        </Dialog>

        {/* Logs dialog */}
        <Dialog open={!!logsFor} onOpenChange={(v) => !v && setLogsFor(null)}>
          <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Execution Log</DialogTitle></DialogHeader>
            {logs.length === 0 ? <p className="text-sm text-muted-foreground">No steps executed yet.</p> : (
              <div className="space-y-2">
                {logs.map((l) => (
                  <div key={l.id} className="glass-card rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">Step {l.step_order + 1} · {l.action}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(l.performed_at), { addSuffix: true })}</span>
                    </div>
                    {l.notes && <p className="text-xs text-muted-foreground mt-1">{l.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Suggestions dialog */}
        <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
          <DialogContent className="rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>AI-Suggested Workflows</DialogTitle></DialogHeader>
            {suggesting ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Analyzing organizational signals…</div>
            ) : suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No suggestions right now — try again after more activity.</p>
            ) : (
              <div className="space-y-3">
                {suggestions.map((s, i) => (
                  <div key={i} className="glass-card rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">{s.name}</h4>
                      <Button size="sm" className="rounded-lg h-8 bg-accent text-accent-foreground" onClick={() => createFromSuggestion(s)}>
                        <Plus className="w-3 h-3 mr-1" /> Create
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.why}</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">trigger: {s.trigger}</Badge>
                      {(s.steps ?? []).map((st: any, j: number) => (
                        <Badge key={j} variant="outline" className="text-[10px]">{j+1}. {st.action_type}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default WorkflowsModule;
