import type { ReactNode } from 'react'
import { Info, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CHART_HEIGHT, CHART_HEIGHT_COMPACT, CHART_HEIGHT_WIDE } from '@/lib/charts/chartAxes'
import { CHART_PANEL_CLASS } from '@/lib/charts/chartSurface'
import { cn } from '@/lib/utils'
import type { ChartGuide } from '@/lib/analytics/chartGuide'

type ChartShellProps = {
  guide: ChartGuide
  children: ReactNode
  loading?: boolean
  empty?: boolean
  footer?: ReactNode
}

function heightClass(guide: ChartGuide) {
  if (guide.compact) return CHART_HEIGHT_COMPACT
  if (guide.wide) return CHART_HEIGHT_WIDE
  return CHART_HEIGHT
}

export function ChartShell({ guide, children, loading, empty, footer }: ChartShellProps) {
  const chartHeight = heightClass(guide)

  return (
    <Card
      className={cn(
        'glass glass-hover flex h-full flex-col overflow-hidden transition-shadow duration-200',
        guide.wide && 'lg:col-span-2',
      )}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-snug sm:text-lg">{guide.title}</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`How to read ${guide.title}`}
                >
                  <Info className="size-4" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs space-y-1.5 p-3 text-left text-xs leading-relaxed">
                <p className="font-semibold text-popover-foreground">How to read this</p>
                <p>{guide.explanation}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-sm leading-relaxed">{guide.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        {loading ? (
          <Skeleton className={cn(chartHeight, 'w-full rounded-lg')} aria-hidden="true" />
        ) : empty ? (
          <p
            className={cn('flex items-center justify-center text-sm text-muted-foreground', chartHeight)}
            role="status"
          >
            No data available for this chart yet.
          </p>
        ) : (
          <>
            <div className={CHART_PANEL_CLASS}>{children}</div>
            {footer}
          </>
        )}
        <div className="mt-auto flex gap-2.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground dark:border-slate-700/50 dark:bg-[var(--chart-surface)]/80">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <p>
            <span className="font-medium text-foreground">Use case: </span>
            {guide.useCase}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function chartHeightForGuide(guide: ChartGuide) {
  return heightClass(guide)
}
