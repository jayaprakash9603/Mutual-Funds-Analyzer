import { Link } from 'react-router-dom'
import { LegalDocument, LegalSection } from '@/components/legal/LegalDocument'
import { SITE } from '@/lib/site'

export function DisclaimerPage() {
  return (
    <LegalDocument
      title="Disclaimer"
      updated="1 August 2026"
      summary={`${SITE.name} is an educational research tool. Nothing on this site is investment advice, a solicitation, or a recommendation to buy or sell any mutual fund or security.`}
    >
      <LegalSection title="Not investment advice">
        <p>
          Content, scores, charts, comparisons, and commentary on {SITE.name} are provided for
          general information and research education only. They do not constitute investment advice,
          financial planning, tax advice, or a personal recommendation under applicable Indian law.
        </p>
        <p>
          {SITE.name} is <strong>not</strong> a SEBI-registered Investment Adviser, Research Analyst,
          Portfolio Manager, or Mutual Fund Distributor. Decisions to invest remain solely yours (or
          your licensed adviser’s).
        </p>
      </LegalSection>

      <LegalSection title="Market risk and past performance">
        <p>
          Mutual fund investments are subject to market risks. Please read all scheme-related
          documents carefully before investing. Past performance is not indicative of future results.
          Rolling returns, Chance of Beating (COB), Sharpe ratios, drawdowns, SIP illustrations, and
          peer rankings can change with market conditions and data revisions.
        </p>
      </LegalSection>

      <LegalSection title="Demo and sample data">
        <p>
          Public demo deployments may use <strong>captured or sample fixtures</strong> rather than
          live market feeds. Figures shown in demo mode can lag, omit funds, or differ from official
          AMC / RTA / exchange data. Do not rely on demo output for trading, reporting, or client
          advice.
        </p>
      </LegalSection>

      <LegalSection title="Data accuracy">
        <p>
          We aim for careful calculations, but third-party NAV, benchmark, and peer data may contain
          delays, gaps, or errors. Always cross-check critical numbers with primary sources before
          acting. See <Link to="/sources">Sources &amp; attribution</Link> for provider notes.
        </p>
      </LegalSection>

      <LegalSection title="No warranty">
        <p>
          The service is provided “as is” without warranties of any kind, express or implied,
          including fitness for a particular purpose or non-infringement. To the fullest extent
          permitted by law, the operators of {SITE.name} disclaim liability for losses arising from
          use of, or reliance on, the site.
        </p>
      </LegalSection>

      <LegalSection title="Composition and sharing">
        <p>
          If you share screenshots or exports, present them with context, cite the as-of date, and
          avoid implying regulatory endorsement. Follow our{' '}
          <Link to="/guidelines">respectful composition guidelines</Link>.
        </p>
      </LegalSection>
    </LegalDocument>
  )
}
