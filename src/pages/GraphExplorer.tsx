import { useEffect, useMemo, useState, useCallback } from "react";
import { ReactFlow, Background, Controls, MiniMap, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/dashboard/kit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Network, Sparkles, Loader2, Search, Save, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

const ENTITY_COLORS: Record<string, string> = {
  person: "#0ea5e9", project: "#f59e0b", task: "#8b5cf6",
  document: "#10b981", kpi: "#ef4444", channel: "#6366f1",
  meeting: "#ec4899", customer: "#14b8a6",
};

const TYPES = ["person", "project", "task", "document", "kpi", "channel"] as const;
const EDGE_TYPES = ["owns", "assigned_to", "belongs_to", "depends_on", "participates_in", "mentioned"] as const;
const FILTERS_KEY = "graph_saved_filters_v1";

const PRESETS = [
  { id: "workflows", label: "Workflows & owners", entity: ["person", "project"], edge: ["owns"], q: "" },
  { id: "blockers", label: "Blockers", entity: ["task", "person"], edge: ["depends_on", "assigned_to"], q: "blocked" },
  { id: "at_risk", label: "At-risk projects", entity: ["project", "task"], edge: ["belongs_to"], q: "" },
];

export default function GraphExplorer() {
  const { org, loading: orgLoading } = useOrganization();
  const [entities, setEntities] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [filter, setFilter] = useState<Set<string>>(new Set(TYPES));
  const [edgeFilter, setEdgeFilter] = useState<Set<string>>(new Set(EDGE_TYPES));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState<string>("");
  const [asking, setAsking] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);
  const [selectedNeighbors, setSelectedNeighbors] = useState<Array<{ entity: any; edge: any }>>([]);
  const [savedFilters, setSavedFilters] = useState<Array<{ name: string; entity: string[]; edge: string[]; q: string }>>([]);
  const [isolation, setIsolation] = useState<any | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    try { setSavedFilters(JSON.parse(localStorage.getItem(FILTERS_KEY) || "[]")); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!org) return;
    (async () => {
      setLoading(true);
      const [{ data: ents }, { data: eds }] = await Promise.all([
        supabase.from("graph_entities").select("*").eq("organization_id", org.id).limit(1000),
        supabase.from("graph_edges").select("*").eq("organization_id", org.id).limit(2000),
      ]);
      setEntities(ents ?? []);
      setEdges(eds ?? []);
      setLoading(false);
    })();
  }, [org]);

  const { nodes, flowEdges } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const visible = entities.filter((e) =>
      filter.has(e.entity_type) &&
      (!q || (e.label ?? "").toLowerCase().includes(q) ||
        JSON.stringify(e.metadata ?? {}).toLowerCase().includes(q))
    );
    const idSet = new Set(visible.map((e) => e.id));
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
          data: { label: `${e.label ?? e.entity_type}`, entity: e },
          style: {
            background: ENTITY_COLORS[e.entity_type] ?? "#64748b",
            color: "white", border: "none", borderRadius: 8,
            padding: 6, fontSize: 11, maxWidth: 140,
          },
        });
      });
    });
    const flowEdges: Edge[] = edges
      .filter((ed) => idSet.has(ed.from_entity_id) && idSet.has(ed.to_entity_id) && edgeFilter.has(ed.edge_type))
      .slice(0, 800)
      .map((ed) => ({
        id: ed.id, source: ed.from_entity_id, target: ed.to_entity_id, label: ed.edge_type,
        labelStyle: { fontSize: 9, fill: "#94a3b8" },
        style: { stroke: "#334155", strokeWidth: 1 },
      }));
    return { nodes, flowEdges };
  }, [entities, edges, filter, edgeFilter, search]);

  const toggle = useCallback((t: string, kind: "entity" | "edge" = "entity") => {
    const setter = kind === "entity" ? setFilter : setEdgeFilter;
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }, []);

  const applyPreset = (p: typeof PRESETS[number]) => {
    setFilter(new Set(p.entity)); setEdgeFilter(new Set(p.edge)); setSearch(p.q);
  };

  const saveCurrentFilter = () => {
    const name = window.prompt("Name this filter set");
    if (!name) return;
    const next = [...savedFilters, { name, entity: [...filter], edge: [...edgeFilter], q: search }];
    setSavedFilters(next);
    localStorage.setItem(FILTERS_KEY, JSON.stringify(next));
    toast.success(`Saved "${name}"`);
  };

  const removeSaved = (name: string) => {
    const next = savedFilters.filter((f) => f.name !== name);
    setSavedFilters(next);
    localStorage.setItem(FILTERS_KEY, JSON.stringify(next));
  };

  const openNode = useCallback(async (_: unknown, node: Node) => {
    const entity = (node.data as any).entity;
    setSelected(entity); setSelectedEvents([]); setSelectedNeighbors([]);
    if (!org) return;
    const [{ data: outEdges }, { data: inEdges }, { data: events }] = await Promise.all([
      supabase.from("graph_edges").select("*").eq("organization_id", org.id).eq("from_entity_id", entity.id),
      supabase.from("graph_edges").select("*").eq("organization_id", org.id).eq("to_entity_id", entity.id),
      supabase.from("graph_events").select("*").eq("organization_id", org.id).eq("entity_id", entity.id)
        .order("occurred_at", { ascending: false }).limit(20),
    ]);
    const neighborIds = new Set<string>();
    (outEdges ?? []).forEach((e) => neighborIds.add(e.to_entity_id));
    (inEdges ?? []).forEach((e) => neighborIds.add(e.from_entity_id));
    const idsArr = Array.from(neighborIds);
    const { data: neighbors } = idsArr.length
      ? await supabase.from("graph_entities").select("*").in("id", idsArr)
      : { data: [] };
    const byId = new Map((neighbors ?? []).map((n: any) => [n.id, n]));
    const combined = [
      ...(outEdges ?? []).map((e) => ({ edge: { ...e, direction: "out" }, entity: byId.get(e.to_entity_id) })),
      ...(inEdges ?? []).map((e) => ({ edge: { ...e, direction: "in" }, entity: byId.get(e.from_entity_id) })),
    ].filter((x) => x.entity);
    setSelectedNeighbors(combined as any);
    setSelectedEvents(events ?? []);
  }, [org]);

  const runIsolationCheck = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc("intelligence_isolation_probe" as any);
      if (error) throw error;
      setIsolation(data);
      if ((data as any)?.isolated) toast.success("Isolation verified — no cross-org rows visible");
      else toast.error("Isolation FAILED — cross-org rows visible");
    } catch (e: any) {
      toast.error(e.message ?? "Isolation check failed");
    }
    setChecking(false);
  };

  const ask = async (question: string) => {
    setAsking(true); setAnswer("");
    try {
      const { data, error } = await supabase.functions.invoke("intelligence-query", { body: { question } });
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
  const edgeCounts = EDGE_TYPES.map((t) => ({ t, n: edges.filter((e) => e.edge_type === t).length }));

  return (
    <AppLayout title="Knowledge Graph">
      <div className="p-6 space-y-4">
        <PageHeader
          eyebrow="Intelligence"
          icon={Network}
          title="Organizational Knowledge Graph"
          subtitle={`${entities.length} entities · ${edges.length} relationships · live from your org`}
          actions={
            <Button variant="outline" size="sm" onClick={runIsolationCheck} disabled={checking}>
              <ShieldCheck className="w-4 h-4 mr-2" />
              {checking ? "Checking…" : "Run isolation check"}
            </Button>
          }
        />

        {isolation && (
          <div className={`text-xs rounded-md p-3 border ${isolation.isolated ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"}`}>
            <div className="font-semibold mb-1">{isolation.isolated ? "✓ Isolation verified" : "✗ Isolation failure"}</div>
            <div className="grid grid-cols-3 gap-2 text-muted-foreground">
              <span>entities own {isolation.entities_visible_own} · other {isolation.entities_visible_other}</span>
              <span>edges own {isolation.edges_visible_own} · other {isolation.edges_visible_other}</span>
              <span>events own {isolation.events_visible_own} · other {isolation.events_visible_other}</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entities, metadata…" className="pl-8 h-8 w-64 text-xs" />
          </div>
          {PRESETS.map((p) => (
            <Button key={p.id} size="sm" variant="secondary" onClick={() => applyPreset(p)} className="text-xs h-8">
              {p.label}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={saveCurrentFilter} className="text-xs h-8">
            <Save className="w-3 h-3 mr-1" /> Save filter
          </Button>
          {savedFilters.map((f) => (
            <span key={f.name} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted/50 rounded">
              <button onClick={() => { setFilter(new Set(f.entity)); setEdgeFilter(new Set(f.edge)); setSearch(f.q); }}>{f.name}</button>
              <button onClick={() => removeSaved(f.name)} className="opacity-60 hover:opacity-100">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {counts.map(({ t, n }) => (
            <button key={t} onClick={() => toggle(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${filter.has(t) ? "opacity-100" : "opacity-40"}`}
              style={{ background: ENTITY_COLORS[t] + "22", borderColor: ENTITY_COLORS[t], color: ENTITY_COLORS[t] }}>
              {t} · {n}
            </button>
          ))}
          <div className="w-px bg-border mx-1" />
          {edgeCounts.map(({ t, n }) => (
            <button key={t} onClick={() => toggle(t, "edge")}
              className={`px-3 py-1 rounded-full text-xs font-medium border border-slate-500/40 transition ${edgeFilter.has(t) ? "opacity-100" : "opacity-40"}`}>
              {t} · {n}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 glass-card rounded-xl overflow-hidden" style={{ height: "70vh" }}>
            {loading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : nodes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No matches — adjust filters or search.
              </div>
            ) : (
              <ReactFlow nodes={nodes} edges={flowEdges} fitView minZoom={0.1} onNodeClick={openNode}>
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

        <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            {selected && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: ENTITY_COLORS[selected.entity_type] ?? "#64748b" }} />
                    {selected.label ?? selected.entity_type}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">Source</div>
                    <div className="text-xs font-mono bg-muted/40 rounded p-2 break-all">
                      {selected.source_table} · {selected.source_id}
                    </div>
                  </div>
                  {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                    <div>
                      <div className="text-xs uppercase text-muted-foreground mb-1">Metadata</div>
                      <pre className="text-xs bg-muted/40 rounded p-2 overflow-auto">{JSON.stringify(selected.metadata, null, 2)}</pre>
                    </div>
                  )}
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">Connections ({selectedNeighbors.length})</div>
                    <div className="space-y-1 max-h-64 overflow-auto">
                      {selectedNeighbors.length === 0 && <div className="text-xs text-muted-foreground">No relationships yet.</div>}
                      {selectedNeighbors.map((n, i) => (
                        <div key={i} className="text-xs flex items-center gap-2 border-b border-border/40 pb-1">
                          <Badge variant="outline" className="text-[10px]">{n.edge.edge_type}</Badge>
                          <span className="opacity-60">{n.edge.direction === "out" ? "→" : "←"}</span>
                          <span className="w-2 h-2 rounded-full" style={{ background: ENTITY_COLORS[n.entity.entity_type] ?? "#64748b" }} />
                          <span className="font-medium">{n.entity.label ?? n.entity.entity_type}</span>
                          <span className="ml-auto text-[10px] font-mono opacity-60">{n.entity.source_table}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">Recent events ({selectedEvents.length})</div>
                    <div className="space-y-1 max-h-64 overflow-auto">
                      {selectedEvents.length === 0 && <div className="text-xs text-muted-foreground">No events recorded.</div>}
                      {selectedEvents.map((ev) => (
                        <div key={ev.id} className="text-xs border-b border-border/40 pb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">{ev.event_type}</Badge>
                            <span className="opacity-60">{new Date(ev.occurred_at).toLocaleString()}</span>
                          </div>
                          {ev.payload && Object.keys(ev.payload).length > 0 && (
                            <pre className="text-[10px] opacity-70 mt-0.5">{JSON.stringify(ev.payload)}</pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">Citation</div>
                    <div className="text-[10px] font-mono bg-muted/40 rounded p-2 break-all">
                      graph_entities/{selected.id}
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}