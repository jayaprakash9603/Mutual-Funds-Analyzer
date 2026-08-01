import { LegalDocument, LegalSection } from '@/components/legal/LegalDocument'
import { SITE } from '@/lib/site'

export function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy policy"
      updated="1 August 2026"
      summary={`How ${SITE.name} handles information when you use the product, including static demo hosting.`}
    >
      <LegalSection title="Overview">
        <p>
          We design {SITE.name} to keep personal data collection minimal. This policy explains what
          may be processed when you browse the app, use a self-hosted live stack, or visit a public
          demo.
        </p>
      </LegalSection>

      <LegalSection title="Information we may process">
        <ul>
          <li>
            <strong>Usage data (hosting / CDN):</strong> standard server or analytics logs such as IP
            address, user agent, referrer, and pages requested, if your host enables them.
          </li>
          <li>
            <strong>Local preferences:</strong> theme and similar UI choices may be stored in your
            browser (e.g. localStorage).
          </li>
          <li>
            <strong>Self-hosted live mode:</strong> when you run the full stack, fund search history
            or analysis records may persist in your own database according to your deployment — not
            on a third-party “Analyzer cloud” by default.
          </li>
          <li>
            <strong>Demo mode:</strong> the static demo primarily serves fixtures from the site. It
            does not require an account.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Cookies and similar technologies">
        <p>
          Essential preferences may use local storage. If a hosting provider or optional analytics
          tool sets cookies, their policies apply. We do not sell personal information.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          Fonts, CDNs, or chart libraries loaded from third parties may receive technical request
          data under their own privacy terms. Market data used in live mode comes from upstream APIs
          you configure; those providers’ terms also apply.
        </p>
      </LegalSection>

      <LegalSection title="Retention">
        <p>
          Browser-local data remains until you clear it. Self-hosted database retention is controlled
          by the operator of that deployment. Hosting logs follow the host’s retention settings.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can clear site data in your browser, disable optional scripts at the network layer, or
          run a fully local deployment. For privacy questions about a specific hosted demo, contact
          the operator who published that URL.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          The service is intended for adults researching financial products. It is not directed at
          children under 18.
        </p>
      </LegalSection>

      <LegalSection title="Updates">
        <p>
          We may revise this policy as the product evolves. The “Last updated” date at the top of
          this page will change when material updates are published.
        </p>
      </LegalSection>
    </LegalDocument>
  )
}
