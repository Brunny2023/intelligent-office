import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useActivityLog } from "@/hooks/useActivityLog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ClockInWidget = () => {
  const { user } = useAuth();
  const { org } = useOrganization();
  const { logActivity } = useActivityLog();
  const [activeRecord, setActiveRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch today's active record
  useEffect(() => {
    if (!user || !org) return;

    const fetchToday = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", user.id)
        .gte("clock_in", todayStart.toISOString())
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setActiveRecord(data[0]);
      }
      setLoading(false);
    };
    fetchToday();
  }, [user, org]);

  const handleClockIn = async () => {
    if (!user || !org) return;
    setActionLoading(true);

    const { data, error } = await supabase
      .from("attendance_records")
      .insert({
        user_id: user.id,
        organization_id: org.id,
        status: "present",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to clock in: " + error.message);
    } else {
      setActiveRecord(data);
      toast.success("Clocked in successfully!");
      await logActivity("clock_in", "attendance", data.id);
    }
    setActionLoading(false);
  };

  const handleClockOut = async () => {
    if (!activeRecord) return;
    setActionLoading(true);

    const { error } = await supabase
      .from("attendance_records")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", activeRecord.id);

    if (error) {
      toast.error("Failed to clock out: " + error.message);
    } else {
      toast.success("Clocked out successfully!");
      await logActivity("clock_out", "attendance", activeRecord.id);
      setActiveRecord(null);
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="glass-card-strong rounded-2xl p-6 animate-pulse">
        <div className="h-20 bg-muted rounded-xl" />
      </div>
    );
  }

  const isClockedIn = !!activeRecord;

  return (
    <div className="glass-card-strong rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-svo-blue/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-svo-blue" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Report for Duty</h3>
            <p className="text-xs text-muted-foreground">
              {format(currentTime, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-['Space_Grotesk'] text-foreground">
            {format(currentTime, "HH:mm:ss")}
          </p>
        </div>
      </div>

      {isClockedIn ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-muted-foreground">
              Clocked in at {format(new Date(activeRecord.clock_in), "HH:mm")}
            </span>
          </div>
          <Button
            onClick={handleClockOut}
            disabled={actionLoading}
            className="w-full h-11 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
          >
            {actionLoading ? "Clocking out..." : (
              <>
                <LogOut className="w-4 h-4 mr-2" /> Clock Out
              </>
            )}
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleClockIn}
          disabled={actionLoading}
          className="w-full h-11 rounded-xl bg-svo-gold text-svo-navy hover:bg-svo-gold/90 font-semibold"
        >
          {actionLoading ? "Clocking in..." : (
            <>
              <LogIn className="w-4 h-4 mr-2" /> Clock In — Report for Duty
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default ClockInWidget;
