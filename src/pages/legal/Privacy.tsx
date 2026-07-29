import LegalLayout from "./LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" updated="July 29, 2026">
      <p>
        This Privacy Policy explains how Soteria AI Technologies Inc. ("Soteria", "we") collects, uses,
        and protects personal information when you use the Global Office platform ("Service").
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email, organization, role.</li>
        <li><strong>Workspace data:</strong> tasks, documents, messages, meetings, KPIs and other content you or your organization submit.</li>
        <li><strong>Usage data:</strong> logs, device information, IP address, timestamps for security and product analytics.</li>
        <li><strong>Cookies:</strong> session cookies for authentication and preference cookies for UI state.</li>
      </ul>

      <h2>2. How We Use Information</h2>
      <ul>
        <li>Provide, secure, and improve the Service.</li>
        <li>Authenticate users and enforce tenant isolation.</li>
        <li>Generate AI insights within the requesting organization only.</li>
        <li>Communicate service updates, security alerts, and support responses.</li>
        <li>Comply with legal obligations.</li>
      </ul>

      <h2>3. Legal Bases (GDPR / NDPR)</h2>
      <p>
        We process personal data on the basis of contract performance, legitimate interests (security,
        fraud prevention, product improvement), consent (where required), and legal obligation.
      </p>

      <h2>4. Sharing</h2>
      <p>
        We do not sell personal data. We share data only with:
      </p>
      <ul>
        <li>Subprocessors that operate the Service (see <a href="/legal/subprocessors">Subprocessors</a>).</li>
        <li>Other members of your organization, per role and consent settings.</li>
        <li>Partner organizations, only when your organization explicitly grants a share consent.</li>
        <li>Authorities, when required by law.</li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>
        Owners configure the retention window per organization. A daily job purges activity logs,
        notifications, and messages older than that window. Account data is retained for the life of
        the account and 30 days after termination.
      </p>

      <h2>6. Your Rights</h2>
      <p>
        Subject to applicable law you may access, correct, export, restrict, or delete your personal
        data, and withdraw consent. Contact <a href="mailto:privacy@globaloffice.cloud">privacy@globaloffice.cloud</a>.
      </p>

      <h2>7. Security</h2>
      <p>
        The Service uses TLS 1.2+ in transit, encryption at rest, row-level security for tenant isolation,
        signed URLs for private storage, optional MFA, and an append-only audit log.
      </p>

      <h2>8. International Transfers</h2>
      <p>
        Data may be processed in the United States and other jurisdictions where our subprocessors operate.
        We rely on Standard Contractual Clauses and equivalent safeguards for cross-border transfers.
      </p>

      <h2>9. Children</h2>
      <p>The Service is not directed to children under 16.</p>

      <h2>10. Changes</h2>
      <p>We will notify Customers of material changes by email or in-app notice.</p>

      <h2>11. Contact</h2>
      <p>
        Data Protection Officer: <a href="mailto:privacy@globaloffice.cloud">privacy@globaloffice.cloud</a>.
      </p>
    </LegalLayout>
  );
}