import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, StatCard, type Tone } from "@/components/dashboard/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, Calendar, TrendingUp, CheckCircle, Clock, AlertTriangle, Trash2, Edit2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";

const periodLabels: Record<string, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", annual: "Annual" };
const periodColors: Record<string, string> = {
  daily: "bg-svo-blue/10 text-svo-blue",
  weekly: "bg-accent/10 text-accent",
  monthly: "bg-svo-gold/10 text-svo-gold",
  annual: "bg-green-500/10 text-green-600",
};
const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-svo-blue/10 text-svo-blue",
  completed: "bg-green-500/10 text-green-600",
  missed: "bg-destructive/10 text-destructive",
};

const JobPlanningModule = () => {
  const { user } = useAuth();
  const { org, loading: orgLoading } = useOrganization();
  const [plans, setPlans] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [planDialog, setPlanDialog] = useState(false);
  const [targetDialog, setTargetDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [planForm, setPlanForm] = useState({ title: "", description: "", category: "general", startDate: "", endDate: "" });
  const [targetForm, setTargetForm] = useState({ title: "", periodType: "daily", targetValue: "100", unit: "%", dueDate: "", notes: "" });

  const fetchData = useCallback(async () => {
    if (!org || !user) return;
    const [{ data: p }, { data: t }] = await Promise.all([
      supabase.from("job_plans").select("*").eq("organization_id", org.id).order("created_at", { ascending: false }),
      supabase.from("job_plan_targets").select("*").eq("organization_id", org.id).order("due_date", { ascending: true }),
    ]);
    setPlans(p || []);
    setTargets(t || []);
    setLoading(false);
  }, [org, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org) return;
    const { error } = await supabase.from("job_plans").insert({
      organization_id: org.id, user_id: user.id, title: planForm.title,
      description: planForm.description, category: planForm.category,
      start_date: planForm.startDate || null, end_date: planForm.endDate || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Job plan created!");
    setPlanDialog(false);
    setPlanForm({ title: "", description: "", category: "general", startDate: "", endDate: "" });
    fetchData();
  };

  const createTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !org) return;
    const { error } = await supabase.from("job_plan_targets").insert({
      job_plan_id: selectedPlan.id, organization_id: org.id,
      title: targetForm.title, period_type: targetForm.periodType,
      target_value: Number(targetForm.targetValue), unit: targetForm.unit,
      due_date: targetForm.dueDate || null, notes: targetForm.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Target added!");
    setTargetDialog(false);
    setTargetForm({ title: "", periodType: "daily", targetValue: "100", unit: "%", dueDate: "", notes: "" });
    fetchData();
  };

  const updateTargetProgress = async (id: string, currentValue: number, targetValue: number) => {
    const status = currentValue >= targetValue ? "completed" : "in_progress";
    await supabase.from("job_plan_targets").update({ current_value: currentValue, status }).eq("id", id);
    setTargets(prev => prev.map(t => t.id === id ? { ...t, current_value: currentValue, status } : t));
    if (status === "completed") toast.success("Target completed! 🎉");
  };

  const deleteTarget = async (id: string) => {
    await supabase.from("job_plan_targets").delete().eq("id", id);
    toast.success("Target removed");
    fetchData();
  };

  const deletePlan = async (id: string) => {
    await supabase.from("job_plans").delete().eq("id", id);
    toast.success("Plan deleted");
    if (selectedPlan?.id === id) setSelectedPlan(null);
    fetchData();
  };

  const planTargets = (planId: string) => targets.filter(t => t.job_plan_id === planId);
  const planProgress = (planId: string) => {
    const pt = planTargets(planId);
    if (pt.length === 0) return 0;
    return Math.round((pt.filter(t => t.status === "completed").length / pt.length) * 100);
  };

  const filteredTargets = activeTab === "all" ? targets : targets.filter(t => t.period_type === activeTab);

  // Summary stats
  const totalTargets = targets.length;
  const completedTargets = targets.filter(t => t.status === "completed").length;
  const overdueTargets = targets.filter(t => t.due_date && isBefore(new Date(t.due_date), new Date()) && t.status !== "completed").length;
  const upcomingTargets = targets.filter(t => t.due_date && isAfter(new Date(t.due_date), new Date()) && isBefore(new Date(t.due_date), addDays(new Date(), 3)) && t.status !== "completed").length;

  if (orgLoading || loading) {
    return <AppLayout title="Job Planning"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  return (
    <AppLayout title="Job Planning">
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          eyebrow="Goals"
          icon={Target}
          title="Job Planning"
          subtitle="Plan, track & achieve your goals with structured targets"
          actions={
          <Dialog open={planDialog} onOpenChange={setPlanDialog}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-accent text-accent-foreground"><Plus className="w-4 h-4 mr-1" /> New Plan</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>Create Job Plan</DialogTitle></DialogHeader>
              <form onSubmit={createPlan} className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={planForm.title} onChange={e => setPlanForm({ ...planForm, title: e.target.value })} placeholder="Q1 Sales Target" className="rounded-xl" required /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} className="rounded-xl resize-none" rows={2} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2"><Label>Category</Label>
                    <Select value={planForm.category} onValueChange={v => setPlanForm({ ...planForm, category: v })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={planForm.startDate} onChange={e => setPlanForm({ ...planForm, startDate: e.target.value })} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label>End Date</Label><Input type="date" value={planForm.endDate} onChange={e => setPlanForm({ ...planForm, endDate: e.target.value })} className="rounded-xl" /></div>
                </div>
                <Button type="submit" className="w-full rounded-xl bg-accent text-accent-foreground">Create Plan</Button>
              </form>
            </DialogContent>
          </Dialog>
          }
        />

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Targets", value: totalTargets, icon: Target, tone: "blue" as Tone },
            { label: "Completed", value: completedTargets, icon: CheckCircle, tone: "emerald" as Tone },
            { label: "Overdue", value: overdueTargets, icon: AlertTriangle, tone: "rose" as Tone },
            { label: "Due Soon", value: upcomingTargets, icon: Clock, tone: "gold" as Tone },
          ].map((s, i) => (
            <StatCard key={s.label} index={i} label={s.label} value={s.value} icon={s.icon} tone={s.tone} />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Plans list */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Plans</h2>
            {plans.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No plans yet</p>
              </div>
            ) : plans.map((plan, i) => {
              const progress = planProgress(plan.id);
              return (
                <motion.button key={plan.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
                  whileHover={{ x: 4, transition: { type: "spring", stiffness: 400 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full glass-card-strong rounded-xl p-4 text-left transition-all ${selectedPlan?.id === plan.id ? "ring-2 ring-accent" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground text-sm truncate">{plan.title}</h4>
                    <Badge variant="outline" className="text-[10px]">{plan.category}</Badge>
                  </div>
                  <Progress value={progress} className="h-1.5 mb-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{planTargets(plan.id).length} targets</span>
                    <span className="text-xs font-semibold text-accent">{progress}%</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Targets view */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {selectedPlan ? `Targets: ${selectedPlan.title}` : "All Targets"}
              </h2>
              {selectedPlan && (
                <div className="flex items-center gap-2">
                  <Dialog open={targetDialog} onOpenChange={setTargetDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="rounded-xl bg-accent text-accent-foreground"><Plus className="w-3 h-3 mr-1" /> Add Target</Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl">
                      <DialogHeader><DialogTitle>Add Target to {selectedPlan.title}</DialogTitle></DialogHeader>
                      <form onSubmit={createTarget} className="space-y-4">
                        <div className="space-y-2"><Label>Title</Label><Input value={targetForm.title} onChange={e => setTargetForm({ ...targetForm, title: e.target.value })} placeholder="Close 10 deals" className="rounded-xl" required /></div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2"><Label>Period</Label>
                            <Select value={targetForm.periodType} onValueChange={v => setTargetForm({ ...targetForm, periodType: v })}>
                              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="annual">Annual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2"><Label>Target Value</Label><Input type="number" value={targetForm.targetValue} onChange={e => setTargetForm({ ...targetForm, targetValue: e.target.value })} className="rounded-xl" /></div>
                          <div className="space-y-2"><Label>Unit</Label>
                            <Select value={targetForm.unit} onValueChange={v => setTargetForm({ ...targetForm, unit: v })}>
                              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="%">%</SelectItem>
                                <SelectItem value="units">Units</SelectItem>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="tasks">Tasks</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={targetForm.dueDate} onChange={e => setTargetForm({ ...targetForm, dueDate: e.target.value })} className="rounded-xl" /></div>
                        <div className="space-y-2"><Label>Notes</Label><Textarea value={targetForm.notes} onChange={e => setTargetForm({ ...targetForm, notes: e.target.value })} className="rounded-xl resize-none" rows={2} /></div>
                        <Button type="submit" className="w-full rounded-xl bg-accent text-accent-foreground">Add Target</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="ghost" className="rounded-xl text-destructive h-8" onClick={() => deletePlan(selectedPlan.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {!selectedPlan && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-muted/50 rounded-xl p-1">
                  <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-card text-xs">All</TabsTrigger>
                  <TabsTrigger value="daily" className="rounded-lg data-[state=active]:bg-card text-xs">Daily</TabsTrigger>
                  <TabsTrigger value="weekly" className="rounded-lg data-[state=active]:bg-card text-xs">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="rounded-lg data-[state=active]:bg-card text-xs">Monthly</TabsTrigger>
                  <TabsTrigger value="annual" className="rounded-lg data-[state=active]:bg-card text-xs">Annual</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {(selectedPlan ? planTargets(selectedPlan.id) : filteredTargets).length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-12 text-center">
                    <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{selectedPlan ? "Add targets to track progress" : "No targets yet"}</p>
                  </motion.div>
                ) : (selectedPlan ? planTargets(selectedPlan.id) : filteredTargets).map((target, i) => {
                  const progress = Number(target.target_value) > 0 ? Math.min(Math.round((Number(target.current_value) / Number(target.target_value)) * 100), 100) : 0;
                  const isOverdue = target.due_date && isBefore(new Date(target.due_date), new Date()) && target.status !== "completed";

                  return (
                    <motion.div key={target.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -2, transition: { type: "spring", stiffness: 400 } }}
                      className={`glass-card-strong rounded-xl p-4 ${isOverdue ? "border-l-4 border-l-destructive" : ""}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground text-sm">{target.title}</h4>
                            <Badge variant="outline" className={`text-[10px] ${periodColors[target.period_type] || ""}`}>{periodLabels[target.period_type]}</Badge>
                            <Badge variant="outline" className={`text-[10px] ${statusColors[target.status] || ""}`}>{target.status}</Badge>
                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                          </div>
                          {target.notes && <p className="text-xs text-muted-foreground">{target.notes}</p>}
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={() => deleteTarget(target.id)}>
                          <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{Number(target.current_value)} / {Number(target.target_value)} {target.unit}</span>
                          <span className="font-semibold text-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between">
                          {target.due_date && (
                            <span className={`text-xs ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {isOverdue ? "Overdue" : `Due ${format(new Date(target.due_date), "MMM d")}`}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              className="w-20 h-7 rounded-lg text-xs"
                              placeholder="Update"
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  const val = Number((e.target as HTMLInputElement).value);
                                  if (val >= 0) {
                                    updateTargetProgress(target.id, val, Number(target.target_value));
                                    (e.target as HTMLInputElement).value = "";
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default JobPlanningModule;
