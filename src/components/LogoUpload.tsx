import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LogoUploadProps {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "w-14 h-14", md: "w-20 h-20", lg: "w-28 h-28" };
const iconSizes = { sm: "w-5 h-5", md: "w-7 h-7", lg: "w-10 h-10" };

const LogoUpload = ({ currentUrl, onUploaded, size = "md", className }: LogoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("org-logos").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
    setPreview(data.publicUrl);
    onUploaded(data.publicUrl);
    setUploading(false);
    toast.success("Logo uploaded!");
  };

  const clearLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onUploaded("");
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      onClick={() => !uploading && inputRef.current?.click()}
      className={cn(
        "relative rounded-2xl border-2 border-dashed border-border hover:border-accent cursor-pointer flex items-center justify-center overflow-hidden transition-colors bg-muted/30",
        sizes[size],
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <AnimatePresence mode="wait">
        {uploading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader2 className={cn("text-accent animate-spin", iconSizes[size])} />
          </motion.div>
        ) : preview ? (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="w-full h-full relative">
            <img src={preview} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            <button
              onClick={clearLogo}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-1">
            <Camera className={cn("text-muted-foreground", iconSizes[size])} />
            {size !== "sm" && <span className="text-[10px] text-muted-foreground">Upload logo</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LogoUpload;
