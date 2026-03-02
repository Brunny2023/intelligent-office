import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface TaskDetailPanelProps {
  task: any;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  statusColumns: readonly { key: string; label: string; color: string }[];
}

const TaskDetailPanel = ({ task, onClose, onStatusChange, statusColumns }: TaskDetailPanelProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });
      setComments(data || []);
    };
    fetchComments();
  }, [task.id]);

  const sendComment = async () => {
    if (!user || !newComment.trim()) return;
    setSending(true);
    const { data, error } = await supabase
      .from("task_comments")
      .insert({ task_id: task.id, user_id: user.id, content: newComment.trim() })
      .select()
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data]);
      setNewComment("");
    } else {
      toast.error("Failed to send comment");
    }
    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border-l border-border h-full overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold text-foreground pr-4">{task.title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}

          {/* Status transition */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Move to</p>
            <div className="flex flex-wrap gap-2">
              {statusColumns.map((col) => (
                <motion.button
                  key={col.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onStatusChange(col.key)}
                  disabled={task.status === col.key}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    task.status === col.key
                      ? `${col.color} ring-2 ring-accent/30`
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {col.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Discussion thread */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Discussion ({comments.length})
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {comments.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-muted/50 rounded-xl p-3"
                >
                  <p className="text-sm text-foreground">{c.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="rounded-xl resize-none text-sm"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendComment();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={sendComment}
                disabled={sending || !newComment.trim()}
                className="rounded-xl bg-accent text-accent-foreground shrink-0 self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TaskDetailPanel;
