import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader, StatCard, PersonAvatar, type Tone } from "@/components/dashboard/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Mail, Users, Clock, CheckCircle, XCircle, Send, Copy, Trash2, KeyRound, ShieldCheck, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { buildTenantUrl, getTenantSlug } from "@/lib/tenant";
import AccessTokenAudit from "@/components/team/AccessTokenAudit";

const roleLabels: Record<string, string> = {
  owner: "Owner", executive: "Executive", manager: "Manager",
  staff: "Staff", contractor: "Contractor", auditor: "Auditor",
};
const roleColors: Record<string, string> = {
  owner: "bg-accent/10 text-accent", executive: "bg-svo-blue/10 text-svo-blue",
  manager: "bg-svo-gold/10 text-svo-gold", staff: "bg-muted text-muted-foreground",
  contractor: "bg-green-500/10 text-green-600", auditor: "bg-destructive/10 text-destructive",
};

const TeamModule = () => {
  const { user } = useAuth();
  const { org, loading: orgLoading } = useOrganization();
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "staff", departmentId: "", jobTitle: "" });
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [tokenForm, setTokenForm] = useState({ role: "staff", departmentId: "", jobTitle: "", expiresHours: "168" });
  const [generating, setGenerating] = useState(false);

  const joinBaseUrl = () => {
    // On a tenant subdomain (or local/preview), stay on the current origin.
    if (getTenantSlug() || !org?.slug) return window.location.origin;
    const host = window.location.hostname;
    if (host === "localhost" || host.endsWith(".preview.example.test") || host.endsWith(".preview.example.test")) {
      return window.location.origin;
    }
    return buildTenantUrl(org.slug);
  };

  const joinLink = (code: string) => `${joinBaseUrl()}/join?code=${code}`;

  const fetchData = async () => {
    if (!org) return;
    const [{ data: profs }, { data: invs }, { data: depts }, { data: userRoles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("organization_id", org.id),
      supabase.from("invitations").select("*").eq("organization_id", org.id).order("created_at", { ascending: false }),
      supabase.from("departments").select("*").eq("organization_id", org.id),
      supabase.from("user_roles").select("*").eq("organization_id", org.id),
    ]);
    setMembers(profs || []);
    setInvitations(invs || []);
    setDepartments(depts || []);
    setRoles(userRoles || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [org]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org) return;
    const insertData: any = {
      organization_id: org.id, email: form.email, role: form.role as any,
      invited_by: user.id, job_title: form.jobTitle || null,
    };
    if (form.departmentId && form.departmentId !== "none") insertData.department_id = form.departmentId;

    const { data, error } = await supabase.from("invitations").insert(insertData).select().single();
    if (error) {
      toast.error(error.message.includes("duplicate") ? "This email has already been invited" : error.message);
      return;
    }
    // Copy invite link
    const inviteLink = `${window.location.origin}/signup?invite=${data.token}`;
    try { await navigator.clipboard.writeText(inviteLink); } catch { /* noop */ }
    toast.success("Invitation sent! Link copied to clipboard.");
    setDialogOpen(false);
    setForm({ email: "", role: "staff", departmentId: "", jobTitle: "" });
    fetchData();
  };

  const revokeInvite = async (id: string) => {
    await supabase.from("invitations").delete().eq("id", id);
    toast.success("Invitation revoked");
    fetchData();
  };

  const copyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/signup?invite=${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  const generateAccessToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    const { data, error } = await supabase.rpc("create_access_token", {
      _role: tokenForm.role as any,
      _department_id: tokenForm.departmentId && tokenForm.departmentId !== "none" ? tokenForm.departmentId : null,
      _job_title: tokenForm.jobTitle || null,
      _expires_hours: Number(tokenForm.expiresHours),
    });
    setGenerating(false);
    const result = data as any;
    if (error || result?.error) {
      toast.error(error?.message || result.error);
      return;
    }
    try { await navigator.clipboard.writeText(joinLink(result.access_code)); } catch { /* noop */ }
    toast.success(`Access token ${result.access_code} generated — join link copied`);
    setTokenDialogOpen(false);
    setTokenForm({ role: "staff", departmentId: "", jobTitle: "", expiresHours: "168" });
    fetchData();
  };

  const copyAccessLink = async (code: string) => {
    await navigator.clipboard.writeText(joinLink(code));
    toast.success("Join link copied!");
  };

  const revokeAccessToken = async (id: string) => {
    const { data, error } = await supabase.rpc("revoke_access_token", { _invitation_id: id });
    const result = data as any;
    if (error || result?.error) { toast.error(error?.message || result.error); return; }
    toast.success("Access token revoked");
    fetchData();
  };

  const memberNames: Record<string, string> = Object.fromEntries(members.map(m => [m.id, m.full_name]));

  const emailInvites = invitations.filter(i => !i.access_code);
  const accessTokens = invitations.filter(i => i.access_code);

  const getUserRole = (userId: string) => {
    const r = roles.find(r => r.user_id === userId);
    return r?.role || "staff";
  };

  const getDeptName = (id: string | null) => departments.find(d => d.id === id)?.name || "—";

  if (orgLoading) {
    return <AppLayout title="Team"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  return (
    <AppLayout title="Team">
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          eyebrow="People"
          icon={Users}
          title="Team Management"
          subtitle="Manage members, invitations & access tokens"
          actions={<>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-accent text-accent-foreground w-full sm:w-auto"><UserPlus className="w-4 h-4 mr-1" /> Invite Member</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
              <form onSubmit={sendInvite} className="space-y-4">
                <div className="space-y-2"><Label>Email Address</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="colleague@company.com" className="rounded-xl" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Role</Label>
                    <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Department</Label>
                    <Select value={form.departmentId || "none"} onValueChange={v => setForm({ ...form, departmentId: v })}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Department</SelectItem>
                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Job Title (optional)</Label><Input value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} placeholder="Software Engineer" className="rounded-xl" /></div>
                <Button type="submit" className="w-full rounded-xl bg-accent text-accent-foreground"><Send className="w-4 h-4 mr-1" /> Send Invitation</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl w-full sm:w-auto"><KeyRound className="w-4 h-4 mr-1" /> Generate Access Token</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>Generate Single-Use Access Token</DialogTitle></DialogHeader>
              <form onSubmit={generateAccessToken} className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Share the generated link with a new member. It works only on your organization's own space, grants the role
                  you choose, and expires the moment it is used.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Role</Label>
                    <Select value={tokenForm.role} onValueChange={v => setTokenForm({ ...tokenForm, role: v })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Valid for</Label>
                    <Select value={tokenForm.expiresHours} onValueChange={v => setTokenForm({ ...tokenForm, expiresHours: v })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="72">3 days</SelectItem>
                        <SelectItem value="168">7 days</SelectItem>
                        <SelectItem value="720">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Department</Label>
                  <Select value={tokenForm.departmentId || "none"} onValueChange={v => setTokenForm({ ...tokenForm, departmentId: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Department</SelectItem>
                      {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Job Title (optional)</Label><Input value={tokenForm.jobTitle} onChange={e => setTokenForm({ ...tokenForm, jobTitle: e.target.value })} placeholder="Operations Analyst" className="rounded-xl" /></div>
                <Button type="submit" disabled={generating} className="w-full rounded-xl bg-accent text-accent-foreground"><KeyRound className="w-4 h-4 mr-1" /> {generating ? "Generating…" : "Generate Token"}</Button>
              </form>
            </DialogContent>
          </Dialog>
          </>}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Team Members", value: members.length, icon: Users, tone: "blue" as Tone },
            { label: "Pending Invites", value: invitations.filter(i => i.status === "pending").length, icon: Mail, tone: "gold" as Tone },
            { label: "Departments", value: departments.length, icon: CheckCircle, tone: "emerald" as Tone },
          ].map((s, i) => (
            <StatCard key={s.label} index={i} label={s.label} value={s.value} icon={s.icon} tone={s.tone} />
          ))}
        </div>

        <Tabs defaultValue="members">
          <TabsList className="bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="members" className="rounded-lg data-[state=active]:bg-card"><Users className="w-3.5 h-3.5 mr-1" />Members</TabsTrigger>
            <TabsTrigger value="invitations" className="rounded-lg data-[state=active]:bg-card"><Mail className="w-3.5 h-3.5 mr-1" />Invitations</TabsTrigger>
            <TabsTrigger value="tokens" className="rounded-lg data-[state=active]:bg-card"><KeyRound className="w-3.5 h-3.5 mr-1" />Access Tokens</TabsTrigger>
            <TabsTrigger value="audit" className="rounded-lg data-[state=active]:bg-card"><ScrollText className="w-3.5 h-3.5 mr-1" />Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-4 space-y-3">
            {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div> :
              members.map((m, i) => {
                const role = getUserRole(m.id);
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                    className="glass-card-strong rounded-xl p-4 flex items-center gap-4"
                  >
                    <PersonAvatar name={m.full_name} src={m.avatar_url} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground truncate">{m.full_name}</h4>
                        <Badge variant="outline" className={`text-[10px] ${roleColors[role] || ""}`}>{roleLabels[role] || role}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{m.job_title || "No title"} · {getDeptName(m.department_id)}</p>
                    </div>
                  </motion.div>
                );
              })}
          </TabsContent>

          <TabsContent value="invitations" className="mt-4 space-y-3">
            {emailInvites.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No invitations sent yet</p>
              </div>
            ) : emailInvites.map((inv, i) => (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                className="glass-card-strong rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground text-sm truncate">{inv.email}</span>
                    <Badge variant="outline" className={`text-[10px] ${roleColors[inv.role] || ""}`}>{roleLabels[inv.role] || inv.role}</Badge>
                    <Badge variant="outline" className={inv.status === "pending" ? "bg-svo-gold/10 text-svo-gold" : inv.status === "accepted" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}>
                      {inv.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {inv.job_title && `${inv.job_title} · `}Sent {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                    {inv.status === "pending" && ` · Expires ${formatDistanceToNow(new Date(inv.expires_at), { addSuffix: true })}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {inv.status === "pending" && (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 rounded-lg" onClick={() => copyInviteLink(inv.token)}><Copy className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 rounded-lg text-destructive" onClick={() => revokeInvite(inv.id)}><Trash2 className="w-3 h-3" /></Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="tokens" className="mt-4 space-y-3">
            <div className="glass-card rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Access tokens are single-use. Each token grants exactly one role, is bound to this organization's space,
                and is burned the instant a member joins — nobody can walk in uninvited.
              </p>
            </div>
            {accessTokens.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <KeyRound className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No access tokens generated yet</p>
              </div>
            ) : accessTokens.map((inv, i) => (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                className="glass-card-strong rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm tracking-widest text-foreground">{inv.access_code}</span>
                    <Badge variant="outline" className={`text-[10px] ${roleColors[inv.role] || ""}`}>{roleLabels[inv.role] || inv.role}</Badge>
                    <Badge variant="outline" className={inv.status === "pending" ? "bg-svo-gold/10 text-svo-gold" : inv.status === "revoked" ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"}>
                      {inv.status === "pending" ? (new Date(inv.expires_at) < new Date() ? "expired" : "unused") : inv.status === "revoked" ? "revoked" : "used"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {inv.job_title && `${inv.job_title} · `}{getDeptName(inv.department_id)} · Created {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                    {inv.status === "pending" && ` · Expires ${formatDistanceToNow(new Date(inv.expires_at), { addSuffix: true })}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {inv.status === "pending" && (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 rounded-lg" onClick={() => copyAccessLink(inv.access_code)}><Copy className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 rounded-lg text-destructive" onClick={() => revokeAccessToken(inv.id)}><Trash2 className="w-3 h-3" /></Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <AccessTokenAudit organizationId={org?.id} memberNames={memberNames} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TeamModule;
