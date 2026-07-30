import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PersonAvatar } from "@/components/dashboard/kit";

interface AvatarUploadProps {
  currentUrl?: string | null;
  name?: string | null;
  onUploaded: (url: string) => void;
  size?: number;
  className?: string;
}

/** Circular profile photo uploader — writes to the public logo/media bucket. */
const AvatarUpload = ({ currentUrl, name, onUploaded, size = 88, className }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Photo must be under 2MB"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("org-logos").upload(path, file, { cacheControl: "3600", upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
    setPreview(data.publicUrl);
    onUploaded(data.publicUrl);
    setUploading(false);
    toast.success("Photo updated");
  };

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => !uploading && inputRef.current?.click()}
      className={cn("relative cursor-pointer rounded-full group", className)}
      style={{ width: size, height: size }}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <PersonAvatar name={name} src={preview} size={size} />
      <div className="absolute inset-0 rounded-full bg-[hsl(var(--svo-navy)/0.6)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
      </div>
      {uploading && (
        <div className="absolute inset-0 rounded-full bg-[hsl(var(--svo-navy)/0.6)] flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      )}
    </motion.div>
  );
};

export default AvatarUpload;
