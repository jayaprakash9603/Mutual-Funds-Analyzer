import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReportSectionState } from '../../hooks/useReportSection'

type ReportGroupBoundaryProps<T> = {
  state: ReportSectionState<T>
  skeleton: ReactNode
  children: (data: T) => ReactNode
}

export function ReportGroupBoundary<T>({ state, skeleton, children }: ReportGroupBoundaryProps<T>) {
  const { data, loading, error, refreshing, retry } = state

  if (loading && !data) {
    return <>{skeleton}</>
  }

  if (error && !data) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
        <p>{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={retry}>
          Retry
        </Button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className={refreshing ? 'opacity-70 transition-opacity' : undefined}>
      {children(data)}
    </div>
  )
}

export function MetricGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-lg" />
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
  return <Skeleton className="h-[320px] w-full rounded-xl sm:h-[380px] lg:h-[420px]" />
}

export function CardSkeleton() {
  return <Skeleton className="h-48 w-full rounded-xl" />
}
