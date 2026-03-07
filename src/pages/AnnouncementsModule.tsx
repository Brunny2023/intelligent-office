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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Plus, Bell, CheckCircle, Eye, AlertTriangle, Clock, Send, FileEdit } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-svo-blue/10 text-svo-blue",
  high: "bg-accent/10 text-accent",
  urgent: "bg-destructive/10 text-destructive",
};

const AnnouncementsModule = () => {
  const { user } = useAuth();
  const { org, loading: orgLoading } = useOrganization();
  const { resolve, getName } = useProfileNames();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [reads, setReads] = useState<Record<string, any>>({});
  const [readCounts, setReadCounts] = useState<Record<string, number>>({});
  const [totalStaff, setTotalStaff] = useState(0);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("published");
  const [form, setForm] = useState({
    title: "", content: "", priority: "normal", isMandatory: false,
    departmentId: "all", scheduledAt: "", status: "published",
  });

  const fetchData = async () => {
    if (!org || !user) return;
    const statusFilter = activeTab === "drafts" ? "draft" : "published";
    const [{ data: anns }, { data: myReads }, { count: staffCount }, { data: depts }] = await Promise.all([
      supabase.from("announcements").select("*").eq("organization_id", org.id).eq("status", statusFilter).order("created_at", { ascending: false }),
      supabase.from("announcement_reads").select("*").eq("user_id", user.id),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("organization_id", org.id),
      supabase.from("departments").select("*").eq("organization_id", org.id),
    ]);
    const annList = anns || [];
    setAnnouncements(annList);
    setTotalStaff(staffCount || 0);
    setDepartments(depts || []);

    const readsMap: Record<string, any> = {};
    (myReads || []).forEach(r => { readsMap[r.announcement_id] = r; });
    setReads(readsMap);

    if (annList.length > 0) {
      const ids = annList.map(a => a.id);
      const { data: allReads } = await supabase.from("announcement_reads").select("announcement_id").in("announcement_id", ids);
      const counts: Record<string, number> = {};
      (allReads || []).forEach(r => { counts[r.announcement_id] = (counts[r.announcement_id] || 0) + 1; });
      setReadCounts(counts);
    }

    resolve(annList.map(a => a.created_by));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [org, user, activeTab]);

  useEffect(() => {
    if (!org) return;
    const channel = supabase.channel("announcements-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements", filter: `organization_id=eq.${org.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [org]);

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    if (!user || !org) return;
    const status = asDraft ? "draft" : "published";
    const insertData: any = {
      organization_id: org.id, title: form.title, content: form.content,
      priority: form.priority, is_mandatory: form.isMandatory, created_by: user.id,
      status,
    };
    if (form.departmentId !== "all") insertData.department_id = form.departmentId;
    if (status === "published") insertData.published_at = form.scheduledAt || new Date().toISOString();
    
    const { error } = await supabase.from("announcements").insert(insertData);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success(asDraft ? "Draft saved!" : "Announcement published!");
    setDialogOpen(false);
    setForm({ title: "", content: "", priority: "normal", isMandatory: false, departmentId: "all", scheduledAt: "", status: "published" });
    fetchData();
  };

  const publishDraft = async (id: string) => {
    await supabase.from("announcements").update({ status: "published", published_at: new Date().toISOString() }).eq("id", id);
    toast.success("Published!");
    fetchData();
  };

  const markAsRead = async (announcementId: string) => {
    if (!user || reads[announcementId]) return;
    await supabase.from("announcement_reads").insert({ announcement_id: announcementId, user_id: user.id });
    setReads(prev => ({ ...prev, [announcementId]: { read_at: new Date().toISOString() } }));
  };

  const acknowledge = async (announcementId: string) => {
    if (!user) return;
    const existing = reads[announcementId];
    if (!existing) {
      await supabase.from("announcement_reads").insert({ announcement_id: announcementId, user_id: user.id, acknowledged: true, acknowledged_at: new Date().toISOString() });
    } else {
      await supabase.from("announcement_reads").update({ acknowledged: true, acknowledged_at: new Date().toISOString() }).eq("announcement_id", announcementId).eq("user_id", user.id);
    }
    setReads(prev => ({ ...prev, [announcementId]: { ...prev[announcementId], acknowledged: true } }));
    toast.success("Acknowledged!");
  };

  const unreadCount = announcements.filter(a => !reads[a.id] && a.status === "published").length;
  const mandatoryUnacked = announcements.filter(a => a.is_mandatory && !reads[a.id]?.acknowledged && a.status === "published").length;

  if (orgLoading) {
    return <AppLayout title="Announcements"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  const getDeptName = (id: string | null) => departments.find(d => d.id === id)?.name || "All";

  return (
    <AppLayout title="Announcements">
      <div className="p-6 md:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
            <p className="text-muted-foreground mt-1">Corporate broadcasts & mandatory notifications</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-accent text-accent-foreground"><Plus className="w-4 h-4 mr-1" /> Broadcast</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-lg">
              <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" className="rounded-xl" required /></div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="rounded-xl resize-none" rows={4} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Priority</Label>
                    <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Target Department</Label>
                    <Select value={form.departmentId} onValueChange={v => setForm({ ...form, departmentId: v })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Schedule (optional)</Label>
                    <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mandatory</Label>
                    <div className="flex items-center gap-2 pt-2">
                      <Switch checked={form.isMandatory} onCheckedChange={v => setForm({ ...form, isMandatory: v })} />
                      <span className="text-sm text-muted-foreground">Require ack</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 rounded-xl bg-accent text-accent-foreground"><Send className="w-4 h-4 mr-1" />Publish Now</Button>
                  <Button type="button" variant="outline" className="rounded-xl" onClick={(e: any) => handleSubmit(e, true)}><FileEdit className="w-4 h-4 mr-1" />Save Draft</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
            <Megaphone className="w-5 h-5 text-accent mb-2" />
            <p className="text-2xl font-bold text-foreground">{announcements.length}</p>
            <p className="text-xs text-muted-foreground">Total Broadcasts</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }} className="glass-card rounded-xl p-4">
            <Bell className="w-5 h-5 text-svo-blue mb-2" />
            <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
            <p className="text-xs text-muted-foreground">Unread</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="glass-card rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-destructive mb-2" />
            <p className="text-2xl font-bold text-foreground">{mandatoryUnacked}</p>
            <p className="text-xs text-muted-foreground">Pending Acknowledgement</p>
          </motion.div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="published" className="rounded-lg data-[state=active]:bg-card">Published</TabsTrigger>
            <TabsTrigger value="drafts" className="rounded-lg data-[state=active]:bg-card">Drafts</TabsTrigger>
          </TabsList>

          <TabsContent value="published" className="mt-4">
            <AnnouncementList announcements={announcements} reads={reads} readCounts={readCounts} totalStaff={totalStaff} getName={getName} getDeptName={getDeptName} markAsRead={markAsRead} acknowledge={acknowledge} loading={loading} />
          </TabsContent>
          <TabsContent value="drafts" className="mt-4">
            <AnnouncementList announcements={announcements} reads={reads} readCounts={readCounts} totalStaff={totalStaff} getName={getName} getDeptName={getDeptName} markAsRead={markAsRead} acknowledge={acknowledge} loading={loading} isDraft onPublish={publishDraft} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

const AnnouncementList = ({ announcements, reads, readCounts, totalStaff, getName, getDeptName, markAsRead, acknowledge, loading, isDraft, onPublish }: any) => {
  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}</div>;
  if (announcements.length === 0) return (
    <div className="glass-card rounded-xl p-12 text-center">
      <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground">{isDraft ? "No drafts" : "No announcements yet"}</p>
    </div>
  );
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {announcements.map((ann: any, i: number) => {
          const isRead = !!reads[ann.id];
          const isAcked = reads[ann.id]?.acknowledged;
          const readRate = totalStaff > 0 ? Math.round(((readCounts[ann.id] || 0) / totalStaff) * 100) : 0;
          return (
            <motion.div key={ann.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }} exit={{ opacity: 0 }}
              className={`glass-card-strong rounded-xl p-5 space-y-3 border-l-4 ${!isRead && !isDraft ? "border-l-accent" : "border-l-transparent"}`}
              onMouseEnter={() => !isDraft && markAsRead(ann.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className={priorityColors[ann.priority] || ""}>{ann.priority}</Badge>
                    {ann.is_mandatory && <Badge variant="outline" className="bg-destructive/10 text-destructive text-[10px]">Mandatory</Badge>}
                    {ann.department_id && <Badge variant="outline" className="bg-svo-blue/10 text-svo-blue text-[10px]">{getDeptName(ann.department_id)}</Badge>}
                    {!isRead && !isDraft && <span className="w-2 h-2 rounded-full bg-accent" />}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">{ann.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{ann.content}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{getName(ann.created_by)}</span>
                  <span>·</span>
                  <span>{ann.published_at ? formatDistanceToNow(new Date(ann.published_at), { addSuffix: true }) : format(new Date(ann.created_at), "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-3">
                  {!isDraft && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" /><span>{readRate}% read</span>
                    </div>
                  )}
                  {isDraft && onPublish && (
                    <Button size="sm" className="rounded-lg text-xs h-7 bg-accent text-accent-foreground" onClick={() => onPublish(ann.id)}>
                      <Send className="w-3 h-3 mr-1" /> Publish
                    </Button>
                  )}
                  {!isDraft && ann.is_mandatory && !isAcked && (
                    <Button size="sm" variant="outline" className="rounded-lg text-xs h-7 border-accent text-accent hover:bg-accent hover:text-accent-foreground" onClick={() => acknowledge(ann.id)}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Acknowledge
                    </Button>
                  )}
                  {isAcked && <Badge variant="outline" className="bg-green-500/10 text-green-600 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" /> Acknowledged</Badge>}
                </div>
              </div>
              {!isDraft && <Progress value={readRate} className="h-1" />}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementsModule;
