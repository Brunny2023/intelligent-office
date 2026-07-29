import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, ArrowUpRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

interface Row { id: string; request: string; intent: string | null; created_at: string; status: string; }

export default function CognitionPulseWidget() {
  const { org } = useOrganization();
  const [rows, setRows] = useState<Row[]>([]);
  const [execCount, setExecCount] = useState(0);
  const [memoryCount, setMemoryCount] = useState(0);

  useEffect(() => {
    if (!org?.id) return;
    (async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const [r, e, m] = await Promise.all([
        supabase.from("cognition_requests").select("id, request, intent, created_at, status")
          .eq("organization_id", org.id).order("created_at", { ascending: false }).limit(3),
        supabase.from("ai_executives").select("id", { count: "exact", head: true })
          .eq("organization_id", org.id).eq("is_active", true),
        supabase.from("organizational_memory").select("id", { count: "exact", head: true })
          .eq("organization_id", org.id).gte("created_at", weekAgo),
      ]);
      setRows((r.data as Row[]) ?? []);
      setExecCount(e.count ?? 0);
      setMemoryCount(m.count ?? 0);
    })();
  }, [org?.id]);

  return (
    <div className="glass-card-strong rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Cognition Pulse</h3>
            <p className="text-[11px] text-muted-foreground">Enterprise cognition · this week</p>
          </div>
        </div>
        <Link to="/cognition" className="text-xs text-accent hover:underline flex items-center gap-0.5">
          Open <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-lg bg-muted/40 p-2.5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Active execs</div>
          <div className="text-lg font-bold text-foreground">{execCount}</div>
        </div>
        <div className="rounded-lg bg-muted/40 p-2.5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">New memories</div>
          <div className="text-lg font-bold text-accent">{memoryCount}</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {rows.length === 0 && (
          <Link to="/cognition" className="block text-xs text-muted-foreground rounded-lg border border-dashed border-border p-3 hover:border-accent/40 hover:text-accent transition">
            <Sparkles className="w-3.5 h-3.5 inline mr-1" /> Run your first deliberation.
          </Link>
        )}
        {rows.map((r) => (
          <Link key={r.id} to="/cognition" className="block rounded-lg px-2.5 py-2 hover:bg-muted/50 transition">
            <div className="text-xs text-foreground line-clamp-1">{r.intent ?? r.request}</div>
            <div className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.status}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}