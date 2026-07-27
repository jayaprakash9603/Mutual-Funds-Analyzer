import type { ReactNode } from 'react'
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
      <header className="border-b border-border/60 px-3 py-3 sm:px-5 sm:py-4">
        <h3 className="text-base font-semibold leading-snug text-foreground sm:text-lg">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
      </header>

      <div className="space-y-3 px-3 py-4 sm:space-y-4 sm:px-5 sm:py-5">
        {callout}
        {children}
        {footer ? (
          <footer className="text-center text-xs leading-relaxed text-muted-foreground">{footer}</footer>
        ) : null}
      </div>
    </article>
  )
}
