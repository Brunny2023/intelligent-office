import { useEffect, useMemo, useState, useCallback } from "react";
import { ReactFlow, Background, Controls, MiniMap, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Network, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ENTITY_COLORS: Record<string, string> = {
  person: "#0ea5e9",
  project: "#f59e0b",
  task: "#8b5cf6",
  document: "#10b981",
  kpi: "#ef4444",
  channel: "#6366f1",
  meeting: "#ec4899",
  customer: "#14b8a6",
};

const TYPES = ["person", "project", "task", "document", "kpi", "channel"] as const;

export default function GraphExplorer() {
  const { org, loading: orgLoading } = useOrganization();
  const [entities, setEntities] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [filter, setFilter] = useState<Set<string>>(new Set(TYPES));
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState<string>("");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!org) return;
    (async () => {
      setLoading(true);
      const [{ data: ents }, { data: eds }] = await Promise.all([
        supabase.from("graph_entities").select("*").eq("organization_id", org.id).limit(400),
        supabase.from("graph_edges").select("*").eq("organization_id", org.id).limit(800),
      ]);
      setEntities(ents ?? []);
      setEdges(eds ?? []);
      setLoading(false);
    })();
  }, [org]);

  const { nodes, flowEdges } = useMemo(() => {
    const visible = entities.filter((e) => filter.has(e.entity_type));
    const idSet = new Set(visible.map((e) => e.id));
    // layout: concentric circles per type
    const byType: Record<string, any[]> = {};
    for (const e of visible) (byType[e.entity_type] ??= []).push(e);
    const typeOrder = Object.keys(byType);
    const nodes: Node[] = [];
    typeOrder.forEach((t, ti) => {
      const arr = byType[t];
      const radius = 180 + ti * 160;
      arr.forEach((e, i) => {
        const angle = (i / Math.max(arr.length, 1)) * Math.PI * 2;
        nodes.push({
          id: e.id,
          position: { x: Math.cos(angle) * radius + 600, y: Math.sin(angle) * radius + 400 },
          data: { label: `${e.label ?? e.entity_type}` },
          style: {
            background: ENTITY_COLORS[e.entity_type] ?? "#64748b",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: 6,
            fontSize: 11,
            maxWidth: 140,
          },
        });
      });
    });
    const flowEdges: Edge[] = edges
      .filter((ed) => idSet.has(ed.from_entity_id) && idSet.has(ed.to_entity_id))
      .slice(0, 500)
      .map((ed) => ({
        id: ed.id,
        source: ed.from_entity_id,
        target: ed.to_entity_id,
        label: ed.edge_type,
        labelStyle: { fontSize: 9, fill: "#94a3b8" },
        style: { stroke: "#334155", strokeWidth: 1 },
      }));
    return { nodes, flowEdges };
  }, [entities, edges, filter]);

  const toggle = useCallback((t: string) => {
    setFilter((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }, []);

  const ask = async (question: string) => {
    setAsking(true);
    setAnswer("");
    try {
      const { data, error } = await supabase.functions.invoke("intelligence-query", {
        body: { question },
      });
      if (error) throw error;
      setAnswer(data?.answer ?? "No answer");
    } catch (e: any) {
      toast.error(e.message ?? "Query failed");
    }
    setAsking(false);
  };

  if (orgLoading) {
    return (
      <AppLayout title="Knowledge Graph">
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  const counts = TYPES.map((t) => ({ t, n: entities.filter((e) => e.entity_type === t).length }));

  return (
    <AppLayout title="Knowledge Graph">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Network className="w-6 h-6 text-accent" /> Organizational Knowledge Graph
            </h1>
            <p className="text-sm text-muted-foreground">
              {entities.length} entities · {edges.length} relationships · live from your org
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {counts.map(({ t, n }) => (
              <button key={t} onClick={() => toggle(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                  filter.has(t) ? "opacity-100" : "opacity-40"
                }`}
                style={{ background: ENTITY_COLORS[t] + "22", borderColor: ENTITY_COLORS[t], color: ENTITY_COLORS[t] }}>
                {t} · {n}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 glass-card rounded-xl overflow-hidden" style={{ height: "70vh" }}>
            {loading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : nodes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Graph is empty — create tasks, projects, documents to populate it.
              </div>
            ) : (
              <ReactFlow nodes={nodes} edges={flowEdges} fitView minZoom={0.1}>
                <Background gap={20} />
                <Controls />
                <MiniMap pannable zoomable />
              </ReactFlow>
            )}
          </div>

          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="font-semibold text-sm">Ask the graph</span>
            </div>
            {[
              { q: "overloaded_people", label: "Who is overloaded?" },
              { q: "at_risk_projects", label: "Which projects are at risk?" },
              { q: "blocker_chains", label: "Where are the blockers?" },
              { q: "pending_decisions", label: "What decisions are pending?" },
              { q: "org_summary", label: "Give me the org summary." },
            ].map((item) => (
              <Button key={item.q} variant="outline" size="sm" className="w-full justify-start text-xs"
                disabled={asking} onClick={() => ask(item.q)}>
                {item.label}
              </Button>
            ))}
            {asking && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Reasoning over graph…</div>}
            {answer && (
              <div className="text-xs bg-muted/40 rounded p-3 whitespace-pre-wrap leading-relaxed max-h-96 overflow-auto">
                {answer}
              </div>
            )}
            <Badge variant="outline" className="text-[10px]">grounded · no hallucinations</Badge>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}