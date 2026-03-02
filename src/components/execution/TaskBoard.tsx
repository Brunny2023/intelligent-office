import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useActivityLog } from "@/hooks/useActivityLog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, GripVertical, MessageSquare, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import TaskDetailPanel from "./TaskDetailPanel";

const statusColumns = [
  { key: "todo", label: "To Do", color: "bg-muted text-muted-foreground" },
  { key: "in_progress", label: "In Progress", color: "bg-svo-blue/10 text-svo-blue" },
  { key: "review", label: "Review", color: "bg-accent/10 text-accent" },
  { key: "approved", label: "Approved", color: "bg-green-500/10 text-green-600" },
  { key: "completed", label: "Completed", color: "bg-green-600/10 text-green-700" },
  { key: "blocked", label: "Blocked", color: "bg-destructive/10 text-destructive" },
] as const;

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-svo-blue/10 text-svo-blue border-svo-blue/20",
  high: "bg-accent/10 text-accent border-accent/20",
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  project_id: string | null;
  parent_task_id: string | null;
  created_at: string;
}

const TaskBoard = ({ projectId }: { projectId?: string }) => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const { logActivity } = useActivityLog();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", dueDate: "" });

  const fetchTasks = async () => {
    if (!org) return;
    let query = supabase
      .from("tasks")
      .select("*")
      .eq("organization_id", org.id)
      .is("parent_task_id", null)
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data } = await query;
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [org, projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org || !form.title.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        organization_id: org.id,
        project_id: projectId || null,
        title: form.title.trim(),
        description: form.description || null,
        priority: form.priority as any,
        created_by: user.id,
        assigned_to: user.id,
        due_date: form.dueDate || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create task");
    } else {
      toast.success("Task created!");
      await logActivity("task_created", "task", data.id, { title: form.title });
      setForm({ title: "", description: "", priority: "medium", dueDate: "" });
      setDialogOpen(false);
      fetchTasks();
    }
    setCreating(false);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({
        status: newStatus as any,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (error) {
      toast.error("Failed to update task");
    } else {
      toast.success(`Task moved to ${newStatus.replace("_", " ")}`);
      await logActivity("task_status_changed", "task", taskId, { new_status: newStatus });
      fetchTasks();
    }
  };

  const getTasksByStatus = (status: string) => tasks.filter((t) => t.status === status);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statusColumns.map((col) => (
          <div key={col.key} className="space-y-3">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-24 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {projectId ? "Tasks" : "All Tasks"}
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-1" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Details..."
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>
              <Button type="submit" disabled={creating} className="w-full rounded-xl bg-accent text-accent-foreground">
                {creating ? "Creating..." : "Create Task"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto">
        {statusColumns.map((col) => {
          const columnTasks = getTasksByStatus(col.key);
          return (
            <div key={col.key} className="min-w-[200px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Badge variant="outline" className={`${col.color} text-xs font-medium`}>
                  {col.label}
                </Badge>
                <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
              </div>
              <div className="space-y-2 min-h-[100px]">
                <AnimatePresence mode="popLayout">
                  {columnTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ y: -2, boxShadow: "0 4px 12px hsl(var(--svo-navy) / 0.08)" }}
                      onClick={() => setSelectedTask(task)}
                      className="glass-card rounded-xl p-3 cursor-pointer border border-transparent hover:border-accent/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-foreground line-clamp-2">{task.title}</h4>
                        {task.priority === "urgent" && (
                          <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Panel */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onStatusChange={(newStatus) => {
              updateTaskStatus(selectedTask.id, newStatus);
              setSelectedTask(null);
            }}
            statusColumns={statusColumns}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskBoard;
