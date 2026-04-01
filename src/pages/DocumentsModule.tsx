import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useProfileNames } from "@/hooks/useProfileNames";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Download, Search, FolderOpen, File, FileImage, FileSpreadsheet, Upload, Eye, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InternalMemos from "@/components/documents/InternalMemos";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchDocuments = async () => {
    if (!org) return;
    const { data } = await supabase.from("documents").select("*").eq("organization_id", org.id).order("created_at", { ascending: false });
    setDocuments(data || []);
    if (data) resolve(data.map(d => d.uploaded_by));
    setLoading(false);
  };

  useEffect(() => { fetchDocuments(); }, [org]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !org || !selectedFile) { toast.error("Please select a file"); return; }
    setUploading(true);

    const filePath = `${org.id}/${Date.now()}-${selectedFile.name}`;

    // Upload to storage bucket
    const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, selectedFile);
    if (uploadError) { toast.error("Upload failed: " + uploadError.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);

    const { error } = await supabase.from("documents").insert({
      organization_id: org.id,
      uploaded_by: user.id,
      title: form.title || selectedFile.name,
      description: form.description || null,
      file_url: filePath,
      file_name: selectedFile.name,
      file_size: selectedFile.size,
      file_type: selectedFile.type,
      category: form.category,
    });

    if (error) { toast.error("Failed to save document record"); setUploading(false); return; }
    toast.success("Document uploaded!");
    setDialogOpen(false);
    setSelectedFile(null);
    setForm({ title: "", category: "general", description: "" });
    fetchDocuments();
    setUploading(false);
  };

  const downloadFile = async (doc: any) => {
    const { data, error } = await supabase.storage.from("documents").download(doc.file_url);
    if (error || !data) { toast.error("Download failed"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = doc.file_name; a.click();
    URL.revokeObjectURL(url);
  };

  const previewFile = async (doc: any) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(doc.file_url, 3600);
    if (error || !data?.signedUrl) { toast.error("Preview unavailable"); return; }
    setPreviewUrl(data.signedUrl);
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

        <Tabs defaultValue="files" className="space-y-4">
          <TabsList className="bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="files" className="rounded-lg data-[state=active]:bg-card text-xs sm:text-sm">
              <FolderOpen className="w-3.5 h-3.5 mr-1" /> Files
            </TabsTrigger>
            <TabsTrigger value="memos" className="rounded-lg data-[state=active]:bg-card text-xs sm:text-sm">
              <FileText className="w-3.5 h-3.5 mr-1" /> Internal Memos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="memos">
            <InternalMemos />
          </TabsContent>

          <TabsContent value="files">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
            <FileText className="w-5 h-5 text-accent mb-2" />
            <p className="text-2xl font-bold text-foreground">{documents.length}</p>
            <p className="text-xs text-muted-foreground">Total Documents</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }} className="glass-card rounded-xl p-4">
            <FolderOpen className="w-5 h-5 text-svo-blue mb-2" />
            <p className="text-2xl font-bold text-foreground">{new Set(documents.map(d => d.category)).size}</p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="glass-card rounded-xl p-4">
            <Upload className="w-5 h-5 text-svo-gold mb-2" />
            <p className="text-2xl font-bold text-foreground">{documents.length > 0 ? Math.round(documents.reduce((s, d) => s + Number(d.file_size || 0), 0) / 1024 / 1024) : 0} MB</p>
            <p className="text-xs text-muted-foreground">Total Size</p>
          </motion.div>
        </div>

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
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Document title" className="rounded-xl" />
                </div>
                <div className="space-y-2"><Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" className="rounded-xl resize-none" rows={2} />
                </div>
                <div className="space-y-2"><Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
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

        {/* Preview modal */}
        {previewUrl && (
          <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
            <DialogContent className="rounded-2xl max-w-4xl max-h-[85vh]">
              <DialogHeader><DialogTitle>Document Preview</DialogTitle></DialogHeader>
              <iframe src={previewUrl} className="w-full h-[70vh] rounded-xl border border-border" />
            </DialogContent>
          </Dialog>
        )}

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
                        {doc.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="outline" className={`text-[10px] ${categoryColors[doc.category] || ""}`}>{doc.category}</Badge>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px]">v{doc.version || 1}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground">{getName(doc.uploaded_by)}</span>
                        <span className="text-[10px] text-muted-foreground"> · {format(new Date(doc.created_at), "MMM d, yyyy")}</span>
                        <span className="text-[10px] text-muted-foreground"> · {doc.file_size ? `${Math.round(doc.file_size / 1024)}KB` : ""}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="rounded-lg text-xs h-7 flex-1" onClick={() => previewFile(doc)}>
                        <Eye className="w-3 h-3 mr-1" /> Preview
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg text-xs h-7 flex-1" onClick={() => downloadFile(doc)}>
                        <Download className="w-3 h-3 mr-1" /> Download
                      </Button>
                    </div>
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
