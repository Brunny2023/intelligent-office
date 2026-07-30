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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { DollarSign, Receipt, Plus, TrendingUp, TrendingDown, Wallet, PieChart, FileText, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from "recharts";

const CHART_COLORS = ["hsl(var(--accent))", "hsl(var(--svo-blue))", "hsl(var(--svo-gold))", "hsl(var(--destructive))", "#10b981", "#8b5cf6"];

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

  const approvePayroll = async (id: string) => {
    if (!user) return;
    await supabase.from("payroll_records").update({ status: "approved", approved_by: user.id }).eq("id", id);
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
    toast.success("Payroll approved");
  };

  const totalPayroll = records.reduce((sum, r) => sum + Number(r.net_pay || 0), 0);
  const totalBonuses = records.reduce((sum, r) => sum + Number(r.bonuses || 0), 0);
  const totalDeductions = records.reduce((sum, r) => sum + Number(r.deductions || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4 mb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <Wallet className="w-5 h-5 text-accent mb-2" />
          <p className="text-2xl font-bold text-foreground">${totalPayroll.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Payroll</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }} className="glass-card rounded-xl p-4">
          <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">${totalBonuses.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Bonuses</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="glass-card rounded-xl p-4">
          <TrendingDown className="w-5 h-5 text-destructive mb-2" />
          <p className="text-2xl font-bold text-foreground">${totalDeductions.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Deductions</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }} className="glass-card rounded-xl p-4">
          <PieChart className="w-5 h-5 text-svo-blue mb-2" />
          <p className="text-2xl font-bold text-foreground">{records.length}</p>
          <p className="text-xs text-muted-foreground">Records</p>
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
                  <p className="text-[10px] text-muted-foreground">Base: ${Number(r.base_salary).toLocaleString()} · Bonus: ${Number(r.bonuses).toLocaleString()} · Deduct: ${Number(r.deductions).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-foreground">${Number(r.net_pay).toLocaleString()}</p>
                  {r.status === "draft" ? (
                    <Button size="sm" variant="outline" className="rounded-lg text-xs h-7" onClick={() => approvePayroll(r.id)}>Approve</Button>
                  ) : (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">{r.status}</Badge>
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
    const amt = parseFloat(form.amount) || 0;
    const { error } = await supabase.from("expense_reports").insert({
      organization_id: org.id, submitted_by: user.id, title: form.title,
      description: form.description || null, amount: amt,
      category: form.category, currency: form.currency,
    });
    if (error) { toast.error("Failed to submit expense"); return; }
    toast.success("Expense submitted!");
    // Wave 5 rewire: material expenses run through the cognition layer for
    // policy-checked financial advisory (CFO deliberation + governance).
    if (amt >= 1000) {
      const { triggerCognition } = await import("@/lib/cognition");
      void triggerCognition(
        `Expense submitted: ${form.title} — ${form.currency} ${amt.toFixed(2)} (${form.category}). ${form.description || ""}. Advise on approval, budget impact, and any compliance risk.`,
      );
    }
    setDialogOpen(false);
    setForm({ title: "", description: "", amount: "", category: "general", currency: "USD" });
    const { data } = await supabase.from("expense_reports").select("*").eq("organization_id", org.id).order("created_at", { ascending: false });
    setExpenses(data || []);
  };

  const updateExpenseStatus = async (id: string, status: string) => {
    if (!user) return;
    await supabase.from("expense_reports").update({ status, approved_by: user.id, approved_at: new Date().toISOString() }).eq("id", id);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    toast.success(`Expense ${status}`);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const pendingCount = expenses.filter(e => e.status === "pending").length;
  const approvedTotal = expenses.filter(e => e.status === "approved").reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Category breakdown for chart
  const categoryBreakdown = Object.entries(
    expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category || "general"] = (acc[e.category || "general"] || 0) + Number(e.amount || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: value as number }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 mb-4">
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="glass-card rounded-xl p-4">
          <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">${approvedTotal.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Approved Total</p>
        </motion.div>
      </div>

      {/* Category chart */}
      {categoryBreakdown.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <h4 className="font-semibold text-foreground text-sm mb-3">Expense by Category</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryBreakdown}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

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
                  <p className="text-xs text-muted-foreground">{getName(e.submitted_by)} · {e.category} · {format(new Date(e.created_at), "MMM d, yyyy")}</p>
                  {e.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{e.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-foreground">${Number(e.amount).toLocaleString()}</p>
                  {e.status === "pending" ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="rounded-lg text-xs h-7 text-green-600 border-green-300 hover:bg-green-50" onClick={() => updateExpenseStatus(e.id, "approved")}>Approve</Button>
                      <Button size="sm" variant="outline" className="rounded-lg text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => updateExpenseStatus(e.id, "rejected")}>Reject</Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className={e.status === "approved" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}>{e.status}</Badge>
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

// ==================== FINANCIAL REPORTS ====================
const ReportsTab = () => {
  const { org } = useOrganization();
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org) return;
    Promise.all([
      supabase.from("payroll_records").select("net_pay, period_start, status").eq("organization_id", org.id),
      supabase.from("expense_reports").select("amount, category, status, created_at").eq("organization_id", org.id),
    ]).then(([{ data: payroll }, { data: expenses }]) => {
      // Aggregate payroll by month
      const monthly: Record<string, number> = {};
      (payroll || []).forEach(p => {
        const month = format(new Date(p.period_start), "MMM yyyy");
        monthly[month] = (monthly[month] || 0) + Number(p.net_pay || 0);
      });
      setPayrollData(Object.entries(monthly).map(([month, total]) => ({ month, total })));

      // Expense category summary
      const cats: Record<string, number> = {};
      (expenses || []).forEach(e => {
        cats[e.category || "general"] = (cats[e.category || "general"] || 0) + Number(e.amount || 0);
      });
      setExpenseData(Object.entries(cats).map(([name, value]) => ({ name, value: value as number })));
      setLoading(false);
    });
  }, [org]);

  const totalPayroll = payrollData.reduce((s, d) => s + d.total, 0);
  const totalExpenses = expenseData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-foreground">Financial Summary</h3>

      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <DollarSign className="w-5 h-5 text-accent mb-2" />
          <p className="text-2xl font-bold text-foreground">${totalPayroll.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Payroll Spend</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }} className="glass-card rounded-xl p-4">
          <Receipt className="w-5 h-5 text-destructive mb-2" />
          <p className="text-2xl font-bold text-foreground">${totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Expense Spend</p>
        </motion.div>
      </div>

      {loading ? <div className="h-40 bg-muted rounded-xl animate-pulse" /> : (
        <>
          {payrollData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
              <h4 className="font-semibold text-foreground text-sm mb-4">Monthly Payroll Trend</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={payrollData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="total" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {expenseData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
              <h4 className="font-semibold text-foreground text-sm mb-4">Expense Distribution</h4>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie data={expenseData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expenseData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                </RePieChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

// ==================== MAIN MODULE ====================
const FinanceModule = () => {
  const { loading } = useOrganization();

  if (loading) {
    return <AppLayout title="Finance"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  return (
    <AppLayout title="Finance">
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          eyebrow="Operations"
          icon={DollarSign}
          title="Finance & Accounting"
          subtitle="Payroll management, expense tracking & financial reports"
        />

        <Tabs defaultValue="payroll" className="space-y-4">
          <TabsList className="bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="payroll" className="rounded-lg data-[state=active]:bg-card"><DollarSign className="w-4 h-4 mr-1.5" />Payroll</TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-lg data-[state=active]:bg-card"><Receipt className="w-4 h-4 mr-1.5" />Expenses</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-card"><BarChart3 className="w-4 h-4 mr-1.5" />Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="payroll"><PayrollTab /></TabsContent>
          <TabsContent value="expenses"><ExpensesTab /></TabsContent>
          <TabsContent value="reports"><ReportsTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default FinanceModule;
