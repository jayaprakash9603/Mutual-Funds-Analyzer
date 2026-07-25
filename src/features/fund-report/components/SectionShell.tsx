import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { explainMetric } from '../lib/metricDictionary'

export function SectionShell({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-36">
      <Card className="glass glass-hover">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
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
}: {
  label: string
  value: string
  hint?: string
  metricKey?: string
  size?: 'md' | 'lg'
}) {
  const isLarge = size === 'lg'
  return (
    <div
      className={
        isLarge
          ? 'rounded-xl border border-border/60 bg-card/50 p-5'
          : 'rounded-lg border border-border/60 bg-card/50 p-4'
      }
    >
      <div
        className={
          isLarge
            ? 'mb-2 flex items-center gap-1 text-sm text-muted-foreground'
            : 'mb-1 flex items-center gap-1 text-xs text-muted-foreground'
        }
      >
        {label}
        {metricKey && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3.5 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>{explainMetric(metricKey)}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className={isLarge ? 'font-mono text-2xl font-semibold tracking-tight' : 'font-mono text-lg font-semibold'}>
        {value}
      </div>
      {hint && (
        <div className={isLarge ? 'mt-2 text-sm text-muted-foreground' : 'mt-1 text-xs text-muted-foreground'}>
          {hint}
        </div>
      )}
    </div>
  )
}

export function UnavailableNotice({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {label} is not available yet for this fund. Connect a metadata provider to enable this section.
    </div>
  )
}
