import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import LogoUpload from "@/components/LogoUpload";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Save, X, Plus, Building2 } from "lucide-react";
import NotificationPreferences from "@/components/settings/NotificationPreferences";
import EgressSettings from "@/components/settings/EgressSettings";

const SettingsModule = () => {
  const { user } = useAuth();
  const { org, loading: orgLoading } = useOrganization();
  const { isAdmin, role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mission, setMission] = useState("");
  const [tagline, setTagline] = useState("");
  const [coreValues, setCoreValues] = useState<string[]>([]);
  const [newValue, setNewValue] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!orgLoading && !roleLoading) {
      if (org) {
        setName(org.name);
        setMission(org.mission || "");
        setTagline(org.brand_tagline || "");
        setCoreValues(org.core_values || []);
        setLogoUrl(org.logo_url);
      }
    }
  }, [org, orgLoading, roleLoading, role, navigate]);

  const addValue = () => {
    if (newValue.trim() && !coreValues.includes(newValue.trim())) {
      setCoreValues([...coreValues, newValue.trim()]);
      setNewValue("");
    }
  };

  const removeValue = (v: string) => setCoreValues(coreValues.filter(val => val !== v));

  const handleSave = async () => {
    if (!org || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("organizations").update({
      name: name.trim(),
      mission: mission.trim() || null,
      brand_tagline: tagline.trim() || null,
      core_values: coreValues,
      logo_url: logoUrl || null,
    }).eq("id", org.id);
    if (error) toast.error("Failed to save: " + error.message);
    else toast.success("Settings saved! Refresh to see changes across the platform.");
    setSaving(false);
  };

  if (orgLoading || roleLoading) {
    return (
      <AppLayout title="Settings">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Settings">
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        <PageHeader
          eyebrow="Workspace"
          icon={Settings}
          title="Organization Settings"
          subtitle="Manage your organization's branding and identity"
        />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}>
          <NotificationPreferences />
        </motion.div>

        {role === "owner" && org && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.08 } }}>
            <EgressSettings organizationId={org.id} />
          </motion.div>
        )}

        {role === "owner" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5" /> Brand Identity</CardTitle>
              <CardDescription>Update your organization's logo, name, and branding elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Organization Logo</label>
                <div className="flex items-center gap-4">
                  <LogoUpload currentUrl={logoUrl} onUploaded={setLogoUrl} size="lg" />
                  <div className="text-sm text-muted-foreground">
                    <p>Upload your company logo</p>
                    <p className="text-xs mt-1">Max 2MB, PNG or JPG recommended</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Organization Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your company name" />
              </div>

              {/* Tagline */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Brand Tagline</label>
                <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="A short tagline for your brand" />
              </div>

              {/* Mission */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Mission Statement</label>
                <Textarea value={mission} onChange={e => setMission(e.target.value)} placeholder="Your organization's mission..." rows={3} />
              </div>

              {/* Core Values */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Core Values</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {coreValues.map(v => (
                    <Badge key={v} variant="secondary" className="gap-1 pl-3 pr-1.5 py-1.5">
                      {v}
                      <button onClick={() => removeValue(v)} className="ml-1 hover:text-destructive transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="Add a core value"
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addValue(); } }}
                  />
                  <Button variant="outline" size="icon" onClick={addValue} disabled={!newValue.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving || !name.trim()} className="w-full sm:w-auto gap-2">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default SettingsModule;
