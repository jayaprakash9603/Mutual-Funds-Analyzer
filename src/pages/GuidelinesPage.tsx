import { Link } from 'react-router-dom'
import { LegalDocument, LegalSection } from '@/components/legal/LegalDocument'
import { SITE } from '@/lib/site'

export function GuidelinesPage() {
  return (
    <LegalDocument
      title="Respectful composition guidelines"
      updated="1 August 2026"
      summary={`How to present, share, and discuss ${SITE.name} research with composure, accuracy, and respect for investors and the market.`}
    >
      <LegalSection title="Tone and composure">
        <p>
          Financial research influences real decisions. Communicate calmly: no hype, no fear-mongering,
          and no claims of certainty. Prefer precise language (“historically”, “over this window”,
          “versus the selected benchmark”) over absolutes (“best”, “guaranteed”, “can’t lose”).
        </p>
      </LegalSection>

      <LegalSection title="Accuracy when sharing">
        <ul>
          <li>Show the as-of date and the exact metric definitions used in the report.</li>
          <li>Do not crop out risk, drawdown, or disclaimer context from screenshots.</li>
          <li>Label demo / sample data clearly when the deployment is not live.</li>
          <li>Correct errors promptly if you redistributed outdated figures.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Respect for people and institutions">
        <ul>
          <li>Do not disparage fund managers, AMCs, or peers with personal attacks.</li>
          <li>Critique methodology and data, not individuals.</li>
          <li>Avoid implying regulatory approval (SEBI, AMFI, exchanges) for Analyzer scores.</li>
          <li>Be mindful that clients and readers may have different risk capacity and goals.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Composition of meeting materials">
        <p>
          When using exports in client or internal meetings: lead with purpose, state assumptions,
          separate facts from interpretation, and end with open questions — not pressure to act.
          Pair any performance highlight with risk context (volatility, drawdowns, peer dispersion).
        </p>
      </LegalSection>

      <LegalSection title="What not to do">
        <ul>
          <li>Promise returns or timeline outcomes.</li>
          <li>Present a single score as a complete suitability assessment.</li>
          <li>Use Analyzer branding to sell unrelated products without disclosure.</li>
          <li>Harass, spam, or scrape the service in ways that degrade availability for others.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Related notices">
        <p>
          These guidelines complement the <Link to="/disclaimer">Disclaimer</Link>,{' '}
          <Link to="/terms">Terms of use</Link>, and <Link to="/sources">Sources</Link> pages. When in
          doubt, treat the material as educational research and encourage independent verification.
        </p>
      </LegalSection>
    </LegalDocument>
  )
}
