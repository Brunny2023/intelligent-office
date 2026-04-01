import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PenLine, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface SignaturePadProps {
  onSaved?: (signatureId: string, signatureData: string) => void;
  trigger?: React.ReactNode;
}

const SignaturePad = ({ onSaved, trigger }: SignaturePadProps) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [open, setOpen] = useState(false);
  const [existingSignature, setExistingSignature] = useState<{ id: string; signature_data: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    supabase
      .from("user_signatures" as any)
      .select("id, signature_data")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingSignature(data as any);
          // Draw existing signature on canvas
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.onload = () => ctx?.drawImage(img, 0, 0);
            img.src = (data as any).signature_data;
          }
        }
      });
  }, [user, open]);

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x * (canvas.width / rect.width), y * (canvas.height / rect.height));
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "hsl(var(--foreground))";
    ctx.lineTo(x * (canvas.width / rect.width), y * (canvas.height / rect.height));
    ctx.stroke();
  };

  const stopDraw = () => setDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    if (!user || !canvasRef.current) return;
    setSaving(true);
    const data = canvasRef.current.toDataURL("image/png");

    if (existingSignature) {
      const { error } = await supabase
        .from("user_signatures" as any)
        .update({ signature_data: data, updated_at: new Date().toISOString() } as any)
        .eq("id", existingSignature.id);
      if (error) { toast.error("Failed to update signature"); setSaving(false); return; }
      setExistingSignature({ ...existingSignature, signature_data: data });
      onSaved?.(existingSignature.id, data);
    } else {
      const { data: row, error } = await supabase
        .from("user_signatures" as any)
        .insert({ user_id: user.id, signature_data: data } as any)
        .select("id, signature_data")
        .single();
      if (error) { toast.error("Failed to save signature"); setSaving(false); return; }
      const r = row as any;
      setExistingSignature(r);
      onSaved?.(r.id, r.signature_data);
    }
    toast.success("Signature saved!");
    setSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="rounded-xl">
            <PenLine className="w-4 h-4 mr-1" /> {existingSignature ? "Edit Signature" : "Set Signature"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>Your Signature</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <canvas
              ref={canvasRef}
              width={500}
              height={200}
              className="w-full h-40 cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearCanvas} className="rounded-xl flex-1">
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
            <Button onClick={saveSignature} disabled={saving} className="rounded-xl flex-1 bg-accent text-accent-foreground">
              <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignaturePad;
