import LegalLayout from "./LegalLayout";

const rows = [
  { name: "Supabase, Inc.", purpose: "Managed Postgres, authentication, object storage, edge functions", location: "United States / EU" },
  { name: "Cloudflare, Inc.", purpose: "DNS, CDN, DDoS protection, TLS termination", location: "Global edge" },
  { name: "LiveKit Cloud", purpose: "Real-time audio/video conferencing and recording egress", location: "Global edge" },
  { name: "OpenAI, L.L.C.", purpose: "AI model inference for insights, summaries, and copilot features", location: "United States" },
  { name: "Resend / Email provider", purpose: "Transactional and authentication email delivery", location: "United States / EU" },
  { name: "Lovable Cloud", purpose: "Application hosting and deployment platform", location: "Global edge" },
];

export default function Subprocessors() {
  return (
    <LegalLayout title="Subprocessors" updated="July 29, 2026">
      <p>
        Soteria AI Technologies Inc. engages the following subprocessors to deliver the Global Office
        Service. We update this list before onboarding new subprocessors and notify Customers of material
        changes.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold text-foreground">Subprocessor</th>
              <th className="px-4 py-3 font-semibold text-foreground">Purpose</th>
              <th className="px-4 py-3 font-semibold text-foreground">Location</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-border">
                <td className="px-4 py-3 text-foreground font-medium">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.purpose}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Notifications</h2>
      <p>
        To subscribe to subprocessor change notifications, email
        <a href="mailto:legal@globaloffice.cloud"> legal@globaloffice.cloud</a>.
      </p>
    </LegalLayout>
  );
}