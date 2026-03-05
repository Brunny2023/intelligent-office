import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useProfileNames } from "@/hooks/useProfileNames";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { DollarSign, Receipt, Plus, TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// ==================== PAYROLL ====================
const PayrollTab = () => {
  const { org } = useOrganization();
  const { resolve, getName } = useProfileNames();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const { user } = useAuth();
  const [form, setForm] = useState({ userId: "", periodStart: "", periodEnd: "", baseSalary: "", bonuses: "0", deductions: "0", currency: "USD", notes: "" });

  useEffect(() => {
    if (!org) return;
    Promise.all([
      supabase.from("payroll_records").select("*").eq("organization_id", org.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name").eq("organization_id", org.id),
    ]).then(([{ data: payroll }, { data: profiles }]) => {
      setRecords(payroll || []);
      setStaff(profiles || []);
      if (payroll) resolve(payroll.map(p => p.user_id));
      setLoading(false);
    });
  }, [org]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org) return;
    const base = parseFloat(form.baseSalary) || 0;
    const bonus = parseFloat(form.bonuses) || 0;
    const deduct = parseFloat(form.deductions) || 0;
    const { error } = await supabase.from("payroll_records").insert({
      organization_id: org.id, user_id: form.userId, period_start: form.periodStart,
      period_end: form.periodEnd, base_salary: base, bonuses: bonus,
      deductions: deduct, net_pay: base + bonus - deduct, currency: form.currency,
      notes: form.notes || null,
    });
    if (error) { toast.error("Failed to create payroll record"); return; }
    toast.success("Payroll record created!");
    setDialogOpen(false);
    const { data } = await supabase.from("payroll_records").select("*").eq("organization_id", org.id).order("created_at", { ascending: false });
    setRecords(data || []);
  };

  const totalPayroll = records.reduce((sum, r) => sum + Number(r.net_pay || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <Wallet className="w-5 h-5 text-accent mb-2" />
          <p className="text-2xl font-bold text-foreground">${totalPayroll.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Payroll</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }} className="glass-card rounded-xl p-4">
          <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{records.length}</p>
          <p className="text-xs text-muted-foreground">Records</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="glass-card rounded-xl p-4">
          <PieChart className="w-5 h-5 text-svo-blue mb-2" />
          <p className="text-2xl font-bold text-foreground">{staff.length}</p>
          <p className="text-xs text-muted-foreground">Staff</p>
        </motion.div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Payroll Records</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl bg-accent text-accent-foreground"><Plus className="w-4 h-4 mr-1" /> New Record</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Payroll Record</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Employee</Label>
                <Select value={form.userId} onValueChange={v => setForm({...form, userId: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Period Start</Label><Input type="date" value={form.periodStart} onChange={e => setForm({...form, periodStart: e.target.value})} className="rounded-xl" required /></div>
                <div className="space-y-2"><Label>Period End</Label><Input type="date" value={form.periodEnd} onChange={e => setForm({...form, periodEnd: e.target.value})} className="rounded-xl" required /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Base Salary</Label><Input type="number" value={form.baseSalary} onChange={e => setForm({...form, baseSalary: e.target.value})} className="rounded-xl" required /></div>
                <div className="space-y-2"><Label>Bonuses</Label><Input type="number" value={form.bonuses} onChange={e => setForm({...form, bonuses: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-2"><Label>Deductions</Label><Input type="number" value={form.deductions} onChange={e => setForm({...form, deductions: e.target.value})} className="rounded-xl" /></div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="rounded-xl resize-none" rows={2} /></div>
              <Button type="submit" className="w-full rounded-xl bg-accent text-accent-foreground">Create Record</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="h-20 bg-muted rounded-xl animate-pulse" /> : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {records.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">No payroll records</p>
            ) : records.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{getName(r.user_id)}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(r.period_start), "MMM d")} — {format(new Date(r.period_end), "MMM d, yyyy")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">${Number(r.net_pay).toLocaleString()}</p>
                  <Badge variant="outline" className={r.status === "approved" ? "bg-green-500/10 text-green-600" : "bg-accent/10 text-accent"}>{r.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== EXPENSES ====================
const ExpensesTab = () => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const { resolve, getName } = useProfileNames();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", amount: "", category: "general", currency: "USD" });

  useEffect(() => {
    if (!org) return;
    supabase.from("expense_reports").select("*").eq("organization_id", org.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        setExpenses(data || []);
        if (data) resolve(data.map(e => e.submitted_by));
        setLoading(false);
      });
  }, [org]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org) return;
    const { error } = await supabase.from("expense_reports").insert({
      organization_id: org.id, submitted_by: user.id, title: form.title,
      description: form.description || null, amount: parseFloat(form.amount) || 0,
      category: form.category, currency: form.currency,
    });
    if (error) { toast.error("Failed to submit expense"); return; }
    toast.success("Expense submitted!");
    setDialogOpen(false);
    const { data } = await supabase.from("expense_reports").select("*").eq("organization_id", org.id).order("created_at", { ascending: false });
    setExpenses(data || []);
  };

  const approveExpense = async (id: string) => {
    if (!user) return;
    await supabase.from("expense_reports").update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString() }).eq("id", id);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: "approved" } : e));
    toast.success("Expense approved");
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const pendingCount = expenses.filter(e => e.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <TrendingDown className="w-5 h-5 text-destructive mb-2" />
          <p className="text-2xl font-bold text-foreground">${totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Expenses</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }} className="glass-card rounded-xl p-4">
          <Receipt className="w-5 h-5 text-accent mb-2" />
          <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pending Approval</p>
        </motion.div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Expense Reports</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl bg-accent text-accent-foreground"><Plus className="w-4 h-4 mr-1" /> Submit Expense</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Submit Expense Report</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="rounded-xl" required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-xl resize-none" rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="rounded-xl" required /></div>
                <div className="space-y-2"><Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="meals">Meals</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl bg-accent text-accent-foreground">Submit Expense</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="h-20 bg-muted rounded-xl animate-pulse" /> : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {expenses.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">No expense reports</p>
            ) : expenses.map(e => (
              <div key={e.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{getName(e.submitted_by)} · {e.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-foreground">${Number(e.amount).toLocaleString()}</p>
                  {e.status === "pending" ? (
                    <Button size="sm" variant="outline" className="rounded-lg text-xs h-7" onClick={() => approveExpense(e.id)}>Approve</Button>
                  ) : (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">{e.status}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN MODULE ====================
const FinanceModule = () => {
  const { loading } = useOrganization();

  if (loading) {
    return (
      <AppLayout title="Finance"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>
    );
  }

  return (
    <AppLayout title="Finance">
      <div className="p-6 md:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Finance & Accounting</h1>
          <p className="text-muted-foreground mt-1">Payroll management, expense tracking & financial reports</p>
        </motion.div>

        <Tabs defaultValue="payroll" className="space-y-4">
          <TabsList className="bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="payroll" className="rounded-lg data-[state=active]:bg-card"><DollarSign className="w-4 h-4 mr-1.5" />Payroll</TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-lg data-[state=active]:bg-card"><Receipt className="w-4 h-4 mr-1.5" />Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value="payroll"><PayrollTab /></TabsContent>
          <TabsContent value="expenses"><ExpensesTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default FinanceModule;
