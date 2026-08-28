import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Copy } from "lucide-react";
import { useInvestorAnalytics } from "@/hooks/useInvestorAnalytics";
import { copyToClipboard } from "@/lib/clipboard";

export default function BookMeetingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { track } = useInvestorAnalytics();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      const scheduledAt = when ? new Date(when) : null;
      if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
        throw new Error("Please choose a valid preferred time.");
      }

      const { data, error } = await supabase.functions.invoke(
        "book-investor-meeting",
        {
          body: {
            investorName: name,
            investorEmail: email,
            investorOrg: org,
            scheduledAt: scheduledAt?.toISOString() ?? null,
            notes,
          },
        },
      );
      if (error) throw error;
      if (!data?.roomName || !data?.accessToken || !data?.id) {
        throw new Error("The meeting was not created. Please try again.");
      }

      const url = data.shortCode
        ? `${window.location.origin}/m/${data.shortCode}`
        : `${window.location.origin}/exec-room/${data.roomName}?t=${data.accessToken}&mode=investor`;
      setJoinUrl(url);
      track("meeting_booked", { name, email, org, when }, data.id);
    } catch (err) {
      setErrorMessage(
        (err as Error).message || "Could not book meeting. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setName("");
    setEmail("");
    setOrg("");
    setWhen("");
    setNotes("");
    setJoinUrl(null);
    setErrorMessage(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        {!joinUrl ? (
          <>
            <DialogHeader>
              <DialogTitle>Request an investor meeting</DialogTitle>
              <DialogDescription>
                The founder will confirm and join you in a private room.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="org">Organization</Label>
                <Input
                  id="org"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="when">Preferred time</Label>
                <Input
                  id="when"
                  type="datetime-local"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              {errorMessage && (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage}
                </p>
              )}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Requesting…" : "Request meeting"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" /> Meeting reserved
              </DialogTitle>
              <DialogDescription>
                Save your private join link — you'll use it to enter the room at
                the scheduled time.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border bg-muted p-3 text-xs break-all font-mono">
                {joinUrl}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => copyToClipboard(joinUrl, "Meeting link copied")}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy link
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => window.open(joinUrl, "_blank")}
                >
                  Join now
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
