import type { ReactNode } from 'react'
import { CHART_HEADER_CLASS } from '@/lib/charts/chartSurface'
import { cn } from '@/lib/utils'

type ReportInsightCardProps = {
  title: ReactNode
  subtitle?: ReactNode
  callout?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

export function ReportInsightCard({
  title,
  subtitle,
  callout,
  footer,
  children,
  className,
}: ReportInsightCardProps) {
  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm',
        className,
      )}
    >
      <header className={CHART_HEADER_CLASS}>
        <h3 className="text-base font-semibold leading-snug text-foreground sm:text-lg">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </header>

      <div className="space-y-4 px-4 py-5 sm:px-6">
        {callout}
        {children}
        {footer ? (
          <footer className="text-center text-xs leading-relaxed text-muted-foreground">{footer}</footer>
        ) : null}
      </div>
    </article>
  )
}
