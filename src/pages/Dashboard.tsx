import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Shield, Clock, CheckSquare, MessageSquare, BarChart3,
  FileText, Bell, LogOut, Building2, Users
} from "lucide-react";

const modules = [
  { icon: Clock, label: "Attendance", description: "Check in & workforce presence", color: "bg-svo-blue/10 text-svo-blue" },
  { icon: CheckSquare, label: "Execution", description: "Projects, tasks & workflows", color: "bg-svo-gold/10 text-svo-gold" },
  { icon: MessageSquare, label: "Communication", description: "Messages & channels", color: "bg-emerald-500/10 text-emerald-500" },
  { icon: BarChart3, label: "Intelligence", description: "KPIs & performance", color: "bg-purple-500/10 text-purple-500" },
  { icon: FileText, label: "Documents", description: "Files & knowledge base", color: "bg-orange-500/10 text-orange-500" },
  { icon: Bell, label: "Announcements", description: "Broadcasts & updates", color: "bg-rose-500/10 text-rose-500" },
];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        if (!profileData.organization_id) {
          navigate("/onboarding");
          return;
        }

        const { data: orgData } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profileData.organization_id)
          .single();

        setOrg(orgData);
      }
      setLoading(false);
    };

    loadData();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-svo-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-svo-gold flex items-center justify-center">
              <Shield className="w-4 h-4 text-svo-navy" />
            </div>
            <div>
              <span className="text-sm font-bold font-['Space_Grotesk'] text-foreground">
                Soteria<span className="text-svo-gold">.</span>
              </span>
              {org && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {org.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile?.full_name || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's your digital headquarters overview</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Team Members", value: "—", icon: Users },
            { label: "Active Tasks", value: "—", icon: CheckSquare },
            { label: "Messages", value: "—", icon: MessageSquare },
            { label: "Health Score", value: "—", icon: BarChart3 },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Module grid */}
        <h2 className="text-lg font-semibold text-foreground mb-4">Modules</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <button
              key={mod.label}
              className="glass-card-strong rounded-xl p-6 text-left hover:border-svo-gold/20 transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl ${mod.color} flex items-center justify-center mb-3`}>
                <mod.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-svo-gold transition-colors">
                {mod.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
