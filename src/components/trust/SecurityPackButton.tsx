import { useState } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Section = { heading: string; lines: string[] };

const SECTIONS: Section[] = [
  {
    heading: "1. Scope & purpose",
    lines: [
      "This Security & Continuity Pack summarises the controls Global Office operates for its Intelligent",
      "Digital Office platform. It is maintained by Global Office (Soteria AI Technologies) for enterprise",
      "buyers, procurement and investors. It is a statement of implemented controls and operating targets -",
      "it is not an independent audit report or certification.",
    ],
  },
  {
    heading: "2. Encryption",
    lines: [
      "In transit: TLS 1.2+ (TLS 1.3 preferred) for all client, API and edge-function traffic.",
      "At rest: AES-256 encryption for the primary Postgres database, backups and object storage.",
      "Object storage: private buckets only; access via signed, time-limited URLs. No directory listing.",
      "Secrets: platform secrets are held in an encrypted vault and are never exposed to the browser.",
      "Document integrity: memos can be sealed with SHA-256 content and signature hashes chained into",
      "an append-only ledger, so tampering with any prior record is detectable on verification.",
    ],
  },
  {
    heading: "3. Tenant isolation & access control",
    lines: [
      "Row-level security is enforced at the database layer, not in application code. Reads and writes are",
      "scoped to the caller's organization by policy.",
      "Roles are stored in a dedicated user_roles table checked through a security-definer function, so role",
      "checks never depend on user-writable columns.",
      "Organization entry is controlled by single-use access tokens issued by owners, executives or HR",
      "managers. Tokens are role-scoped, expiry-bound (1-720 hours) and burned on first use.",
      "Join attempts are rate limited (15-minute lockout after 10 failed device attempts or 5 failed attempts",
      "against a single code) and every generation, revocation, verification, redemption and failure is",
      "written to an exportable audit trail with automatic alerting to owners and executives.",
    ],
  },
  {
    heading: "4. Backups & disaster recovery",
    lines: [
      "Managed Postgres with continuous point-in-time recovery and redundant, geographically distributed",
      "storage.",
      "Recovery point objective (RPO): under 15 minutes.",
      "Recovery time objective (RTO): under 1 hour.",
      "Object storage is replicated; recording and document buckets are covered by the same retention rules.",
    ],
  },
  {
    heading: "5. Restoration drills",
    lines: [
      "Restore drills are performed on a scheduled basis against a non-production environment: a point-in-time",
      "snapshot is restored, schema and row counts are reconciled, and RLS policies are re-verified with a",
      "cross-tenant isolation probe before the drill is signed off.",
      "Drill outcomes, duration and any corrective actions are recorded and available to enterprise customers",
      "under NDA on request.",
    ],
  },
  {
    heading: "6. Availability & incident response",
    lines: [
      "Operating availability target: 99.99% monthly for the core platform.",
      "A public status page reports live service health, incident history and monthly reliability statistics.",
      "Security and availability incidents are triaged on detection; affected customers are notified with an",
      "initial assessment and a written post-incident summary once resolved.",
      "Security contact and vulnerability disclosure: security@globaloffice.cloud.",
    ],
  },
  {
    heading: "7. Data retention, portability & exit",
    lines: [
      "Owners configure a retention window per organization; a daily purge removes activity logs, notifications",
      "and messages older than the window.",
      "GDPR/NDPR workflows, deletion requests and MFA enforcement are configurable per organization.",
      "Customers can export documents, tasks, KPIs, memos and audit logs in open formats at any time.",
      "Global Office commits contractually to data portability and a wind-down notice period.",
    ],
  },
  {
    heading: "8. Insurance & corporate resilience",
    lines: [
      "Global Office maintains, or is in the process of binding as part of its enterprise readiness programme:",
      "  - Cyber liability and data-breach response cover.",
      "  - Technology errors & omissions (professional indemnity) cover.",
      "  - General commercial liability cover.",
      "Source-code and infrastructure-configuration escrow is offered to enterprise customers so that platform",
      "continuity does not depend on the continued operation of the company.",
      "Certificates of insurance and escrow agreement terms are provided on request during procurement.",
    ],
  },
  {
    heading: "9. Shared responsibility",
    lines: [
      "Global Office provides the platform controls above. Each customer organization is responsible for",
      "configuring retention, MFA enforcement, role assignments, sharing consents, who receives access tokens,",
      "and any regulatory workflows specific to its industry.",
    ],
  },
];

export const generateSecurityPack = () => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  const width = 500;
  let y = 70;

  doc.setFontSize(20).text("Global Office", left, y);
  y += 24;
  doc.setFontSize(15).text("Security & Continuity Pack", left, y);
  y += 20;
  doc.setFontSize(9).text(`Version ${format(new Date(), "yyyy.MM")} · Issued ${format(new Date(), "d MMMM yyyy")}`, left, y);
  y += 14;
  doc.text("Soteria AI Technologies · security@globaloffice.cloud · globaloffice.cloud/trust", left, y);
  y += 26;

  SECTIONS.forEach((s) => {
    if (y > 750) { doc.addPage(); y = 70; }
    doc.setFontSize(11.5).text(s.heading, left, y);
    y += 15;
    doc.setFontSize(9.5);
    s.lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, width) as string[];
      wrapped.forEach((w) => {
        if (y > 790) { doc.addPage(); y = 70; }
        doc.text(w, left, y);
        y += 12.5;
      });
    });
    y += 12;
  });

  if (y > 730) { doc.addPage(); y = 70; }
  doc.setFontSize(8);
  doc.text(
    doc.splitTextToSize(
      "Disclaimer: this document describes controls implemented and operated by Global Office at the date of issue. It is app-owner maintained content, not an independent certification or audit opinion. Enterprise buyers may request supporting evidence under NDA.",
      width
    ) as string[],
    left,
    y
  );

  doc.save(`global-office-security-continuity-pack-${format(new Date(), "yyyy-MM")}.pdf`);
};

const SecurityPackButton = ({ variant = "default", className = "" }: { variant?: "default" | "outline" | "secondary"; className?: string }) => {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant={variant}
      className={`rounded-xl ${className}`}
      disabled={busy}
      onClick={() => {
        setBusy(true);
        try {
          generateSecurityPack();
          toast.success("Security & Continuity Pack downloaded");
        } catch {
          toast.error("Could not generate the pack. Please try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <FileDown className="w-4 h-4 mr-2" />
      {busy ? "Preparing…" : "Download Security & Continuity Pack (PDF)"}
    </Button>
  );
};

export default SecurityPackButton;
