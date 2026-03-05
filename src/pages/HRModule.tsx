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
import { motion, AnimatePresence } from "framer-motion";
import { Users, Briefcase, Plus, UserPlus, UserMinus, Star, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useStaffMetrics } from "@/hooks/useStaffMetrics";

// ==================== JOB POSTINGS ====================
const JobPostingsTab = () => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const [postings, setPostings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", requirements: "", employmentType: "full-time", location: "remote", salaryRange: "" });

  useEffect(() => {
    if (!org) return;
    supabase.from("job_postings").select("*").eq("organization_id", org.id).order("created_at", { ascending: false })
      .then(({ data }) => { setPostings(data || []); setLoading(false); });
  }, [org]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org) return;
    const { error } = await supabase.from("job_postings").insert({
      organization_id: org.id, title: form.title, description: form.description,
      requirements: form.requirements, employment_type: form.employmentType,
      location: form.location, salary_range: form.salaryRange, created_by: user.id,
    });
    if (error) { toast.error("Failed to create posting"); return; }
    toast.success("Job posting created!");
    setDialogOpen(false);
    setForm({ title: "", description: "", requirements: "", employmentType: "full-time", location: "remote", salaryRange: "" });
    const { data } = await supabase.from("job_postings").select("*").eq("organization_id", org.id).order("created_at", { ascending: false });
    setPostings(data || []);
  };

  const statusColors: Record<string, string> = {
    open: "bg-green-500/10 text-green-600", closed: "bg-muted text-muted-foreground", filled: "bg-svo-blue/10 text-svo-blue",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Job Postings</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl bg-accent text-accent-foreground"><Plus className="w-4 h-4 mr-1" /> New Posting</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Job Posting</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Senior Developer" className="rounded-xl" required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-xl resize-none" rows={3} /></div>
              <div className="space-y-2"><Label>Requirements</Label><Textarea value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})} className="rounded-xl resize-none" rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Type</Label>
                  <Select value={form.employmentType} onValueChange={v => setForm({...form, employmentType: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="rounded-xl" /></div>
              </div>
              <div className="space-y-2"><Label>Salary Range</Label><Input value={form.salaryRange} onChange={e => setForm({...form, salaryRange: e.target.value})} placeholder="e.g. $80k - $120k" className="rounded-xl" /></div>
              <Button type="submit" className="w-full rounded-xl bg-accent text-accent-foreground">Create Posting</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? <div className="h-20 bg-muted rounded-xl animate-pulse" /> : postings.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center"><Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No job postings yet</p></div>
      ) : (
        <div className="space-y-3">
          {postings.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">{p.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{p.employment_type} · {p.location}</p>
                  {p.salary_range && <p className="text-xs text-accent mt-1">{p.salary_range}</p>}
                </div>
                <Badge variant="outline" className={statusColors[p.status] || ""}>{p.status}</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== CANDIDATES ====================
const CandidatesTab = () => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", notes: "" });

  useEffect(() => {
    if (!org) return;
    supabase.from("candidates").select("*").eq("organization_id", org.id).order("created_at", { ascending: false })
      .then(({ data }) => { setCandidates(data || []); setLoading(false); });
  }, [org]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org) return;
    const { error } = await supabase.from("candidates").insert({
      organization_id: org.id, full_name: form.fullName, email: form.email,
      phone: form.phone || null, notes: form.notes || null, created_by: user.id,
    });
    if (error) { toast.error("Failed to add candidate"); return; }
    toast.success("Candidate added!");
    setDialogOpen(false);
    const { data } = await supabase.from("candidates").select("*").eq("organization_id", org.id).order("created_at", { ascending: false });
    setCandidates(data || []);
  };

  const stageColors: Record<string, string> = {
    applied: "bg-svo-blue/10 text-svo-blue", screening: "bg-accent/10 text-accent",
    interview: "bg-svo-gold/10 text-svo-gold", offer: "bg-green-500/10 text-green-600",
    hired: "bg-green-600/10 text-green-700", rejected: "bg-destructive/10 text-destructive",
  };

  const updateStage = async (id: string, stage: string) => {
    await supabase.from("candidates").update({ stage, updated_at: new Date().toISOString() }).eq("id", id);
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
    toast.success(`Moved to ${stage}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Candidates</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl bg-accent text-accent-foreground"><UserPlus className="w-4 h-4 mr-1" /> Add Candidate</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Add Candidate</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Full Name</Label><Input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="rounded-xl" required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-xl" required /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="rounded-xl resize-none" rows={2} /></div>
              <Button type="submit" className="w-full rounded-xl bg-accent text-accent-foreground">Add Candidate</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? <div className="h-20 bg-muted rounded-xl animate-pulse" /> : candidates.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center"><UserPlus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No candidates yet</p></div>
      ) : (
        <div className="space-y-3">
          {candidates.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">{c.full_name}</h4>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                </div>
                <Select value={c.stage} onValueChange={v => updateStage(c.id, v)}>
                  <SelectTrigger className="w-28 h-7 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(stageColors).map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== STAFF DIRECTORY WITH PERFORMANCE ====================
const StaffDirectoryTab = () => {
  const { org } = useOrganization();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org) return;
    supabase.from("profiles").select("id, full_name, job_title, avatar_url, department_id").eq("organization_id", org.id)
      .then(({ data }) => { setStaff(data || []); setLoading(false); });
  }, [org]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Staff Directory & Metrics</h3>
      {loading ? <div className="h-20 bg-muted rounded-xl animate-pulse" /> : (
        <div className="grid sm:grid-cols-2 gap-4">
          {staff.map((s, i) => (
            <StaffCard key={s.id} staff={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

const StaffCard = ({ staff, index }: { staff: any; index: number }) => {
  const { metrics, loading } = useStaffMetrics(staff.id);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
      whileHover={{ y: -2 }}
      className="glass-card rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
          {staff.full_name?.charAt(0) || "?"}
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm">{staff.full_name}</h4>
          <p className="text-xs text-muted-foreground">{staff.job_title || "Team Member"}</p>
        </div>
      </div>
      {loading ? <div className="h-8 bg-muted rounded animate-pulse" /> : metrics && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">{metrics.taskCompletionRate}%</p>
            <p className="text-[10px] text-muted-foreground">Tasks</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{metrics.attendanceRate}%</p>
            <p className="text-[10px] text-muted-foreground">Attendance</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{metrics.pendingTasks}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ==================== TERMINATIONS ====================
const TerminationsTab = () => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const { resolve, getName } = useProfileNames();
  const [terminations, setTerminations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org) return;
    supabase.from("terminations").select("*").eq("organization_id", org.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        setTerminations(data || []);
        if (data) resolve(data.map(t => t.user_id));
        setLoading(false);
      });
  }, [org]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Termination Records</h3>
      {loading ? <div className="h-20 bg-muted rounded-xl animate-pulse" /> : terminations.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center"><UserMinus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No termination records</p></div>
      ) : (
        <div className="space-y-3">
          {terminations.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: i * 0.05 } }} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">{getName(t.user_id)}</h4>
                  <p className="text-xs text-muted-foreground capitalize">{t.termination_type} · {t.reason || "No reason specified"}</p>
                </div>
                <Badge variant="outline" className={t.status === "completed" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}>{t.status}</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== MAIN MODULE ====================
const HRModule = () => {
  const { loading } = useOrganization();

  if (loading) {
    return (
      <AppLayout title="HR"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>
    );
  }

  return (
    <AppLayout title="HR">
      <div className="p-6 md:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Human Resources</h1>
          <p className="text-muted-foreground mt-1">Recruitment, onboarding, performance & offboarding</p>
        </motion.div>

        <Tabs defaultValue="postings" className="space-y-4">
          <TabsList className="bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="postings" className="rounded-lg data-[state=active]:bg-card"><Briefcase className="w-4 h-4 mr-1.5" />Postings</TabsTrigger>
            <TabsTrigger value="candidates" className="rounded-lg data-[state=active]:bg-card"><UserPlus className="w-4 h-4 mr-1.5" />Candidates</TabsTrigger>
            <TabsTrigger value="staff" className="rounded-lg data-[state=active]:bg-card"><TrendingUp className="w-4 h-4 mr-1.5" />Staff Metrics</TabsTrigger>
            <TabsTrigger value="terminations" className="rounded-lg data-[state=active]:bg-card"><UserMinus className="w-4 h-4 mr-1.5" />Offboarding</TabsTrigger>
          </TabsList>
          <TabsContent value="postings"><JobPostingsTab /></TabsContent>
          <TabsContent value="candidates"><CandidatesTab /></TabsContent>
          <TabsContent value="staff"><StaffDirectoryTab /></TabsContent>
          <TabsContent value="terminations"><TerminationsTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default HRModule;
