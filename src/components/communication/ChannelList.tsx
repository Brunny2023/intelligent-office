import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Lock, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Channel {
  id: string;
  name: string;
  description: string | null;
  channel_type: string;
  created_by: string;
}

interface ChannelListProps {
  onSelectChannel: (channel: Channel) => void;
  selectedChannelId?: string;
}

const ChannelList = ({ onSelectChannel, selectedChannelId }: ChannelListProps) => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const fetchChannels = async () => {
    if (!org) return;
    const { data } = await supabase
      .from("channels")
      .select("*")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: true });
    setChannels(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchChannels(); }, [org]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.name.trim()) return;
    if (!org) {
      toast.error("Your account isn't linked to an organization yet. Complete onboarding first.");
      return;
    }
    const name = form.name.trim().toLowerCase().replace(/\s+/g, "-");
    if (channels.some((c) => c.name === name)) {
      toast.error(`A channel named "${name}" already exists`);
      return;
    }
    setCreating(true);

    const { data, error } = await supabase
      .from("channels")
      .insert({
        organization_id: org.id,
        name,
        description: form.description || null,
        channel_type: "public" as any,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message || "Failed to create channel");
    } else {
      // Auto-join the channel (ignore duplicates)
      await supabase
        .from("channel_members")
        .upsert({ channel_id: data.id, user_id: user.id }, { onConflict: "channel_id,user_id", ignoreDuplicates: true });
      toast.success("Channel created!");
      setForm({ name: "", description: "" });
      setDialogOpen(false);
      fetchChannels();
    }
    setCreating(false);
  };

  const joinChannel = async (channelId: string) => {
    if (!user) return;
    await supabase
      .from("channel_members")
      .upsert({ channel_id: channelId, user_id: user.id }, { onConflict: "channel_id,user_id", ignoreDuplicates: true });
  };

  const channelIcon = (type: string) => {
    if (type === "private") return <Lock className="w-3.5 h-3.5" />;
    if (type === "direct") return <Users className="w-3.5 h-3.5" />;
    return <Hash className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channels</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create Channel</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Channel Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. general"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What's this channel about?"
                  className="rounded-xl"
                />
              </div>
              <Button type="submit" disabled={creating} className="w-full rounded-xl bg-accent text-accent-foreground">
                {creating ? "Creating..." : "Create Channel"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <p className="text-xs text-muted-foreground px-1">No channels yet</p>
      ) : (
        <AnimatePresence mode="popLayout">
          {channels.map((channel) => (
            <motion.button
              key={channel.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                await joinChannel(channel.id);
                onSelectChannel(channel);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                selectedChannelId === channel.id
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              )}
            >
              {channelIcon(channel.channel_type)}
              <span className="truncate">{channel.name}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
};

export default ChannelList;
