import { Link } from "react-router-dom";
import StatusPanel from "@/components/trust/StatusPanel";
import SecurityPackButton from "@/components/trust/SecurityPackButton";

export default function Status() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold text-foreground">Global Office</Link>
          <Link to="/trust" className="text-sm text-muted-foreground hover:text-foreground">Trust Center →</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-3">System Status</h1>
          <p className="text-muted-foreground">
            Live availability of Global Office platform services, incident history and monthly reliability statistics.
          </p>
          <div className="mt-5">
            <SecurityPackButton variant="outline" />
          </div>
        </div>
        <StatusPanel />
        <div className="mt-10 text-sm text-muted-foreground">
          For our full security posture see the <Link to="/trust" className="underline">Trust Center</Link>.
        </div>
      </main>
    </div>
  );
}
