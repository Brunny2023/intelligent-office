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
import { motion, AnimatePresence } from "framer-motion";
import { Users, Briefcase, Plus, UserPlus, UserMinus, Star, TrendingUp, ClipboardCheck, Award } from "lucide-react";
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

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("job_postings").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setPostings(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    toast.success(`Status updated to ${status}`);
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
                  {p.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={p.status} onValueChange={v => updateStatus(p.id, v)}>
                    <SelectTrigger className="w-24 h-7 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="filled">Filled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
  const [postings, setPostings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", notes: "", jobPostingId: "" });

  useEffect(() => {
    if (!org) return;
    Promise.all([
      supabase.from("candidates").select("*").eq("organization_id", org.id).order("created_at", { ascending: false }),
      supabase.from("job_postings").select("id, title").eq("organization_id", org.id).eq("status", "open"),
    ]).then(([{ data: cands }, { data: posts }]) => {
      setCandidates(cands || []);
      setPostings(posts || []);
      setLoading(false);
    });
  }, [org]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org) return;
    const { error } = await supabase.from("candidates").insert({
      organization_id: org.id, full_name: form.fullName, email: form.email,
      phone: form.phone || null, notes: form.notes || null, created_by: user.id,
      job_posting_id: form.jobPostingId || null,
    });
    if (error) { toast.error("Failed to add candidate"); return; }
    toast.success("Candidate added!");
    setDialogOpen(false);
    setForm({ fullName: "", email: "", phone: "", notes: "", jobPostingId: "" });
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
    // Wave 5 rewire: offer/hire milestones deserve a CHRO+CFO deliberation
    // (comp band fit, headcount plan impact, onboarding plan).
    if (stage === "offer" || stage === "hired") {
      const cand = (await supabase.from("candidates").select("full_name, email, job_posting_id").eq("id", id).maybeSingle()).data;
      if (cand) {
        const { triggerCognition } = await import("@/lib/cognition");
        void triggerCognition(
          `Candidate ${cand.full_name} moved to "${stage}". Deliberate on comp band, headcount plan impact, onboarding plan, and any risk.`,
        );
      }
    }
  };

  const updateRating = async (id: string, rating: number) => {
    await supabase.from("candidates").update({ rating }).eq("id", id);
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, rating } : c));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Candidates Pipeline</h3>
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
              {postings.length > 0 && (
                <div className="space-y-2"><Label>Job Posting</Label>
                  <Select value={form.jobPostingId} onValueChange={v => setForm({...form, jobPostingId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select position" /></SelectTrigger>
                    <SelectContent>{postings.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="rounded-xl resize-none" rows={2} /></div>
              <Button type="submit" className="w-full rounded-xl bg-accent text-accent-foreground">Add Candidate</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Object.keys(stageColors).map(stage => (
          <div key={stage} className={`rounded-lg p-2 text-center ${stageColors[stage]}`}>
            <p className="text-lg font-bold">{candidates.filter(c => c.stage === stage).length}</p>
            <p className="text-[10px] capitalize">{stage}</p>
          </div>
        ))}
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
                  <p className="text-xs text-muted-foreground">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                  {c.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.notes}</p>}
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => updateRating(c.id, s)}>
                        <Star className={`w-3.5 h-3.5 ${s <= (c.rating || 0) ? "text-svo-gold fill-svo-gold" : "text-muted-foreground/30"}`} />
                      </button>
                    ))}
                  </div>
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
      {loading ? <div className="h-20 bg-muted rounded-xl animate-pulse" /> : staff.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center"><Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No staff members</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {staff.map((s, i) => <StaffCard key={s.id} staff={s} index={i} />)}
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
        <div className="grid grid-cols-4 gap-2 text-center">
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
          <div>
            <p className="text-lg font-bold text-foreground">{metrics.overdueTasks}</p>
            <p className="text-[10px] text-muted-foreground text-destructive">Overdue</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ==================== PERFORMANCE REVIEWS ====================
const PerformanceReviewsTab = () => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const { resolve, getName } = useProfileNames();
  const [reviews, setReviews] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    userId: "", periodStart: "", periodEnd: "",
    overallRating: "3", qualityScore: "3", communicationScore: "3",
    strengths: "", improvements: "", comments: "",
  });

  useEffect(() => {
    if (!org) return;
    Promise.all([
      supabase.from("performance_reviews").select("*").eq("organization_id", org.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name").eq("organization_id", org.id),
    ]).then(([{ data: revs }, { data: profiles }]) => {
      setReviews(revs || []);
      setStaff(profiles || []);
      if (revs) resolve([...revs.map(r => r.user_id), ...revs.map(r => r.reviewer_id)]);
      setLoading(false);
    });
  }, [org]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org) return;
    const { error } = await supabase.from("performance_reviews").insert({
      organization_id: org.id, user_id: form.userId, reviewer_id: user.id,
      review_period_start: form.periodStart, review_period_end: form.periodEnd,
      overall_rating: parseInt(form.overallRating), quality_score: parseInt(form.qualityScore),
      communication_score: parseInt(form.communicationScore),
      strengths: form.strengths || null, improvements: form.improvements || null,
      comments: form.comments || null, status: "published",
    });
    if (error) { toast.error("Failed to create review"); return; }
    toast.success("Performance review created!");
    setDialogOpen(false);
    const { data } = await supabase.from("performance_reviews").select("*").eq("organization_id", org.id).order("created_at", { ascending: false });
    setReviews(data || []);
  };

  const ratingColor = (r: number) => r >= 4 ? "text-green-600" : r >= 3 ? "text-svo-gold" : "text-destructive";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Performance Reviews</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl bg-accent text-accent-foreground"><Plus className="w-4 h-4 mr-1" /> New Review</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Performance Review</DialogTitle></DialogHeader>
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
                <div className="space-y-2"><Label>Overall (1-5)</Label><Input type="number" min="1" max="5" value={form.overallRating} onChange={e => setForm({...form, overallRating: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-2"><Label>Quality (1-5)</Label><Input type="number" min="1" max="5" value={form.qualityScore} onChange={e => setForm({...form, qualityScore: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-2"><Label>Comms (1-5)</Label><Input type="number" min="1" max="5" value={form.communicationScore} onChange={e => setForm({...form, communicationScore: e.target.value})} className="rounded-xl" /></div>
              </div>
              <div className="space-y-2"><Label>Strengths</Label><Textarea value={form.strengths} onChange={e => setForm({...form, strengths: e.target.value})} className="rounded-xl resize-none" rows={2} /></div>
              <div className="space-y-2"><Label>Areas for Improvement</Label><Textarea value={form.improvements} onChange={e => setForm({...form, improvements: e.target.value})} className="rounded-xl resize-none" rows={2} /></div>
              <div className="space-y-2"><Label>Comments</Label><Textarea value={form.comments} onChange={e => setForm({...form, comments: e.target.value})} className="rounded-xl resize-none" rows={2} /></div>
              <Button type="submit" className="w-full rounded-xl bg-accent text-accent-foreground">Submit Review</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? <div className="h-20 bg-muted rounded-xl animate-pulse" /> : reviews.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center"><ClipboardCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No performance reviews yet</p></div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }} className="glass-card rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">{getName(r.user_id)}</h4>
                  <p className="text-xs text-muted-foreground">Reviewed by {getName(r.reviewer_id)} · {format(new Date(r.review_period_start), "MMM yyyy")} — {format(new Date(r.review_period_end), "MMM yyyy")}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Award className={`w-4 h-4 ${ratingColor(r.overall_rating || 0)}`} />
                  <span className={`text-lg font-bold ${ratingColor(r.overall_rating || 0)}`}>{r.overall_rating || "—"}/5</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-muted/50 rounded-lg p-2"><p className="font-bold text-foreground">{r.quality_score || "—"}/5</p><p className="text-muted-foreground">Quality</p></div>
                <div className="bg-muted/50 rounded-lg p-2"><p className="font-bold text-foreground">{r.communication_score || "—"}/5</p><p className="text-muted-foreground">Communication</p></div>
                <div className="bg-muted/50 rounded-lg p-2"><p className="font-bold text-foreground">{r.task_completion_rate || 0}%</p><p className="text-muted-foreground">Task Rate</p></div>
              </div>
              {r.strengths && <p className="text-xs text-muted-foreground"><strong className="text-foreground">Strengths:</strong> {r.strengths}</p>}
              {r.improvements && <p className="text-xs text-muted-foreground"><strong className="text-foreground">Improvements:</strong> {r.improvements}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== TERMINATIONS ====================
const TerminationsTab = () => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const { resolve, getName } = useProfileNames();
  const [terminations, setTerminations] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ userId: "", terminationType: "voluntary", reason: "", lastWorkingDay: "", exitNotes: "" });

  useEffect(() => {
    if (!org) return;
    Promise.all([
      supabase.from("terminations").select("*").eq("organization_id", org.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name").eq("organization_id", org.id),
    ]).then(([{ data: terms }, { data: profiles }]) => {
      setTerminations(terms || []);
      setStaff(profiles || []);
      if (terms) resolve(terms.map(t => t.user_id));
      setLoading(false);
    });
  }, [org]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org) return;
    const { error } = await supabase.from("terminations").insert({
      organization_id: org.id, user_id: form.userId, terminated_by: user.id,
      termination_type: form.terminationType, reason: form.reason || null,
      last_working_day: form.lastWorkingDay || null, exit_interview_notes: form.exitNotes || null,
    });
    if (error) { toast.error("Failed to create termination record"); return; }
    toast.success("Termination record created");
    // Wave 5 rewire: every termination triggers CHRO + CLO deliberation
    // (legal exposure, coverage, communication plan) — advisory only.
    {
      const emp = staff.find((s: any) => s.id === form.userId);
      const { triggerCognition } = await import("@/lib/cognition");
      void triggerCognition(
        `Termination initiated for ${emp?.full_name ?? "employee"} (${form.terminationType}). Reason: ${form.reason || "not provided"}. Advise on legal exposure, coverage plan, and communication.`,
      );
    }
    setDialogOpen(false);
    setForm({ userId: "", terminationType: "voluntary", reason: "", lastWorkingDay: "", exitNotes: "" });
    const { data } = await supabase.from("terminations").select("*").eq("organization_id", org.id).order("created_at", { ascending: false });
    setTerminations(data || []);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("terminations").update({ status }).eq("id", id);
    setTerminations(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    toast.success(`Status updated to ${status}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Termination & Offboarding</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="destructive" className="rounded-xl"><UserMinus className="w-4 h-4 mr-1" /> Initiate</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Initiate Termination</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Employee</Label>
                <Select value={form.userId} onValueChange={v => setForm({...form, userId: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Type</Label>
                <Select value={form.terminationType} onValueChange={v => setForm({...form, terminationType: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voluntary">Voluntary (Resignation)</SelectItem>
                    <SelectItem value="involuntary">Involuntary (Termination)</SelectItem>
                    <SelectItem value="layoff">Layoff</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="contract_end">Contract End</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Reason</Label><Textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="rounded-xl resize-none" rows={2} /></div>
              <div className="space-y-2"><Label>Last Working Day</Label><Input type="date" value={form.lastWorkingDay} onChange={e => setForm({...form, lastWorkingDay: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-2"><Label>Exit Interview Notes</Label><Textarea value={form.exitNotes} onChange={e => setForm({...form, exitNotes: e.target.value})} className="rounded-xl resize-none" rows={2} /></div>
              <Button type="submit" variant="destructive" className="w-full rounded-xl">Submit Termination</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
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
                  {t.last_working_day && <p className="text-xs text-muted-foreground">Last day: {format(new Date(t.last_working_day), "MMM d, yyyy")}</p>}
                  {t.exit_interview_notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Notes: {t.exit_interview_notes}</p>}
                </div>
                <Select value={t.status} onValueChange={v => updateStatus(t.id, v)}>
                  <SelectTrigger className="w-28 h-7 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
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

// ==================== MAIN MODULE ====================
const HRModule = () => {
  const { loading } = useOrganization();

  if (loading) {
    return <AppLayout title="HR"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  return (
    <AppLayout title="HR">
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          eyebrow="People Operations"
          icon={Briefcase}
          title="Human Resources"
          subtitle="Recruitment, onboarding, performance reviews & offboarding"
        />

        <Tabs defaultValue="postings" className="space-y-4">
          <TabsList className="bg-muted/50 rounded-xl p-1 w-full grid grid-cols-3 sm:grid-cols-5 gap-1 h-auto">
            <TabsTrigger value="postings" className="rounded-lg data-[state=active]:bg-card text-xs sm:text-sm px-2 py-1.5"><Briefcase className="w-3.5 h-3.5 mr-1 shrink-0" /><span className="truncate">Postings</span></TabsTrigger>
            <TabsTrigger value="candidates" className="rounded-lg data-[state=active]:bg-card text-xs sm:text-sm px-2 py-1.5"><UserPlus className="w-3.5 h-3.5 mr-1 shrink-0" /><span className="truncate">Candidates</span></TabsTrigger>
            <TabsTrigger value="staff" className="rounded-lg data-[state=active]:bg-card text-xs sm:text-sm px-2 py-1.5"><TrendingUp className="w-3.5 h-3.5 mr-1 shrink-0" /><span className="truncate">Staff</span></TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-card text-xs sm:text-sm px-2 py-1.5"><ClipboardCheck className="w-3.5 h-3.5 mr-1 shrink-0" /><span className="truncate">Reviews</span></TabsTrigger>
            <TabsTrigger value="terminations" className="rounded-lg data-[state=active]:bg-card text-xs sm:text-sm px-2 py-1.5"><UserMinus className="w-3.5 h-3.5 mr-1 shrink-0" /><span className="truncate">Offboarding</span></TabsTrigger>
          </TabsList>
          <TabsContent value="postings"><JobPostingsTab /></TabsContent>
          <TabsContent value="candidates"><CandidatesTab /></TabsContent>
          <TabsContent value="staff"><StaffDirectoryTab /></TabsContent>
          <TabsContent value="reviews"><PerformanceReviewsTab /></TabsContent>
          <TabsContent value="terminations"><TerminationsTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default HRModule;
