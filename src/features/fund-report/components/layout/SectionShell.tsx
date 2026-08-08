import type { ReactNode, CSSProperties } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppMetricCard } from '@/components/ui/AppMetricCard'
import { useIsSmallScreen } from '@/hooks/useMediaQuery'
import { useReportScrollOffset } from '../../context/ReportScrollContext'

export function SectionShell({
  id,
  title,
  description,
  children,
  variant = 'card',
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
  /** `card` wraps children in one shell; on small screens it becomes `stack` so nested cards are not squeezed. */
  variant?: 'card' | 'stack'
}) {
  const scrollOffset = useReportScrollOffset()
  const isSmall = useIsSmallScreen()
  const scrollStyle: CSSProperties = { scrollMarginTop: scrollOffset }
  // Phone width cannot afford section-card + child-card padding; stack keeps each block its own card.
  const useStack = variant === 'stack' || isSmall

  if (useStack) {
    return (
      <section id={id} style={scrollStyle} className="space-y-3 sm:space-y-4 md:space-y-5">
        <div className="px-0.5">
          <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg md:text-xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </section>
    )
  }

  return (
    <section id={id} style={scrollStyle}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  )
}

export function MetricTile({
  label,
  value,
  hint,
  metricKey,
  size = 'md',
  valueVariant = 'numeric',
}: {
  label: string
  value: string
  hint?: string
  metricKey?: string
  size?: 'sm' | 'md' | 'lg'
  valueVariant?: 'text' | 'numeric'
}) {
  return (
    <AppMetricCard
      label={label}
      value={value}
      hint={hint}
      metricKey={metricKey}
      size={size}
      valueVariant={valueVariant}
    />
  )
}

export function UnavailableNotice({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground sm:p-6 sm:text-sm">
      {label} is not available yet for this fund. Connect a metadata provider to enable this section.
    </div>
  )
}
