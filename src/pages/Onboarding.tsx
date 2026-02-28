import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Building2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ orgName: "", slug: "" });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (name: string) => {
    setForm({ orgName: name, slug: generateSlug(name) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orgName || !form.slug) {
      toast.error("Please enter an organization name");
      return;
    }
    if (!user) return;

    setLoading(true);

    // 1. Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: form.orgName, slug: form.slug })
      .select()
      .single();

    if (orgError) {
      setLoading(false);
      toast.error(orgError.message.includes("duplicate") ? "This slug is already taken" : orgError.message);
      return;
    }

    // 2. Update profile with org
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ organization_id: org.id })
      .eq("id", user.id);

    if (profileError) {
      setLoading(false);
      toast.error(profileError.message);
      return;
    }

    // 3. Assign owner role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, organization_id: org.id, role: "owner" });

    if (roleError) {
      setLoading(false);
      toast.error(roleError.message);
      return;
    }

    setLoading(false);
    toast.success("Organization created!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen gradient-hero-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-svo-gold/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-svo-gold" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">Set up your organization</h1>
          <p className="text-primary-foreground/50 text-sm mt-2">Create your digital headquarters</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card-strong rounded-2xl p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="orgName" className="text-foreground">Organization Name</Label>
            <Input
              id="orgName"
              placeholder="Acme Corporation"
              value={form.orgName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="text-foreground">Workspace URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">soteria.app/</span>
              <Input
                id="slug"
                placeholder="acme-corp"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-svo-gold text-svo-navy hover:bg-svo-gold/90 font-semibold"
          >
            {loading ? "Creating..." : "Create Organization"}
            {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
