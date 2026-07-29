import LegalLayout from "./LegalLayout";

export default function DPA() {
  return (
    <LegalLayout title="Data Processing Addendum" updated="July 29, 2026">
      <p>
        This Data Processing Addendum ("DPA") forms part of the Terms of Service between Soteria AI
        Technologies Inc. ("Processor") and the Customer ("Controller") for use of the Global Office
        platform ("Service"). It applies where Processor processes Personal Data on behalf of Controller
        under the GDPR, UK GDPR, NDPR, and comparable data-protection laws.
      </p>

      <h2>1. Roles</h2>
      <p>
        Controller determines the purposes and means of processing Personal Data. Processor processes
        Personal Data only on documented instructions from Controller, which include the Terms of
        Service, this DPA, and Controller's configuration of the Service.
      </p>

      <h2>2. Scope and Purpose</h2>
      <ul>
        <li><strong>Subject matter:</strong> provision of the Service.</li>
        <li><strong>Duration:</strong> the term of the subscription plus retention periods.</li>
        <li><strong>Nature and purpose:</strong> hosting, processing, transmitting, and analyzing Customer Data to deliver the Service.</li>
        <li><strong>Data subjects:</strong> Controller's employees, contractors, and authorized users.</li>
        <li><strong>Categories of data:</strong> identifiers, contact data, workspace content, usage metadata.</li>
      </ul>

      <h2>3. Processor Obligations</h2>
      <ul>
        <li>Process Personal Data only on Controller's documented instructions.</li>
        <li>Ensure personnel authorized to process Personal Data are under confidentiality obligations.</li>
        <li>Implement the technical and organizational measures listed in Annex A.</li>
        <li>Assist Controller with data-subject requests, DPIAs, and regulator inquiries.</li>
        <li>Notify Controller of Personal Data breaches without undue delay after becoming aware.</li>
      </ul>

      <h2>4. Subprocessors</h2>
      <p>
        Controller authorizes Processor to engage the subprocessors listed at
        <a href="/legal/subprocessors"> globaloffice.cloud/legal/subprocessors</a>. Processor will notify
        Controller of intended changes and Controller may object on reasonable grounds.
      </p>

      <h2>5. International Transfers</h2>
      <p>
        Where transfers occur outside the EEA/UK/Nigeria, the parties rely on the Standard Contractual
        Clauses (Module 2, Controller-to-Processor) and equivalent safeguards.
      </p>

      <h2>6. Data-Subject Requests</h2>
      <p>
        The Service provides self-serve export and deletion controls that allow Controller to fulfill
        access, rectification, erasure, restriction, and portability requests without Processor
        intervention. Processor will assist where the Service alone is insufficient.
      </p>

      <h2>7. Return and Deletion</h2>
      <p>
        On termination, Processor will make Customer Data available for export for 30 days and will
        delete it afterwards, except where retention is required by law.
      </p>

      <h2>8. Audits</h2>
      <p>
        Processor will make available information necessary to demonstrate compliance and will allow
        audits, including inspections, once per year on reasonable notice, subject to confidentiality.
      </p>

      <h2>Annex A — Technical and Organizational Measures</h2>
      <ul>
        <li>TLS 1.2+ in transit; AES-256 at rest.</li>
        <li>Postgres row-level security enforcing per-tenant isolation.</li>
        <li>Least-privilege database grants; policy linter on every deploy.</li>
        <li>Signed, time-limited URLs for private object storage.</li>
        <li>MFA available; SSO on request.</li>
        <li>Append-only audit log of inter-org actions; cryptographic signature ledger for sealed memos.</li>
        <li>Reviewable migrations; change-managed release process.</li>
        <li>Documented incident-response process; breach notification without undue delay.</li>
      </ul>

      <p>
        To sign this DPA, contact <a href="mailto:legal@globaloffice.cloud">legal@globaloffice.cloud</a>.
      </p>
    </LegalLayout>
  );
}