import { LegalDocument, LegalSection } from '@/components/legal/LegalDocument'
import { SITE } from '@/lib/site'

export function SourcesPage() {
  return (
    <LegalDocument
      title="Sources & attribution"
      updated="1 August 2026"
      summary={`Where ${SITE.name} obtains market context and how you should credit shared research.`}
    >
      <LegalSection title="Purpose">
        <p>
          Transparent sourcing helps users judge freshness and reliability. Live deployments call
          configured upstream APIs; demo deployments serve previously captured fixtures.
        </p>
      </LegalSection>

      <LegalSection title="Typical data categories">
        <ul>
          <li>
            <strong>Scheme NAVs &amp; metadata:</strong> third-party mutual fund data APIs / snapshots
            used by the back end (when live).
          </li>
          <li>
            <strong>Benchmarks &amp; rolling series:</strong> calculated locally from NAV history or
            retrieved from research endpoints configured in your environment.
          </li>
          <li>
            <strong>Peer context:</strong> peer sets and rolling metrics as implemented in the
            product’s peer comparison path (live) or fixtures (demo).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Demo fixtures">
        <p>
          The public demo may show a limited catalogue of funds with fixed as-of dates. Captured
          responses live under the site’s <code className="rounded bg-muted px-1.5 py-0.5 text-sm">/demo</code>{' '}
          assets and are not continuously refreshed.
        </p>
      </LegalSection>

      <LegalSection title="How to cite">
        <p>When sharing a chart or score externally, include at least:</p>
        <ul>
          <li>Product name: {SITE.name}</li>
          <li>Scheme name and plan/option (as shown)</li>
          <li>Metric name (e.g. 5-year rolling average, COB, Sharpe)</li>
          <li>As-of or report date visible in the UI</li>
          <li>A clear note that the material is educational, not advice</li>
        </ul>
      </LegalSection>

      <LegalSection title="Trademarks">
        <p>
          Fund house names, scheme names, and index names are trademarks of their respective owners.
          Use of those names does not imply affiliation or endorsement.
        </p>
      </LegalSection>
    </LegalDocument>
  )
}
