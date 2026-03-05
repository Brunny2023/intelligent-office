import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useProfileNames } from "@/hooks/useProfileNames";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Download, Search, FolderOpen, File, FileImage, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const categoryColors: Record<string, string> = {
  general: "bg-muted text-muted-foreground",
  policy: "bg-svo-blue/10 text-svo-blue",
  sop: "bg-accent/10 text-accent",
  template: "bg-svo-gold/10 text-svo-gold",
  report: "bg-green-500/10 text-green-600",
  contract: "bg-destructive/10 text-destructive",
};

const fileIcon = (type: string | null) => {
  if (!type) return File;
  if (type.includes("image")) return FileImage;
  if (type.includes("sheet") || type.includes("csv")) return FileSpreadsheet;
  return FileText;
};

const DocumentsModule = () => {
  const { user } = useAuth();
  const { org, loading: orgLoading } = useOrganization();
  const { resolve, getName } = useProfileNames();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", category: "general", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!org) return;
    supabase.from("documents").select("*").eq("organization_id", org.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        setDocuments(data || []);
        if (data) resolve(data.map(d => d.uploaded_by));
        setLoading(false);
      });
  }, [org]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org || !selectedFile) { toast.error("Please select a file"); return; }
    setUploading(true);

    // For now, store as a placeholder URL since storage bucket setup may be needed
    const fileUrl = `documents/${org.id}/${Date.now()}-${selectedFile.name}`;

    const { error } = await supabase.from("documents").insert({
      organization_id: org.id,
      uploaded_by: user.id,
      title: form.title || selectedFile.name,
      description: form.description || null,
      file_url: fileUrl,
      file_name: selectedFile.name,
      file_size: selectedFile.size,
      file_type: selectedFile.type,
      category: form.category,
    });

    if (error) { toast.error("Failed to upload document"); setUploading(false); return; }
    toast.success("Document recorded!");
    setDialogOpen(false);
    setSelectedFile(null);
    setForm({ title: "", category: "general", description: "" });
    const { data } = await supabase.from("documents").select("*").eq("organization_id", org.id).order("created_at", { ascending: false });
    setDocuments(data || []);
    setUploading(false);
  };

  const filtered = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) || d.file_name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || d.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (orgLoading) {
    return <AppLayout title="Documents"><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  return (
    <AppLayout title="Documents">
      <div className="p-6 md:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Documents & Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">Organization files, SOPs, policies & templates</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="pl-10 rounded-xl" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(categoryColors).map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-accent text-accent-foreground"><Plus className="w-4 h-4 mr-1" /> Upload</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2"><Label>File</Label>
                  <Input type="file" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="rounded-xl" required />
                </div>
                <div className="space-y-2"><Label>Title</Label>
                  <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Document title" className="rounded-xl" />
                </div>
                <div className="space-y-2"><Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.keys(categoryColors).map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={uploading} className="w-full rounded-xl bg-accent text-accent-foreground">
                  {uploading ? "Uploading..." : "Upload Document"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No documents found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((doc, i) => {
                const Icon = fileIcon(doc.file_type);
                return (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.03 } }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -4, boxShadow: "0 8px 24px hsl(var(--svo-navy) / 0.1)" }}
                    className="glass-card-strong rounded-xl p-4 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm truncate">{doc.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="outline" className={`text-[10px] ${categoryColors[doc.category] || ""}`}>{doc.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">{getName(doc.uploaded_by)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {format(new Date(doc.created_at), "MMM d, yyyy")} · {doc.file_size ? `${Math.round(doc.file_size / 1024)}KB` : ""}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DocumentsModule;
