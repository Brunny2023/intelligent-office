import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Video, Plus, PhoneCall, Mic, MicOff, VideoOff, Monitor } from "lucide-react";
import { toast } from "sonner";

const MeetingsModule = () => {
  const { loading } = useOrganization();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [inMeeting, setInMeeting] = useState(false);

  if (loading) {
    return (
      <AppLayout title="Meetings">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const startMeeting = () => {
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }
    toast.info("LiveKit integration requires a server token. Please configure your LiveKit API key & secret to enable video meetings.");
    setDialogOpen(false);
  };

  return (
    <AppLayout title="Meetings">
      <div className="p-6 md:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Video Meetings</h1>
          <p className="text-muted-foreground mt-1">Real-time video conferencing with AI capabilities</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Meeting Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            whileHover={{ y: -4, boxShadow: "0 12px 40px hsl(var(--svo-navy) / 0.12)" }}
            className="glass-card-strong rounded-2xl p-6 cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-svo-blue/10 flex items-center justify-center mb-4 group-hover:bg-svo-blue/20 transition-colors">
              <Video className="w-7 h-7 text-svo-blue" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Start Instant Meeting</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Launch a quick video call and invite your team
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-svo-blue text-white hover:bg-svo-blue/90">
                  <PhoneCall className="w-4 h-4 mr-2" /> Start Now
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Start a Meeting</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Room Name</Label>
                    <Input
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="e.g. team-standup"
                      className="rounded-xl"
                    />
                  </div>
                  <Button onClick={startMeeting} className="w-full rounded-xl bg-svo-blue text-white">
                    <Video className="w-4 h-4 mr-2" /> Create Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* AI Features Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            whileHover={{ y: -4, boxShadow: "0 12px 40px hsl(var(--svo-navy) / 0.12)" }}
            className="glass-card-strong rounded-2xl p-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Mic className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">AI Transcription</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Real-time transcription, translation, and meeting summaries powered by AI
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">Live Captions</span>
              <span className="text-xs px-2 py-1 rounded-full bg-svo-blue/10 text-svo-blue">Translation</span>
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Summaries</span>
            </div>
          </motion.div>

          {/* Voice Agents Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
            whileHover={{ y: -4, boxShadow: "0 12px 40px hsl(var(--svo-navy) / 0.12)" }}
            className="glass-card-strong rounded-2xl p-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-svo-gold/10 flex items-center justify-center mb-4">
              <Monitor className="w-7 h-7 text-svo-gold" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">AI Voice Agents</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              AI agents that can join meetings, take notes, and answer questions
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-svo-gold/10 text-svo-gold">Note-taker</span>
              <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">Q&A Bot</span>
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Assistant</span>
            </div>
          </motion.div>
        </div>

        {/* Upcoming meetings placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
          className="glass-card-strong rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Meetings</h3>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Video className="w-12 h-12 text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground">No upcoming meetings</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Start an instant meeting or schedule one for later
            </p>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default MeetingsModule;
