import type { ReactNode } from 'react'
import { appPanelHeader, appPanelSurface } from '@/lib/ui/appCardStyles'
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
    <article className={cn(appPanelSurface, className)}>
      <header className={appPanelHeader}>
        <h3 className="text-sm font-semibold leading-snug text-foreground sm:text-base md:text-lg">{title}</h3>
        {subtitle ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{subtitle}</p>
        ) : null}
      </header>

      <div className="space-y-2 px-3 py-3 sm:space-y-3 sm:px-5 sm:py-4 md:space-y-4 md:py-5">
        {callout}
        {children}
        {footer ? (
          <footer className="text-center text-[10px] leading-relaxed text-muted-foreground sm:text-xs">
            {footer}
          </footer>
        ) : null}
      </div>
    </article>
  )
}
