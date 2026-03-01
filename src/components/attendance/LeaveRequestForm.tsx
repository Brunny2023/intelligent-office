import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useActivityLog } from "@/hooks/useActivityLog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Send } from "lucide-react";
import { toast } from "sonner";

const leaveTypes = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "personal", label: "Personal Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "other", label: "Other" },
];

const LeaveRequestForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const { logActivity } = useActivityLog();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    leaveType: "annual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org) return;
    if (!form.startDate || !form.endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    if (form.endDate < form.startDate) {
      toast.error("End date must be after start date");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("leave_requests")
      .insert({
        user_id: user.id,
        organization_id: org.id,
        leave_type: form.leaveType as any,
        start_date: form.startDate,
        end_date: form.endDate,
        reason: form.reason || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to submit: " + error.message);
    } else {
      toast.success("Leave request submitted!");
      await logActivity("leave_requested", "leave_request", data.id, {
        leave_type: form.leaveType,
        start_date: form.startDate,
        end_date: form.endDate,
      });
      setForm({ leaveType: "annual", startDate: "", endDate: "", reason: "" });
      onSuccess?.();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card-strong rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-xl bg-svo-gold/10 flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-svo-gold" />
        </div>
        <h3 className="font-semibold text-foreground">Request Leave</h3>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Leave Type</Label>
        <Select value={form.leaveType} onValueChange={(v) => setForm({ ...form, leaveType: v })}>
          <SelectTrigger className="h-10 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {leaveTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-foreground">Start Date</Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">End Date</Label>
          <Input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="h-10 rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Reason (optional)</Label>
        <Textarea
          placeholder="Briefly describe the reason..."
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          className="rounded-xl resize-none"
          rows={2}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-10 rounded-xl bg-svo-gold text-svo-navy hover:bg-svo-gold/90 font-semibold"
      >
        {loading ? "Submitting..." : (
          <>
            <Send className="w-4 h-4 mr-2" /> Submit Request
          </>
        )}
      </Button>
    </form>
  );
};

export default LeaveRequestForm;
