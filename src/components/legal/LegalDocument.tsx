import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { LEGAL_ROUTES, SITE } from '@/lib/site'
import { cn } from '@/lib/utils'

type LegalDocumentProps = {
  title: string
  updated: string
  summary: string
  children: ReactNode
  className?: string
}

const legalNav = [
  { to: LEGAL_ROUTES.disclaimer, label: 'Disclaimer' },
  { to: LEGAL_ROUTES.privacy, label: 'Privacy' },
  { to: LEGAL_ROUTES.terms, label: 'Terms' },
  { to: LEGAL_ROUTES.sources, label: 'Sources' },
  { to: LEGAL_ROUTES.guidelines, label: 'Guidelines' },
] as const

export function LegalDocument({ title, updated, summary, children, className }: LegalDocumentProps) {
  return (
    <PageContainer width="narrow" className={cn('py-10', className)}>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{SITE.name}</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{summary}</p>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>

      <nav
        className="mt-6 flex flex-wrap gap-2 border-y border-border/70 py-3 text-sm"
        aria-label="Legal pages"
      >
        {legalNav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-md px-2.5 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <article className="prose-legal mt-8 space-y-8 text-[15px] leading-relaxed text-foreground/90">
        {children}
      </article>
    </PageContainer>
  )
}

export function LegalSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-3 text-muted-foreground [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_strong]:font-medium [&_strong]:text-foreground/90 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
}
