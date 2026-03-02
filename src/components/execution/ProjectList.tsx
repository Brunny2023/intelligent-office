import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useActivityLog } from "@/hooks/useActivityLog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Plus, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  owner_id: string;
  due_date: string | null;
  created_at: string;
}

interface ProjectListProps {
  onSelectProject: (project: Project) => void;
  selectedProjectId?: string;
}

const ProjectList = ({ onSelectProject, selectedProjectId }: ProjectListProps) => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const { logActivity } = useActivityLog();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", dueDate: "" });

  const fetchProjects = async () => {
    if (!org) return;
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false });
    setProjects(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, [org]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org || !form.name.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("projects")
      .insert({
        organization_id: org.id,
        name: form.name.trim(),
        description: form.description || null,
        owner_id: user.id,
        due_date: form.dueDate || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create project");
    } else {
      toast.success("Project created!");
      await logActivity("project_created", "project", data.id, { name: form.name });
      setForm({ name: "", description: "", dueDate: "" });
      setDialogOpen(false);
      fetchProjects();
    }
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Projects</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-1" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Q1 Marketing Campaign"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description..."
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <Button type="submit" disabled={creating} className="w-full rounded-xl bg-accent text-accent-foreground">
                {creating ? "Creating..." : "Create Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
              <div className="h-12 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No projects yet. Create your first one!</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {projects.map((project, i) => (
            <motion.button
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectProject(project)}
              className={`w-full text-left glass-card rounded-xl p-4 transition-all border-2 ${
                selectedProjectId === project.id
                  ? "border-accent shadow-md"
                  : "border-transparent hover:border-accent/20"
              }`}
            >
              <h3 className="font-semibold text-foreground">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {project.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(project.due_date), "MMM d, yyyy")}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Owner
                </span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
};

export default ProjectList;
