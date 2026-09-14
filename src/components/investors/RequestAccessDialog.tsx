import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Lock } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  firm: z.string().trim().max(160).optional(),
  title: z.string().trim().max(120).optional(),
  linkedin_url: z.string().trim().max(300).optional(),
  investment_focus: z.string().trim().max(300).optional(),
  ticket_size: z.string().trim().max(80).optional(),
  message: z.string().trim().max(1500).optional(),
});

export default function RequestAccessDialog({
  open, onOpenChange, onSubmitted,
}: { open: boolean; onOpenChange: (v: boolean) => void; onSubmitted?: () => void }) {
  const [form, setForm] = useState({
    full_name: "", email: "", firm: "", title: "", linkedin_url: "",
    investment_focus: "", ticket_size: "", message: "",
  });
  const [nda, setNda] = useState(false);
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "Please check the form");
      return;
    }
    if (!nda || signature.trim().length < 2) {
      setError("You must accept the NDA and type your full name as signature.");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: err } = await supabase.from("investor_profiles").insert({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        firm: form.firm || null,
        title: form.title || null,
        linkedin_url: form.linkedin_url || null,
        investment_focus: form.investment_focus || null,
        ticket_size: form.ticket_size || null,
        message: form.message || null,
        user_id: user?.id ?? null,
        status: "pending",
        nda_accepted_at: new Date().toISOString(),
        nda_signature: signature.trim(),
      });
      if (err) throw err;
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      setError((err as Error).message || "Could not submit your request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4" /> Request Investor Data Room Access
          </DialogTitle>
          <DialogDescription>
            Access is granted to qualified investors under NDA. Approved requests receive a secure,
            time-limited sign-in to the investor portal.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 mx-auto text-primary" />
            <p className="font-medium">Request received.</p>
            <p className="text-sm text-muted-foreground">
              Your NDA acceptance has been recorded. You will be notified at {form.email} once access is approved.
              Create an account with the same email address so your access can be linked.
            </p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label htmlFor="ir-name">Full name *</Label><Input id="ir-name" value={form.full_name} onChange={set("full_name")} maxLength={120} required /></div>
              <div><Label htmlFor="ir-email">Email *</Label><Input id="ir-email" type="email" value={form.email} onChange={set("email")} maxLength={255} required /></div>
              <div><Label htmlFor="ir-firm">Firm</Label><Input id="ir-firm" value={form.firm} onChange={set("firm")} maxLength={160} /></div>
              <div><Label htmlFor="ir-title">Title</Label><Input id="ir-title" value={form.title} onChange={set("title")} maxLength={120} /></div>
              <div><Label htmlFor="ir-li">LinkedIn</Label><Input id="ir-li" value={form.linkedin_url} onChange={set("linkedin_url")} maxLength={300} placeholder="linkedin.com/in/…" /></div>
              <div><Label htmlFor="ir-ticket">Typical ticket size</Label><Input id="ir-ticket" value={form.ticket_size} onChange={set("ticket_size")} maxLength={80} placeholder="$100k – $500k" /></div>
            </div>
            <div><Label htmlFor="ir-focus">Investment focus</Label><Input id="ir-focus" value={form.investment_focus} onChange={set("investment_focus")} maxLength={300} placeholder="B2B SaaS, AI infrastructure, emerging markets" /></div>
            <div><Label htmlFor="ir-msg">Why you're interested</Label><Textarea id="ir-msg" value={form.message} onChange={set("message")} maxLength={1500} rows={3} /></div>

            <div className="rounded-md border p-3 text-xs text-muted-foreground max-h-32 overflow-y-auto leading-relaxed">
              <strong className="text-foreground">Mutual Non-Disclosure — summary.</strong> Materials in the Intelligent Office
              investor data room are confidential information of the Intelligent Office showcase project By requesting access you agree
              to (a) use the materials solely to evaluate a potential investment, (b) not disclose them to any third party
              other than your professional advisers bound by equivalent confidentiality, (c) not reproduce or distribute them,
              and (d) return or destroy them on request. Your access is logged per document. This summary supplements, and does
              not replace, the full NDA executed prior to term sheet.
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id="ir-nda" checked={nda} onCheckedChange={(v) => setNda(Boolean(v))} />
              <Label htmlFor="ir-nda" className="text-sm font-normal leading-snug">
                I have read and accept the confidentiality terms above.
              </Label>
            </div>
            <div><Label htmlFor="ir-sign">Type your full name as signature *</Label><Input id="ir-sign" value={signature} onChange={(e) => setSignature(e.target.value)} maxLength={120} /></div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
