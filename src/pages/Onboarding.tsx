import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight, ArrowLeft, Plus, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import LogoUpload from "@/components/LogoUpload";
import { buildTenantUrl, TENANT_ROOT_DOMAIN, getTenantSlug } from "@/lib/tenant";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    orgName: "", slug: "", mission: "", tagline: "",
    coreValues: [] as string[], newValue: "", logoUrl: "",
  });

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, orgName: name, slug: generateSlug(name) }));
  };

  const addCoreValue = () => {
    if (!form.newValue.trim() || form.coreValues.length >= 8) return;
    setForm(f => ({ ...f, coreValues: [...f.coreValues, f.newValue.trim()], newValue: "" }));
  };

  const removeCoreValue = (idx: number) => {
    setForm(f => ({ ...f, coreValues: f.coreValues.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orgName || !form.slug || !user) {
      toast.error("Please enter an organization name");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.rpc("complete_onboarding", {
      _name: form.orgName,
      _slug: form.slug,
      _mission: form.mission || null,
      _brand_tagline: form.tagline || null,
      _core_values: form.coreValues,
      _logo_url: form.logoUrl || null,
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    const result = data as any;
    if (result?.error) {
      setLoading(false);
      toast.error(result.error);
      return;
    }

    setLoading(false);
    toast.success("Organization created!");

    // If we're already on a tenant subdomain (or local dev), just go to dashboard.
    // Otherwise redirect to the new org's subdomain so the URL reflects the tenant.
    const currentTenant = getTenantSlug();
    if (currentTenant || window.location.hostname.endsWith(".lovable.app") || window.location.hostname === "localhost") {
      navigate("/dashboard");
    } else {
      window.location.href = `${buildTenantUrl(form.slug)}/dashboard`;
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 80 : -80, opacity: 0 }),
  };

  return (
    <div className="min-h-screen gradient-hero-bg flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-14 h-14 rounded-2xl bg-svo-gold/10 flex items-center justify-center mx-auto mb-4"
          >
            <Building2 className="w-7 h-7 text-svo-gold" />
          </motion.div>
          <h1 className="text-2xl font-bold text-primary-foreground">Set up your organization</h1>
          <p className="text-primary-foreground/50 text-sm mt-2">Create your digital headquarters</p>
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2].map(s => (
              <motion.div
                key={s}
                animate={{ scale: step === s ? 1.3 : 1, backgroundColor: step >= s ? "hsl(38,80%,55%)" : "rgba(255,255,255,0.2)" }}
                className="w-2.5 h-2.5 rounded-full"
                transition={{ type: "spring", stiffness: 400 }}
              />
            ))}
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="glass-card-strong rounded-2xl p-8 space-y-5">
          <AnimatePresence mode="wait" custom={step}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="space-y-5"
              >
                <div className="flex items-start gap-4">
                  <LogoUpload
                    currentUrl={form.logoUrl || null}
                    onUploaded={(url) => setForm(f => ({ ...f, logoUrl: url }))}
                    size="lg"
                  />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="orgName" className="text-foreground">Organization Name</Label>
                    <Input
                      id="orgName"
                      placeholder="Acme Corporation"
                      value={form.orgName}
                      onChange={e => handleNameChange(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-foreground">Workspace URL</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      id="slug"
                      placeholder="acme-corp"
                      value={form.slug}
                      onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                      className="h-11 rounded-xl text-right"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">.{TENANT_ROOT_DOMAIN}</span>
                  </div>
                  {form.slug && (
                    <p className="text-xs text-muted-foreground">
                      Your workspace will live at <span className="text-accent font-medium">{form.slug}.{TENANT_ROOT_DOMAIN}</span>
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => { if (form.orgName && form.slug) setStep(2); else toast.error("Please fill in organization name"); }}
                  className="w-full h-11 rounded-xl bg-svo-gold text-svo-navy hover:bg-svo-gold/90 font-semibold"
                >
                  Next: Brand Identity <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={2}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-accent" /> Brand Tagline</Label>
                  <Input
                    placeholder="Innovation at the speed of thought"
                    value={form.tagline}
                    onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Mission Statement</Label>
                  <Textarea
                    placeholder="To empower organizations to operate efficiently from anywhere..."
                    value={form.mission}
                    onChange={e => setForm(f => ({ ...f, mission: e.target.value }))}
                    className="rounded-xl resize-none"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Core Values</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Innovation"
                      value={form.newValue}
                      onChange={e => setForm(f => ({ ...f, newValue: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCoreValue(); } }}
                      className="h-9 rounded-xl flex-1"
                    />
                    <Button type="button" size="sm" variant="outline" className="rounded-xl h-9" onClick={addCoreValue}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <AnimatePresence>
                      {form.coreValues.map((v, i) => (
                        <motion.div key={v} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: "spring", stiffness: 400 }}>
                          <Badge variant="outline" className="px-3 py-1 bg-accent/10 text-accent cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => removeCoreValue(i)}>
                            {v} <X className="w-3 h-3 ml-1" />
                          </Badge>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-11 rounded-xl bg-svo-gold text-svo-navy hover:bg-svo-gold/90 font-semibold"
                  >
                    {loading ? "Creating..." : "Create Organization"}
                    {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
