import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Check, X } from "lucide-react";
import { DATA_ROOM_CATEGORIES, categoryLabel } from "./dataRoomCategories";
import DataRoomChecklist from "./DataRoomChecklist";

type DocRow = { id: string; category: string; title: string; storage_path: string | null; is_active: boolean };

/** Admin-only uploader rendered inside the investor portal data room. */
const DataRoomUploader = ({ onChanged }: { onChanged?: () => void }) => {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [category, setCategory] = useState(DATA_ROOM_CATEGORIES[0].key);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("data_room_documents")
      .select("id, category, title, storage_path, is_active")
      .order("category").order("sort_order");
    setDocs((data ?? []) as DocRow[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setBusy(true); setError(null);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${category}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from("data-room")
        .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("data_room_documents").insert({
        category, title: title.trim(), storage_path: path,
        sort_order: docs.filter((d) => d.category === category).length,
      });
      if (insErr) throw insErr;
      setTitle(""); setFile(null);
      (document.getElementById("dr-file") as HTMLInputElement | null)?.value &&
        ((document.getElementById("dr-file") as HTMLInputElement).value = "");
      await load();
      onChanged?.();
    } catch (err) {
      setError((err as Error).message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (d: DocRow) => {
    await supabase.from("data_room_documents").update({ is_active: !d.is_active }).eq("id", d.id);
    await load(); onChanged?.();
  };

  const remove = async (d: DocRow) => {
    if (d.storage_path) await supabase.storage.from("data-room").remove([d.storage_path]);
    await supabase.from("data_room_documents").delete().eq("id", d.id);
    await load(); onChanged?.();
  };

  return (
    <div className="space-y-4">
      <DataRoomChecklist docs={docs} />
      <div className="border border-border rounded-md p-4 bg-card text-card-foreground space-y-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin · upload documents</p>
      <form onSubmit={upload} className="grid md:grid-cols-4 gap-3 items-end">
        <div>
          <label htmlFor="dr-cat" className="text-xs text-muted-foreground">Folder</label>
          <select id="dr-cat" value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            {DATA_ROOM_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="dr-title" className="text-xs text-muted-foreground">Title</label>
          <Input id="dr-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
        </div>
        <div>
          <label htmlFor="dr-file" className="text-xs text-muted-foreground">File</label>
          <Input id="dr-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
        </div>
        <Button type="submit" disabled={busy || !file}>
          <Upload className="w-3.5 h-3.5 mr-2" />{busy ? "Uploading…" : "Upload"}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="max-h-64 overflow-y-auto divide-y divide-border">
        {docs.length === 0 && <p className="text-sm text-muted-foreground">No documents yet.</p>}
        {docs.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="text-sm truncate">{d.title}</p>
              <p className="text-xs text-muted-foreground">{categoryLabel(d.category)}{d.is_active ? "" : " · hidden"}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => toggle(d)} aria-label="Toggle visibility">
                {d.is_active ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(d)} aria-label="Delete document">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export default DataRoomUploader;