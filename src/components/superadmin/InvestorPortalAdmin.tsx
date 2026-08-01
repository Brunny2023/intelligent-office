import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Check, X, Eye, Send, Upload, Trash2 } from "lucide-react";
import { DATA_ROOM_CATEGORIES, categoryLabel } from "@/components/investors/dataRoomCategories";

type Investor = {
  id: string; full_name: string; email: string; firm: string | null; title: string | null;
  linkedin_url: string | null; investment_focus: string | null; ticket_size: string | null;
  message: string | null; status: string; nda_accepted_at: string | null;
  access_expires_at: string | null; created_at: string; last_seen_at: string | null;
};
type LogRow = { id: string; investor_id: string; action: string; duration_seconds: number | null; created_at: string; document_id: string | null };
type Step = { id: string; label: string; status: string; sort_order: number };
type DocRow = { id: string; category: string; title: string; storage_path: string | null; is_active: boolean; created_at: string };

const CATEGORIES = DATA_ROOM_CATEGORIES;

const statusTone = (s: string) =>
  s === "approved" ? "default" : s === "pending" ? "secondary" : "outline";

const InvestorPortalAdmin = () => {
  const [rows, setRows] = useState<Investor[]>([]);
  const [selected, setSelected] = useState<Investor | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [docTitles, setDocTitles] = useState<Record<string, string>>({});
  const [reply, setReply] = useState("");
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState(CATEGORIES[0].key);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("investor_profiles").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Investor[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDocs = useCallback(async () => {
    const { data } = await supabase
      .from("data_room_documents")
      .select("id, category, title, storage_path, is_active, created_at")
      .order("category").order("sort_order");
    setDocs((data ?? []) as DocRow[]);
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const uploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !docTitle.trim()) return;
    setUploading(true);
    setUploadError(null);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${docCategory}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from("data-room").upload(path, file, {
        contentType: file.type || "application/octet-stream", upsert: false,
      });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("data_room_documents").insert({
        category: docCategory, title: docTitle.trim(), storage_path: path,
        sort_order: docs.filter((d) => d.category === docCategory).length,
      });
      if (insErr) throw insErr;
      setDocTitle(""); setFile(null);
      await loadDocs();
    } catch (err) {
      setUploadError((err as Error).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = async (doc: DocRow) => {
    if (doc.storage_path) await supabase.storage.from("data-room").remove([doc.storage_path]);
    await supabase.from("data_room_documents").delete().eq("id", doc.id);
    await loadDocs();
  };

  const toggleDoc = async (doc: DocRow) => {
    await supabase.from("data_room_documents").update({ is_active: !doc.is_active }).eq("id", doc.id);
    await loadDocs();
  };

  useEffect(() => {
    supabase.from("data_room_documents").select("id, title").then(({ data }) =>
      setDocTitles(Object.fromEntries((data ?? []).map((d) => [d.id, d.title]))));
  }, []);

  const openInvestor = async (inv: Investor) => {
    setSelected(inv);
    const [{ data: l }, { data: s }] = await Promise.all([
      supabase.from("data_room_access_log").select("*").eq("investor_id", inv.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("investor_dd_steps").select("id, label, status, sort_order").eq("investor_id", inv.id).order("sort_order"),
    ]);
    setLogs((l ?? []) as LogRow[]);
    setSteps((s ?? []) as Step[]);
  };

  const setStatus = async (inv: Investor, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const patch: Record<string, unknown> = { status };
    if (status === "approved") {
      patch.approved_at = new Date().toISOString();
      patch.approved_by = user?.id ?? null;
      patch.access_expires_at = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString();
    }
    await supabase.from("investor_profiles").update(patch).eq("id", inv.id);
    await load();
    if (selected?.id === inv.id) openInvestor({ ...inv, status });
  };

  const cycleStep = async (step: Step) => {
    const next = step.status === "pending" ? "in_progress" : step.status === "in_progress" ? "complete" : "pending";
    await supabase.from("investor_dd_steps").update({
      status: next, completed_at: next === "complete" ? new Date().toISOString() : null,
    }).eq("id", step.id);
    setSteps((s) => s.map((x) => (x.id === step.id ? { ...x, status: next } : x)));
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("investor_messages").insert({
      investor_id: selected.id, sender_id: user?.id ?? null, from_company: true,
      kind: "message", body: reply.trim().slice(0, 4000),
    });
    setReply("");
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Access requests</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Investor</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-sm text-muted-foreground">No requests yet.</TableCell></TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="text-sm font-medium">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">{r.email}{r.firm ? ` · ${r.firm}` : ""}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "d MMM yyyy")} · NDA {r.nda_accepted_at ? "signed" : "not signed"}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={statusTone(r.status)}>{r.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => openInvestor(r)}><Eye className="w-3.5 h-3.5" /></Button>
                    {r.status !== "approved" && <Button size="sm" variant="ghost" onClick={() => setStatus(r, "approved")}><Check className="w-3.5 h-3.5" /></Button>}
                    {r.status !== "revoked" && <Button size="sm" variant="ghost" onClick={() => setStatus(r, "revoked")}><X className="w-3.5 h-3.5" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{selected ? selected.full_name : "Select an investor"}</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {!selected && <p className="text-sm text-muted-foreground">Open a request to review details, diligence progress, and data room access logs.</p>}
          {selected && (
            <>
              <div className="text-sm space-y-1">
                {selected.title && <div><span className="text-muted-foreground">Title:</span> {selected.title}</div>}
                {selected.investment_focus && <div><span className="text-muted-foreground">Focus:</span> {selected.investment_focus}</div>}
                {selected.ticket_size && <div><span className="text-muted-foreground">Ticket:</span> {selected.ticket_size}</div>}
                {selected.linkedin_url && <div><span className="text-muted-foreground">LinkedIn:</span> {selected.linkedin_url}</div>}
                {selected.access_expires_at && <div><span className="text-muted-foreground">Access expires:</span> {format(new Date(selected.access_expires_at), "d MMM yyyy")}</div>}
                {selected.message && <p className="text-muted-foreground pt-2">{selected.message}</p>}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Due diligence tracker</p>
                {steps.length === 0 ? <p className="text-sm text-muted-foreground">Seeded on approval.</p> : (
                  <div className="space-y-1">
                    {steps.map((s) => (
                      <button key={s.id} onClick={() => cycleStep(s)} className="w-full flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-muted">
                        <span>{s.label}</span>
                        <Badge variant={s.status === "complete" ? "default" : s.status === "in_progress" ? "secondary" : "outline"}>{s.status}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Data room access log</p>
                {logs.length === 0 ? <p className="text-sm text-muted-foreground">No document activity yet.</p> : (
                  <div className="max-h-56 overflow-y-auto text-xs space-y-1">
                    {logs.map((l) => (
                      <div key={l.id} className="flex justify-between gap-3 border-b py-1">
                        <span>{l.document_id ? docTitles[l.document_id] ?? "Document" : "—"}</span>
                        <span className="text-muted-foreground">
                          {l.action}{l.duration_seconds ? ` · ${l.duration_seconds}s` : ""} · {format(new Date(l.created_at), "d MMM HH:mm")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Reply securely</p>
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} maxLength={4000} placeholder="Message to the investor…" />
                <Button size="sm" className="mt-2" onClick={sendReply} disabled={!reply.trim()}><Send className="w-3.5 h-3.5 mr-2" /> Send</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">Data room documents</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={uploadDoc} className="grid md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-1">
              <label htmlFor="doc-cat" className="text-xs text-muted-foreground">Category</label>
              <select id="doc-cat" value={docCategory} onChange={(e) => setDocCategory(e.target.value)}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-1">
              <label htmlFor="doc-title" className="text-xs text-muted-foreground">Title</label>
              <Input id="doc-title" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} maxLength={160} required />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="doc-file" className="text-xs text-muted-foreground">File</label>
              <Input id="doc-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
            </div>
            <Button type="submit" disabled={uploading || !file}>
              <Upload className="w-3.5 h-3.5 mr-2" />{uploading ? "Uploading…" : "Upload"}
            </Button>
          </form>
          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

          <div className="max-h-72 overflow-y-auto divide-y">
            {docs.length === 0 && <p className="text-sm text-muted-foreground">No documents yet.</p>}
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{categoryLabel(d.category)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={d.is_active ? "default" : "outline"}>{d.is_active ? "visible" : "hidden"}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => toggleDoc(d)}>{d.is_active ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}</Button>
                  <Button size="sm" variant="ghost" onClick={() => removeDoc(d)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestorPortalAdmin;
