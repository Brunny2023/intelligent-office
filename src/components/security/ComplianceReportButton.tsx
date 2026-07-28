import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { format } from "date-fns";

export default function ComplianceReportButton() {
  const [loading, setLoading] = useState<null | "pdf" | "csv">(null);

  const fetchReport = async () => {
    const { data, error } = await supabase.functions.invoke("compliance-report", { body: {} });
    if (error || (data as any)?.error) throw new Error((data as any)?.error ?? error?.message ?? "Failed");
    return data as any;
  };

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = async () => {
    setLoading("csv");
    try {
      const r = await fetchReport();
      const rows: string[] = [];
      rows.push("Section,Field,Value");
      rows.push(`Organization,Name,"${r.organization.name ?? ""}"`);
      rows.push(`Organization,Slug,${r.organization.slug ?? ""}`);
      rows.push(`Retention,Days,${r.retention.data_retention_days}`);
      rows.push(`Retention,Schedule,"${r.retention.purge_schedule}"`);
      rows.push(`Retention,GDPR,${r.retention.gdpr_enabled}`);
      rows.push(`Retention,NDPR,${r.retention.ndpr_enabled}`);
      rows.push(`Retention,MFA required,${r.retention.mfa_required}`);
      rows.push(`Sharing,Consents total,${r.sharing.consents_total}`);
      rows.push(`Sharing,Consents active,${r.sharing.consents_active}`);
      rows.push(`Sharing,Document shares total,${r.sharing.document_shares_total}`);
      rows.push(`Sharing,Document shares active,${r.sharing.document_shares_active}`);
      rows.push(`Ledger,Entries,${r.ledger.entries}`);
      rows.push(`Ledger,Integrity,${r.ledger.integrity.status}`);
      rows.push(`Predictive alerts,Total,${r.predictive_alerts.total}`);
      Object.entries(r.predictive_alerts.by_type).forEach(([k, v]) => rows.push(`Predictive alerts,${k},${v}`));
      rows.push("");
      rows.push("Audit log");
      rows.push("occurred_at,event_type,owner_org_id,partner_org_id,actor_id,resource_type,resource_id");
      (r.audit_log ?? []).forEach((e: any) => {
        rows.push([e.occurred_at, e.event_type, e.owner_org_id, e.partner_org_id ?? "", e.actor_id ?? "", e.resource_type ?? "", e.resource_id ?? ""].join(","));
      });
      download(new Blob([rows.join("\n")], { type: "text/csv" }), `compliance-${r.organization.slug}-${Date.now()}.csv`);
      toast.success("CSV downloaded");
    } catch (e: any) { toast.error(e.message); }
    setLoading(null);
  };

  const exportPdf = async () => {
    setLoading("pdf");
    try {
      const r = await fetchReport();
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      let y = 56;
      doc.setFont("helvetica", "bold"); doc.setFontSize(20);
      doc.text("Compliance Snapshot", 56, y); y += 24;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(120);
      doc.text(`${r.organization.name} - Generated ${format(new Date(r.generated_at), "PPpp")}`, 56, y); y += 24;
      doc.setTextColor(20);

      const section = (title: string, lines: string[]) => {
        if (y > 720) { doc.addPage(); y = 56; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(title, 56, y); y += 16;
        doc.setFont("helvetica", "normal"); doc.setFontSize(10);
        for (const line of lines) {
          if (y > 740) { doc.addPage(); y = 56; }
          doc.text(line, 68, y); y += 14;
        }
        y += 8;
      };

      section("Retention", [
        `Data retention: ${r.retention.data_retention_days} days`,
        `Purge schedule: ${r.retention.purge_schedule}`,
        `GDPR: ${r.retention.gdpr_enabled ? "enabled" : "disabled"}`,
        `NDPR: ${r.retention.ndpr_enabled ? "enabled" : "disabled"}`,
        `MFA required: ${r.retention.mfa_required ? "yes" : "no"}`,
        `Audit log: ${r.retention.audit_log_enabled ? "enabled" : "disabled"}`,
      ]);

      section("Inter-org sharing", [
        `Data-sharing consents - total ${r.sharing.consents_total}, active ${r.sharing.consents_active}`,
        `Document shares - total ${r.sharing.document_shares_total}, active ${r.sharing.document_shares_active}`,
      ]);

      section("Signature ledger integrity", [
        `Sealed entries: ${r.ledger.entries}`,
        `Chain integrity: ${r.ledger.integrity.status.toUpperCase()}${r.ledger.integrity.first_break_entry_id ? ` (break at ${r.ledger.integrity.first_break_entry_id})` : ""}`,
      ]);

      section("Predictive alerts", [
        `Total predictive alerts issued: ${r.predictive_alerts.total}`,
        ...Object.entries(r.predictive_alerts.by_type).map(([k, v]) => `  - ${k}: ${v}`),
      ]);

      const recent = (r.audit_log ?? []).slice(0, 25);
      if (recent.length) {
        section("Recent inter-org activity (last 25)", recent.map((e: any) =>
          `${format(new Date(e.occurred_at), "yyyy-MM-dd HH:mm")}  ${e.event_type}  (${e.resource_type ?? "-"})`
        ));
      }

      doc.save(`compliance-${r.organization.slug}-${Date.now()}.pdf`);
      toast.success("PDF downloaded");
    } catch (e: any) { toast.error(e.message); }
    setLoading(null);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="rounded-xl">
          <Download className="w-4 h-4 mr-1" /> Compliance report
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 rounded-2xl p-2">
        <Button variant="ghost" onClick={exportPdf} disabled={!!loading} className="w-full justify-start rounded-xl">
          {loading === "pdf" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />} Download PDF
        </Button>
        <Button variant="ghost" onClick={exportCsv} disabled={!!loading} className="w-full justify-start rounded-xl">
          {loading === "csv" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />} Download CSV
        </Button>
      </PopoverContent>
    </Popover>
  );
}