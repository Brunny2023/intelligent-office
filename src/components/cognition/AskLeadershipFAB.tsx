import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Wave 6 ambient surface. A floating quick-action that lets any user pose a
 * question to the org's AI leadership from anywhere in the app. The request
 * runs the same cognition-deliberate pipeline (executive council, consultant,
 * department assignment, execution plan) and streams back into /cognition.
 */
export default function AskLeadershipFAB() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    const text = prompt.trim();
    if (!text) return;
    setRunning(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) { toast.error("Please sign in first."); return; }
      // Kick off in the background; navigate immediately so the user watches
      // the deliberation unfold in /cognition.
      void fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cognition-deliberate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ request: text }),
      }).catch(() => { /* advisory */ });
      toast.success("Leadership is deliberating…");
      setPrompt("");
      setOpen(false);
      navigate("/cognition");
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ask Leadership"
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 rounded-full bg-svo-gold text-svo-navy shadow-lg hover:shadow-xl hover:scale-105 transition flex items-center justify-center"
      >
        <Brain className="w-6 h-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-svo-gold" /> Ask your leadership
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your AI executive council, consultants, and departments will deliberate on this, grounded in your org's mission, KPIs, memory, and policies.
            </p>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Should we open a second sales pod in EMEA this quarter?"
              rows={5}
              className="rounded-xl"
              autoFocus
            />
            <div className="flex justify-end">
              <Button onClick={submit} disabled={running || !prompt.trim()} className="rounded-xl bg-svo-gold text-svo-navy hover:bg-svo-gold/90 font-semibold">
                {running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : "Deliberate"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}