import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { appMetricGrid } from '@/lib/ui/appCardStyles'
import type { ReportSectionState } from '../../hooks/useReportSection'

type ReportGroupBoundaryProps<T> = {
  state: ReportSectionState<T>
  skeleton: ReactNode
  children: (data: T) => ReactNode
}

export function ReportGroupBoundary<T>({ state, skeleton, children }: ReportGroupBoundaryProps<T>) {
  const { data, error, refreshing, retry } = state

  if (error && !data) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs sm:p-4 sm:text-sm">
        <p>{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={retry}>
          Retry
        </Button>
      </div>
    )
  }

  if (!data) {
    return <>{skeleton}</>
  }

  return (
    <div className={refreshing ? 'opacity-70 transition-opacity' : undefined}>
      {children(data)}
    </div>
  )
}

export function MetricGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={appMetricGrid}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-[4.5rem] w-full rounded-lg sm:h-24 sm:rounded-xl" />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full rounded-lg" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return <Skeleton className="h-[280px] w-full rounded-lg sm:h-[380px] sm:rounded-xl lg:h-[420px]" />
}

export function CardSkeleton() {
  return <Skeleton className="h-40 w-full rounded-lg sm:h-48 sm:rounded-xl" />
}
