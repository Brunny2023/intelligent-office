import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Target, TrendingUp, Plus, BarChart3, Users } from "lucide-react";
import { toast } from "sonner";
import PerformanceWidget from "@/components/dashboard/PerformanceWidget";

// ==================== KPI DASHBOARD ====================
const KPIDashboardTab = () => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", targetValue: "", currentValue: "0", unit: "%", category: "general" });

  useEffect(() => {
    if (!org) return;
    supabase.from("kpis").select("*").eq("organization_id", org.id).order("created_at", { ascending: false })
      .then(({ data }) => { setKpis(data || []); setLoading(false); });
  }, [org]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org) return;
    const { error } = await supabase.from("kpis").insert({
      organization_id: org.id, title: form.title, description: form.description || null,
      target_value: parseFloat(form.targetValue) || 0, current_value: parseFloat(form.currentValue) || 0,
      unit: form.unit, category: form.category, owner_id: user.id,
    });
    if (error) { toast.error("Failed to create KPI"); return; }
    toast.success("KPI created!");
    setDialogOpen(false);
    const { data } = await supabase.from("kpis").select("*").eq("organization_id", org.id).order("created_at", { ascending: false });
    setKpis(data || []);
  };

  const updateKPI = async (id: string, currentValue: number) => {
    await supabase.from("kpis").update({ current_value: currentValue, updated_at: new Date().toISOString() }).eq("id", id);
    setKpis(prev => prev.map(k => k.id === id ? { ...k, current_value: currentValue } : k));
    toast.success("KPI updated!");
  };

  const avgProgress = kpis.length > 0
    ? Math.round(kpis.reduce((sum, k) => sum + (k.target_value > 0 ? (k.current_value / k.target_value) * 100 : 0), 0) / kpis.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <Target className="w-5 h-5 text-accent mb-2" />
          <p className="text-2xl font-bold text-foreground">{kpis.length}</p>
          <p className="text-xs text-muted-foreground">Active KPIs</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }} className="glass-card rounded-xl p-4">
          <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{avgProgress}%</p>
          <p className="text-xs text-muted-foreground">Avg Progress</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="glass-card rounded-xl p-4">
          <BarChart3 className="w-5 h-5 text-svo-blue mb-2" />
          <p className="text-2xl font-bold text-foreground">{kpis.filter(k => k.current_value >= k.target_value).length}</p>
          <p className="text-xs text-muted-foreground">On Target</p>
        </motion.div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Key Performance Indicators</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl bg-accent text-accent-foreground"><Plus className="w-4 h-4 mr-1" /> Add KPI</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Create KPI</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Customer Satisfaction" className="rounded-xl" required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-xl resize-none" rows={2} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Target</Label><Input type="number" value={form.targetValue} onChange={e => setForm({...form, targetValue: e.target.value})} className="rounded-xl" required /></div>
                <div className="space-y-2"><Label>Current</Label><Input type="number" value={form.currentValue} onChange={e => setForm({...form, currentValue: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-2"><Label>Unit</Label><Input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="rounded-xl" /></div>
              </div>
              <div className="space-y-2"><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="efficiency">Efficiency</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full rounded-xl bg-accent text-accent-foreground">Create KPI</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="h-20 bg-muted rounded-xl animate-pulse" /> : kpis.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center"><Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No KPIs defined yet</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {kpis.map((kpi, i) => {
            const progress = kpi.target_value > 0 ? Math.min(100, Math.round((kpi.current_value / kpi.target_value) * 100)) : 0;
            return (
              <motion.div
                key={kpi.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                whileHover={{ y: -2 }}
                className="glass-card-strong rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{kpi.title}</h4>
                    {kpi.description && <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>}
                  </div>
                  <Badge variant="outline" className={progress >= 100 ? "bg-green-500/10 text-green-600" : progress >= 50 ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}>
                    {progress}%
                  </Badge>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Current: {kpi.current_value}{kpi.unit}</span>
                  <span>Target: {kpi.target_value}{kpi.unit}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==================== MAIN MODULE ====================
const KPIModule = () => {
  const { loading } = useOrganization();

  if (loading) {
    return <AppLayout title="Intelligence"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  return (
    <AppLayout title="Intelligence">
      <div className="p-6 md:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Performance & Intelligence</h1>
          <p className="text-muted-foreground mt-1">KPIs, goals & performance analytics</p>
        </motion.div>

        <Tabs defaultValue="kpis" className="space-y-4">
          <TabsList className="bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="kpis" className="rounded-lg data-[state=active]:bg-card"><Target className="w-4 h-4 mr-1.5" />KPIs</TabsTrigger>
            <TabsTrigger value="personal" className="rounded-lg data-[state=active]:bg-card"><Users className="w-4 h-4 mr-1.5" />My Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="kpis"><KPIDashboardTab /></TabsContent>
          <TabsContent value="personal"><PerformanceWidget /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default KPIModule;
