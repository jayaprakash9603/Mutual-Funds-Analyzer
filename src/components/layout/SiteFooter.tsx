import { useLayoutEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LEGAL_ROUTES, SITE } from '@/lib/site'
import { isDemoBuild } from '@/demo/config/demoMode'
import { cn } from '@/lib/utils'

const FOOTER_OFFSET_VAR = '--landing-footer-offset'

const footerLinks = [
  { to: LEGAL_ROUTES.disclaimer, label: 'Disclaimer' },
  { to: LEGAL_ROUTES.privacy, label: 'Privacy' },
  { to: LEGAL_ROUTES.terms, label: 'Terms' },
  { to: LEGAL_ROUTES.sources, label: 'Sources' },
  { to: LEGAL_ROUTES.guidelines, label: 'Guidelines' },
  { to: '/method', label: 'Method' },
] as const

/** Compact on home so the hero keeps breathing room; fuller elsewhere. */
export function SiteFooter() {
  const { pathname } = useLocation()
  const compact = pathname === '/'
  const demo = isDemoBuild()
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const sync = () => {
      if (!compact) {
        document.documentElement.style.setProperty(FOOTER_OFFSET_VAR, '0px')
        return
      }
      document.documentElement.style.setProperty(FOOTER_OFFSET_VAR, `${el.offsetHeight}px`)
    }

    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => {
      observer.disconnect()
      document.documentElement.style.setProperty(FOOTER_OFFSET_VAR, '0px')
    }
  }, [compact])

  if (compact) {
    return (
      <footer
        ref={ref}
        className="shrink-0 border-t border-border/60 bg-background/90 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-2.5 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8 lg:py-3.5">
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-xs text-muted-foreground sm:text-[13px]">
              <span className="font-medium text-foreground/90">{SITE.name}</span>
              <span className="mx-1.5 text-border">·</span>
              Mutual fund investments are subject to market risks.
              {' '}
              <Link to="/disclaimer" className="underline-offset-2 hover:underline">
                Not investment advice
              </Link>
              {demo ? (
                <>
                  <span className="mx-1.5 text-border">·</span>
                  <span>Demo sample data</span>
                </>
              ) : null}
            </p>
          </div>

          <nav
            aria-label="Legal and policy"
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
          >
            {footerLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    )
  }

  return (
    <footer ref={ref} className="mt-auto shrink-0 border-t border-border/70 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-8">
          <div className="max-w-xl space-y-1.5">
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

        <div
          className={cn(
            'mt-5 flex flex-col gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground',
            'sm:flex-row sm:items-center sm:justify-between',
          )}
        >
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
