import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/dashboard/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, FileText, AlertTriangle, Download, Clock, Users, Activity, Globe } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import ComplianceReportButton from "@/components/security/ComplianceReportButton";
import InterOrgAuditLog from "@/components/interorg/InterOrgAuditLog";

const SecurityModule = () => {
  const { user } = useAuth();
  const { org, loading: orgLoading } = useOrganization();
  const [compliance, setCompliance] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logFilter, setLogFilter] = useState("all");
  const [newIp, setNewIp] = useState("");

  const fetchData = async () => {
    if (!org) return;
    const [{ data: comp }, { data: logs }] = await Promise.all([
      supabase.from("compliance_settings").select("*").eq("organization_id", org.id).maybeSingle(),
      supabase.from("activity_logs").select("*").eq("organization_id", org.id).order("created_at", { ascending: false }).limit(100),
    ]);

    if (!comp) {
      const { data: newComp } = await supabase.from("compliance_settings")
        .insert({ organization_id: org.id, updated_by: user?.id })
        .select().single();
      setCompliance(newComp);
    } else {
      setCompliance(comp);
    }

    setAuditLogs(logs || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [org]);

  const updateCompliance = async (field: string, value: any) => {
    if (!compliance) return;
    const updated = { ...compliance, [field]: value };
    setCompliance(updated);
    const { error } = await supabase.from("compliance_settings")
      .update({ [field]: value, updated_at: new Date().toISOString(), updated_by: user?.id })
      .eq("id", compliance.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings updated");
  };

  const addIp = () => {
    if (!newIp || !compliance) return;
    const ips = [...(compliance.allowed_ips || []), newIp];
    updateCompliance("allowed_ips", ips);
    setNewIp("");
  };

  const removeIp = (ip: string) => {
    if (!compliance) return;
    updateCompliance("allowed_ips", (compliance.allowed_ips || []).filter((i: string) => i !== ip));
  };

  const exportAuditLog = () => {
    const csv = [
      "Timestamp,Action,Entity Type,Entity ID,User ID",
      ...auditLogs.map(l => `"${l.created_at}","${l.action}","${l.entity_type}","${l.entity_id || ""}","${l.user_id}"`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  };

  const filteredLogs = logFilter === "all" ? auditLogs : auditLogs.filter(l => l.entity_type === logFilter);
  const entityTypes = [...new Set(auditLogs.map(l => l.entity_type))];

  if (orgLoading || loading) {
    return (
      <AppLayout title="Security">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Security">
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          eyebrow="Trust"
          icon={Shield}
          title="Security & Compliance"
          subtitle="Data protection, audit trails & regulatory compliance"
        />

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Audit Events", value: auditLogs.length, icon: Activity, color: "text-accent" },
            { label: "GDPR", value: compliance?.gdpr_enabled ? "ON" : "OFF", icon: Globe, color: compliance?.gdpr_enabled ? "text-green-600" : "text-muted-foreground" },
            { label: "NDPR", value: compliance?.ndpr_enabled ? "ON" : "OFF", icon: Shield, color: compliance?.ndpr_enabled ? "text-green-600" : "text-muted-foreground" },
            { label: "Data Retention", value: `${compliance?.data_retention_days || 365}d`, icon: Clock, color: "text-svo-blue" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
              whileHover={{ y: -2, transition: { type: "spring", stiffness: 400 } }}
              className="glass-card-strong rounded-xl p-4"
            >
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="compliance">
          <TabsList className="bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="compliance" className="rounded-lg data-[state=active]:bg-card"><Lock className="w-3.5 h-3.5 mr-1" />Compliance</TabsTrigger>
            <TabsTrigger value="audit" className="rounded-lg data-[state=active]:bg-card"><Eye className="w-3.5 h-3.5 mr-1" />Audit Trail</TabsTrigger>
            <TabsTrigger value="interorg" className="rounded-lg data-[state=active]:bg-card"><Globe className="w-3.5 h-3.5 mr-1" />Inter-org</TabsTrigger>
            <TabsTrigger value="access" className="rounded-lg data-[state=active]:bg-card"><Users className="w-3.5 h-3.5 mr-1" />Access Control</TabsTrigger>
          </TabsList>

          <div className="flex justify-end mt-3">
            <ComplianceReportButton />
          </div>

          <TabsContent value="compliance" className="mt-4 space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card-strong rounded-xl p-6 space-y-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Globe className="w-4 h-4 text-accent" /> Regulatory Compliance</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground font-medium">GDPR Compliance</Label>
                      <p className="text-xs text-muted-foreground">EU General Data Protection Regulation</p>
                    </div>
                    <Switch checked={compliance?.gdpr_enabled || false} onCheckedChange={v => updateCompliance("gdpr_enabled", v)} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground font-medium">NDPR Compliance</Label>
                      <p className="text-xs text-muted-foreground">Nigeria Data Protection Regulation</p>
                    </div>
                    <Switch checked={compliance?.ndpr_enabled || false} onCheckedChange={v => updateCompliance("ndpr_enabled", v)} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground font-medium">Audit Logging</Label>
                      <p className="text-xs text-muted-foreground">Track all system activity</p>
                    </div>
                    <Switch checked={compliance?.audit_log_enabled ?? true} onCheckedChange={v => updateCompliance("audit_log_enabled", v)} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground font-medium">Require MFA</Label>
                      <p className="text-xs text-muted-foreground">Multi-factor authentication for all users</p>
                    </div>
                    <Switch checked={compliance?.mfa_required || false} onCheckedChange={v => updateCompliance("mfa_required", v)} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Data Retention Period</Label>
                    <Select value={String(compliance?.data_retention_days || 365)} onValueChange={v => updateCompliance("data_retention_days", Number(v))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">180 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="730">2 years</SelectItem>
                        <SelectItem value="1825">5 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(compliance?.gdpr_enabled || compliance?.ndpr_enabled) && (
                    <div className="glass-card rounded-xl p-4 border-l-4 border-l-accent">
                      <p className="text-sm font-medium text-foreground">Active Regulations</p>
                      <div className="flex gap-2 mt-2">
                        {compliance?.gdpr_enabled && <Badge className="bg-svo-blue/10 text-svo-blue">GDPR</Badge>}
                        {compliance?.ndpr_enabled && <Badge className="bg-accent/10 text-accent">NDPR</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Data subject rights, consent management, and breach notification protocols are active.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="audit" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Select value={logFilter} onValueChange={setLogFilter}>
                  <SelectTrigger className="rounded-xl w-[180px]"><SelectValue placeholder="Filter" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {entityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Badge variant="outline">{filteredLogs.length} events</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-xl" onClick={exportAuditLog}>
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {filteredLogs.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center">
                  <Eye className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No audit events recorded yet</p>
                </div>
              ) : filteredLogs.map((log, i) => (
                <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: Math.min(i * 0.02, 0.5) } }}
                  className="glass-card rounded-xl p-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{log.action}</span>
                      <Badge variant="outline" className="text-[10px]">{log.entity_type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      {log.entity_id && ` · ${log.entity_id.slice(0, 8)}…`}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="interorg" className="mt-4 space-y-4">
            <div className="glass-card-strong rounded-xl p-6">
              {org?.id && <InterOrgAuditLog orgId={org.id} />}
            </div>
          </TabsContent>

          <TabsContent value="access" className="mt-4 space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card-strong rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Lock className="w-4 h-4 text-accent" /> IP Restriction</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground font-medium">Enable IP Whitelisting</Label>
                  <p className="text-xs text-muted-foreground">Only allow access from specific IP addresses</p>
                </div>
                <Switch checked={compliance?.ip_restriction_enabled || false} onCheckedChange={v => updateCompliance("ip_restriction_enabled", v)} />
              </div>

              {compliance?.ip_restriction_enabled && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="192.168.1.0/24" className="rounded-xl flex-1" />
                    <Button onClick={addIp} className="rounded-xl bg-accent text-accent-foreground">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(compliance?.allowed_ips || []).map((ip: string) => (
                      <Badge key={ip} variant="outline" className="px-3 py-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => removeIp(ip)}>
                        {ip} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="glass-card-strong rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Shield className="w-4 h-4 text-accent" /> Security Features</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: "End-to-End Encryption", desc: "All data encrypted in transit and at rest", active: true },
                  { label: "Role-Based Access Control", desc: "6 granular roles with scoped permissions", active: true },
                  { label: "Data Isolation", desc: "Complete tenant data separation", active: true },
                  { label: "Session Management", desc: "Automatic session timeout and refresh", active: true },
                ].map((f, i) => (
                  <div key={f.label} className="glass-card rounded-xl p-4 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <Lock className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SecurityModule;
