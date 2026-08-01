import { Link } from 'react-router-dom'
import { LegalDocument, LegalSection } from '@/components/legal/LegalDocument'
import { SITE } from '@/lib/site'

export function TermsPage() {
  return (
    <LegalDocument
      title="Terms of use"
      updated="1 August 2026"
      summary={`By using ${SITE.name} you agree to these terms and the accompanying disclaimer.`}
    >
      <LegalSection title="Acceptance">
        <p>
          Accessing or using {SITE.name} (including demo builds) means you accept these Terms, the{' '}
          <Link to="/disclaimer">Disclaimer</Link>, and the <Link to="/privacy">Privacy policy</Link>
          . If you do not agree, do not use the service.
        </p>
      </LegalSection>

      <LegalSection title="License to use">
        <p>
          You receive a limited, non-exclusive, non-transferable license to use the interface for
          personal or internal professional research. You may not scrape at abusive rates, reverse
          engineer with intent to misrepresent the product, or republish the service as your own
          regulated advice platform.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <ul>
          <li>Do not use outputs as sole basis for client recommendations without independent verification.</li>
          <li>Do not present Analyzer scores as SEBI, AMFI, or AMC endorsements.</li>
          <li>Do not attempt to disrupt hosting, inject malware, or probe systems beyond normal use.</li>
          <li>Follow the <Link to="/guidelines">composition guidelines</Link> when publishing excerpts.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          Product branding, UI, methodology descriptions, and original copy belong to their respective
          owners. Third-party data remains subject to upstream licenses. Scheme names and trademarks
          belong to their AMCs.
        </p>
      </LegalSection>

      <LegalSection title="Demo deployments">
        <p>
          Demo mode is provided for exploration. Operators may rate-limit, modify, or withdraw a
          public demo at any time. Demo data is not a live feed.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer of warranties &amp; liability">
        <p>
          The service is provided without warranty. To the maximum extent permitted by applicable law,
          operators are not liable for indirect, incidental, or consequential damages, or for
          investment losses linked to use of the site. See the full{' '}
          <Link to="/disclaimer">Disclaimer</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Governing considerations">
        <p>
          These terms are intended for users in India researching Indian mutual funds. Mandatory
          consumer protections under applicable law remain unaffected where they cannot be waived.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          Terms may be updated periodically. Continued use after publication of changes constitutes
          acceptance of the revised terms.
        </p>
      </LegalSection>
    </LegalDocument>
  )
}
