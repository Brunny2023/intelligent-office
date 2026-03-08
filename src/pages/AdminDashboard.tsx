import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users, CheckSquare, Clock, Ticket, TrendingUp, AlertTriangle,
  ShieldCheck, UserCog, BarChart3, FileText
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface MemberRow {
  id: string;
  full_name: string;
  job_title: string | null;
  avatar_url: string | null;
  role: string;
}

interface TicketRow {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  created_by: string;
  creator_name?: string;
}

interface OrgMetrics {
  totalMembers: number;
  totalTasks: number;
  completedTasks: number;
  openTickets: number;
  attendanceToday: number;
  activeProjects: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [metrics, setMetrics] = useState<OrgMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org || roleLoading) return;
    if (!isAdmin) { navigate("/dashboard"); return; }

    const load = async () => {
      // Fetch members with roles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, job_title, avatar_url")
        .eq("organization_id", org.id);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("organization_id", org.id);

      const roleMap: Record<string, string> = {};
      (roles || []).forEach(r => { roleMap[r.user_id] = r.role; });

      const memberList = (profiles || []).map(p => ({
        ...p,
        role: roleMap[p.id] || "staff",
      }));
      setMembers(memberList);

      // Metrics
      const { count: taskCount } = await supabase.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", org.id);
      const { count: completedCount } = await supabase.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", org.id).eq("status", "completed");
      const { count: ticketCount } = await supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("organization_id", org.id).in("status", ["open", "in_progress"]);
      const today = new Date().toISOString().split("T")[0];
      const { count: attendanceCount } = await supabase.from("attendance_records").select("id", { count: "exact", head: true }).eq("organization_id", org.id).gte("clock_in", today);
      const { count: projectCount } = await supabase.from("projects").select("id", { count: "exact", head: true }).eq("organization_id", org.id).eq("status", "active");

      setMetrics({
        totalMembers: memberList.length,
        totalTasks: taskCount || 0,
        completedTasks: completedCount || 0,
        openTickets: ticketCount || 0,
        attendanceToday: attendanceCount || 0,
        activeProjects: projectCount || 0,
      });

      // Tickets
      const { data: ticketData } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (ticketData) {
        const creatorIds = [...new Set(ticketData.map(t => t.created_by))];
        const { data: creatorProfiles } = await supabase.from("profiles").select("id, full_name").in("id", creatorIds);
        const nameMap: Record<string, string> = {};
        (creatorProfiles || []).forEach(p => { nameMap[p.id] = p.full_name; });

        setTickets(ticketData.map(t => ({ ...t, creator_name: nameMap[t.created_by] || t.created_by.slice(0, 8) })));
      }

      setLoading(false);
    };
    load();
  }, [org, isAdmin, roleLoading, navigate]);

  const updateRole = async (userId: string, newRole: string) => {
    if (!org) return;
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole as any })
      .eq("user_id", userId)
      .eq("organization_id", org.id);
    if (error) { toast.error("Failed to update role"); return; }
    setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
    toast.success("Role updated");
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    const { error } = await supabase.from("support_tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", ticketId);
    if (error) { toast.error("Failed"); return; }
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
    toast.success(`Ticket ${status}`);
  };

  if (roleLoading || loading) {
    return (
      <AppLayout title="Admin">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const statCards = [
    { label: "Team Members", value: metrics?.totalMembers || 0, icon: Users, color: "text-svo-blue" },
    { label: "Active Projects", value: metrics?.activeProjects || 0, icon: BarChart3, color: "text-accent" },
    { label: "Tasks (Done/Total)", value: `${metrics?.completedTasks || 0}/${metrics?.totalTasks || 0}`, icon: CheckSquare, color: "text-green-500" },
    { label: "Clocked In Today", value: metrics?.attendanceToday || 0, icon: Clock, color: "text-svo-blue-light" },
    { label: "Open Tickets", value: metrics?.openTickets || 0, icon: Ticket, color: "text-destructive" },
    { label: "Completion Rate", value: metrics && metrics.totalTasks > 0 ? `${Math.round((metrics.completedTasks / metrics.totalTasks) * 100)}%` : "—", icon: TrendingUp, color: "text-accent" },
  ];

  return (
    <AppLayout title="Admin Dashboard">
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-accent" /> Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Organization overview and management</p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-[11px] text-muted-foreground">{s.label}</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="members" className="gap-1.5"><UserCog className="w-4 h-4" /> Members</TabsTrigger>
            <TabsTrigger value="tickets" className="gap-1.5"><Ticket className="w-4 h-4" /> Support Tickets</TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5" /> User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map(m => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.full_name}</TableCell>
                          <TableCell className="text-muted-foreground">{m.job_title || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={m.role === "owner" ? "default" : "secondary"} className="capitalize">
                              {m.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {m.id !== user?.id && (
                              <Select value={m.role} onValueChange={(v) => updateRole(m.id, v)}>
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {["owner", "executive", "manager", "staff", "contractor", "auditor"].map(r => (
                                    <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Ticket className="w-5 h-5" /> Support Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No support tickets yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets.map(t => (
                          <TableRow key={t.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              <button onClick={() => navigate(`/support/${t.id}`)} className="text-accent hover:underline text-left">
                                {t.subject}
                              </button>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{t.creator_name}</TableCell>
                            <TableCell>
                              <Badge variant={t.priority === "high" || t.priority === "urgent" ? "destructive" : "secondary"} className="capitalize text-[10px]">
                                {t.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={t.status === "open" ? "default" : t.status === "resolved" ? "secondary" : "outline"} className="capitalize text-[10px]">
                                {t.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{format(new Date(t.created_at), "MMM d, HH:mm")}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate(`/support/${t.id}`)}>View</Button>
                                {t.status !== "resolved" && (
                                  <Button size="sm" variant="ghost" className="h-7 text-xs text-green-600" onClick={() => updateTicketStatus(t.id, "resolved")}>Resolve</Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
