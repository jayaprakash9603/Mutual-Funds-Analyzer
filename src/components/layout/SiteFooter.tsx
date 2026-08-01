import { Link } from 'react-router-dom'
import { LEGAL_ROUTES, SITE } from '@/lib/site'
import { isDemoBuild } from '@/demo/config/demoMode'

const footerLinks = [
  { to: LEGAL_ROUTES.disclaimer, label: 'Disclaimer' },
  { to: LEGAL_ROUTES.privacy, label: 'Privacy' },
  { to: LEGAL_ROUTES.terms, label: 'Terms' },
  { to: LEGAL_ROUTES.sources, label: 'Sources' },
  { to: LEGAL_ROUTES.guidelines, label: 'Guidelines' },
  { to: '/method', label: 'Method' },
] as const

export function SiteFooter() {
  const demo = isDemoBuild()

  return (
    <footer className="mt-auto border-t border-border/70 bg-muted/30">
      <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="text-sm font-semibold tracking-tight">{SITE.name}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{SITE.tagline}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Mutual fund investments are subject to market risks. Read all scheme-related documents
              carefully. {SITE.name} is educational research software — not a SEBI-registered adviser
              or a solicitation to invest.
              {demo ? ' This deployment runs in demo mode with sample / captured data.' : null}
            </p>
          </div>

          <nav aria-label="Legal and policy" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {footerLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p>
            <Link to="/disclaimer" className="hover:text-foreground">
              Not investment advice
            </Link>
            {' · '}
            <a href="/robots.txt" className="hover:text-foreground">
              robots.txt
            </a>
            {' · '}
            <a href="/llms.txt" className="hover:text-foreground">
              llms.txt
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
