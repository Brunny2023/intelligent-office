import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import ActivityFeed from "@/components/activity/ActivityFeed";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ActivityModule = () => {
  const navigate = useNavigate();
  const { loading } = useOrganization();

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
          <h1 className="text-lg font-semibold text-foreground">Activity Log</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Your Activity</h2>
            <ActivityFeed scope="personal" limit={30} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Organization Feed</h2>
            <ActivityFeed scope="organization" limit={30} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ActivityModule;
