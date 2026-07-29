import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Lock, ScrollText, Users, Server, KeyRound, FileCheck, ArrowLeft, Clock, Fingerprint, GitBranch, DatabaseBackup, LifeBuoy } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const pillars = [
  {
    icon: Fingerprint, title: "Cryptographic memo sealing",
    body: "Every internal memo can be sealed with a per-user digital signature. The seal produces a SHA-256 content hash and signature hash, then chains into an append-only ledger - each new entry hashes together the previous chain hash so tampering with any prior record breaks the chain and is detectable on verify.",
    chips: ["SHA-256", "Append-only", "Chain integrity check"],
  },
  {
    icon: Lock, title: "Tenant isolation (RLS)",
    body: "Every organization's data is protected by row-level security enforced at the database layer, not in the app. Reads and writes are scoped to the caller's organization by policy; a live isolation probe reports zero cross-tenant visibility from a signed-in session.",
    chips: ["Postgres RLS", "Signed-in scope only", "Live probe"],
  },
  {
    icon: Users, title: "Consent-based inter-org sharing",
    body: "Cross-organization visibility is opt-in per resource. Owners and executives can share a specific KPI, insight, or document with a partner organization and revoke it at any time - access is enforced by RLS, so revocation propagates immediately.",
    chips: ["Explicit grants", "Per-resource", "Instant revoke"],
  },
  {
    icon: Clock, title: "Retention & right-to-be-forgotten",
    body: "Owners configure a retention window per organization. A daily purge job removes activity logs, notifications, and messages older than the window. Compliance settings support GDPR/NDPR toggles and MFA enforcement.",
    chips: ["Daily purge", "GDPR/NDPR", "Owner-configurable"],
  },
  {
    icon: ScrollText, title: "Auditability",
    body: "Every inter-org action - consent granted, consent revoked, memo sealed, document shared - is captured in an append-only audit log visible to both parties of the event. Owners can export a compliance snapshot as PDF or CSV on demand.",
    chips: ["Append-only", "Both-party visibility", "Exportable"],
  },
  {
    icon: KeyRound, title: "Authentication",
    body: "Sign-in is powered by a managed auth layer with hashed credentials, optional social sign-in, and token rotation. Roles are stored in a dedicated user_roles table with a security-definer helper - role checks never touch user-writable columns.",
    chips: ["Managed auth", "Rotated tokens", "Non-recursive roles"],
  },
  {
    icon: Server, title: "Platform & hosting",
    body: "Global Office runs on managed cloud infrastructure with encryption in transit (TLS 1.2+) and at rest. Object storage uses signed, time-limited URLs; private buckets never expose direct file listings.",
    chips: ["TLS 1.2+", "At-rest encryption", "Signed URLs"],
  },
  {
    icon: GitBranch, title: "Change control",
    body: "Schema changes ship as reviewable migrations. Row-level security policies are applied in the same migration as the table they protect; a linter runs on every deploy to flag missing policies or unsafe grants.",
    chips: ["Reviewable migrations", "Policy linter", "Least-privilege grants"],
  },
  {
    icon: DatabaseBackup, title: "Backups & disaster recovery",
    body: "The database runs on managed infrastructure with continuous point-in-time recovery and redundant storage. Our operating targets are a recovery point objective under 15 minutes and a recovery time objective under one hour, validated by periodic restore drills.",
    chips: ["Point-in-time recovery", "RPO < 15 min", "RTO < 1 hr"],
  },
  {
    icon: LifeBuoy, title: "Continuity & exit rights",
    body: "Customers can export documents, tasks, KPIs, memos, and audit logs in open formats at any time. Global Office commits contractually to data portability and a wind-down notice period, so no organization is ever locked in or left stranded if commercial circumstances change.",
    chips: ["Open-format export", "Portability commitment", "Wind-down notice"],
  },
];

export default function TrustCenter() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs text-accent mb-4">
              <Shield className="w-3.5 h-3.5" /> Trust Center
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Security, privacy & compliance at Global Office
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              This page is maintained by Global Office to answer the questions security, privacy, and procurement teams
              ask before adopting our organizational intelligence layer. It describes the controls that are
              <span className="text-foreground font-medium"> actually implemented in the product today</span> -
              not aspirations. It is not an independent certification.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 mt-10">
            {pillars.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                className="glass-card-strong rounded-2xl p-6 border border-border">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
                  <p.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{p.body}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.chips.map(c => (
                    <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{c}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="mt-10 rounded-2xl border border-border p-6 glass-card">
            <div className="flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-accent mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-foreground">Shared responsibility</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Global Office provides the platform controls described above. Each customer organization is
                  responsible for configuring retention, MFA enforcement, role assignments, sharing consents,
                  and any regulatory workflows specific to their industry - including who receives single-use access
                  tokens for joining the organization. Owners can generate an on-demand Compliance Report from the
                  Security module summarizing their current posture.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="mt-8 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>Security contact: security@globaloffice.cloud</span>
            <span>-</span>
            <span>Vulnerability disclosure: security@globaloffice.cloud</span>
            <span>-</span>
            <Link to="/investors" className="text-accent hover:underline">Enterprise &amp; investors</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}