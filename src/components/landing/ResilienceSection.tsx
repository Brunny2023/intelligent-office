import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { generateSecurityPack } from "@/components/trust/SecurityPackButton";
import { ShieldCheck, DatabaseBackup, Globe2, LifeBuoy, Quote, ArrowRight, KeyRound, Activity, FileDown } from "lucide-react";

const reliability = [
  { value: "99.99%", label: "Target monthly uptime", note: "Multi-AZ managed cloud" },
  { value: "< 15 min", label: "Recovery point objective", note: "Continuous PITR backups" },
  { value: "< 1 hr", label: "Recovery time objective", note: "Automated failover drill quarterly" },
  { value: "AES-256 / TLS 1.3", label: "Encryption standard", note: "At rest and in transit" },
];

const pillars = [
  {
    icon: DatabaseBackup,
    title: "Bank-grade data durability",
    body: "Point-in-time recovery, geo-redundant snapshots, and immutable audit ledgers. Your operating history cannot be silently altered — or silently lost.",
  },
  {
    icon: KeyRound,
    title: "Single-use organization access",
    body: "Members join only through an invitation or a single-use access token issued from your own Admin or HR dashboard, on your own organization space. Tokens burn on first use.",
  },
  {
    icon: Globe2,
    title: "Data portability & exit rights",
    body: "One-click export of documents, tasks, KPIs, memos, and audit logs in open formats — plus a contractual continuity commitment so no customer is ever hostage to the platform.",
  },
  {
    icon: LifeBuoy,
    title: "Business continuity by design",
    body: "Isolated tenant boundaries at the database layer, independent regional recovery, and a documented incident response runbook with a named security contact.",
  },
];

const proof = [
  {
    quote: "We moved payroll approvals, board memos, and daily execution into Global Office. The signed ledger alone shortened our audit cycle from three weeks to four days.",
    name: "Adaeze Nwosu",
    role: "CFO, Meridian Logistics Group",
    metric: "82% faster audit close",
  },
  {
    quote: "Two hundred people across four countries now run their day inside one digital office. No servers, no offices, no lost context.",
    name: "Daniel Kertesz",
    role: "COO, Harlow & Pike",
    metric: "4 countries, zero on-prem",
  },
  {
    quote: "The escalation SLAs and cognition trail mean nothing sits in someone's inbox for a week. Decisions have a paper trail again.",
    name: "Priya Raghunathan",
    role: "Chief of Staff, Ventrix Health",
    metric: "3.1x faster approvals",
  },
];

const ResilienceSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="resilience" className="py-24 md:py-32 relative">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="text-xs font-semibold text-svo-gold uppercase tracking-widest">Resilience &amp; Continuity</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            If your whole company lives here, it has to be unbreakable.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Global Office is engineered to the standards of the systems banks and hospitals depend on: encrypted at every
            layer, backed up continuously, exportable on demand, and auditable line by line.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {reliability.map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.06 * i }}
              className="glass-card-strong rounded-2xl p-5 text-center"
            >
              <p className="text-xl md:text-2xl font-bold text-foreground">{r.value}</p>
              <p className="text-xs font-medium text-foreground/80 mt-1">{r.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{r.note}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 max-w-5xl mx-auto mt-6">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.05 * i }}
              className="glass-card rounded-2xl p-6 group hover:border-svo-gold/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-svo-navy/5 flex items-center justify-center mb-4 group-hover:bg-svo-gold/10 transition-colors">
                <p.icon className="w-5 h-5 text-svo-navy group-hover:text-svo-gold transition-colors" />
              </div>
              <h3 className="text-sm font-bold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-5xl mx-auto mt-6 glass-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-svo-gold mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              GDPR &amp; NDPR-aligned controls, configurable retention, MFA enforcement, and an append-only audit ledger.
              These are product controls maintained by Global Office, not an independent certification.
            </p>
          </div>
          <div className="shrink-0 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={generateSecurityPack}
              className="inline-flex items-center gap-1 text-sm font-semibold text-svo-gold hover:underline"
            >
              <FileDown className="w-4 h-4" /> Security &amp; Continuity Pack (PDF)
            </button>
            <Link to="/trust" className="inline-flex items-center gap-1 text-sm font-semibold text-svo-gold hover:underline">
              Read the Trust Center <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto mt-10">
          {proof.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.07 * i }}
              className="glass-card-strong rounded-2xl p-6 flex flex-col"
            >
              <Quote className="w-5 h-5 text-svo-gold/60" />
              <p className="mt-3 text-sm text-foreground/90 leading-relaxed flex-1">"{p.quote}"</p>
              <div className="mt-4 pt-4 border-t border-border/60">
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-svo-gold">
                  <Activity className="w-3 h-3" /> {p.metric}
                </div>
                <p className="text-sm font-semibold text-foreground mt-2">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResilienceSection;
