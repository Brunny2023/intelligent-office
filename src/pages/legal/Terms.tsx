import LegalLayout from "./LegalLayout";

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service" updated="July 29, 2026">
      <p>
        These Terms of Service ("Terms") govern your access to and use of the Intelligent Office platform
        ("Service") provided by the Intelligent Office showcase project, a Delaware corporation ("the original product team", "we",
        "our"). By creating an account, accessing, or using the Service you agree to these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        Intelligent Office is a multi-tenant organizational intelligence platform. Access is provided on a
        subscription basis to the organization that registers the workspace ("Customer"). Individual
        users are authorized under the Customer's account.
      </p>

      <h2>2. Accounts and Eligibility</h2>
      <ul>
        <li>You must be at least 18 years old and legally able to enter into contracts.</li>
        <li>You are responsible for all activity under your account and for keeping credentials secure.</li>
        <li>Owners are responsible for the actions of users they invite into their organization.</li>
      </ul>

      <h2>3. Customer Data</h2>
      <p>
        Customer retains all rights to data submitted to the Service ("Customer Data"). the original product team processes
        Customer Data solely to provide, secure, and improve the Service, as described in our Privacy
        Policy and Data Processing Addendum.
      </p>

      <h2>4. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Reverse engineer, resell, or sublicense the Service without written consent.</li>
        <li>Upload unlawful, infringing, malicious, or harmful content.</li>
        <li>Attempt to access another tenant's data or circumvent security controls.</li>
        <li>Use the Service to build a competing product.</li>
      </ul>

      <h2>5. AI Features</h2>
      <p>
        The Service includes AI-assisted features (insights, summaries, predictive alerts, copilots).
        AI output is advisory and may contain errors. Customer is responsible for reviewing AI output
        before acting on it. the original product team does not use Customer Data to train foundation models.
      </p>

      <h2>6. Fees</h2>
      <p>
        Paid plans are billed in advance. Fees are non-refundable except as required by law. the original product team may
        change pricing with 30 days' notice for the next renewal term.
      </p>

      <h2>7. Confidentiality</h2>
      <p>
        Each party will protect the other's confidential information with the same care it uses for its
        own, and never less than reasonable care.
      </p>

      <h2>8. Warranties and Disclaimers</h2>
      <p>
        The Service is provided "as is". the original product team disclaims all implied warranties to the maximum extent
        permitted by law, including merchantability, fitness for a particular purpose, and non-infringement.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, neither party will be liable for indirect, incidental,
        special, or consequential damages. the original product team's aggregate liability under these Terms will not exceed
        the fees paid by Customer in the twelve months preceding the claim.
      </p>

      <h2>10. Term and Termination</h2>
      <p>
        Either party may terminate for material breach not cured within 30 days of written notice. On
        termination, Customer may export data for 30 days, after which it will be deleted per our
        retention policy.
      </p>

      <h2>11. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict
        of law rules. Disputes will be resolved in the state or federal courts located in Delaware.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these Terms: <a href="mailto:legal@intelligent-office.example">legal@intelligent-office.example</a>.
      </p>
    </LegalLayout>
  );
}