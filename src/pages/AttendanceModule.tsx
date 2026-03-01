import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import ClockInWidget from "@/components/attendance/ClockInWidget";
import AttendanceDashboard from "@/components/attendance/AttendanceDashboard";
import LeaveRequestForm from "@/components/attendance/LeaveRequestForm";
import LeaveRequestsList from "@/components/attendance/LeaveRequestsList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AttendanceModule = () => {
  const navigate = useNavigate();
  const { org, loading } = useOrganization();
  const [leaveRefresh, setLeaveRefresh] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-svo-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto flex items-center gap-3 h-14 px-4 md:px-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Attendance & Presence</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-6 space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <ClockInWidget />
            <AttendanceDashboard />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <LeaveRequestForm onSuccess={() => setLeaveRefresh((r) => r + 1)} />
            <LeaveRequestsList refreshKey={leaveRefresh} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AttendanceModule;
