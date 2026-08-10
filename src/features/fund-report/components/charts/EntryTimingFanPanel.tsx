import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFundReportMatrix } from '../../hooks/useFundReportMatrix'
import { ReportInsightCard } from '../layout/ReportInsightCard'
import { EntryTimingFanChart } from './EntryTimingFanChart'

export function EntryTimingFanPanel({
  scheme,
  startDate,
  isSharedView = false,
}: {
  scheme: string
  startDate?: string
  isSharedView?: boolean
}) {
  const enabled = !!scheme && !isSharedView
  const { data: matrix, loading, error, retry } = useFundReportMatrix(
    scheme || null,
    'LUMPSUM',
    enabled,
    startDate,
  )

  if (isSharedView) {
    return (
      <p className="mb-4 text-sm text-muted-foreground">
        Entry-timing fan chart needs the live lumpsum matrix and is not included in shared snapshots.
      </p>
    )
  }

  return (
    <ReportInsightCard
      title="Entry-timing risk"
      subtitle="Same holding period, different Jan-1 start years — how much did luck of entry matter?"
      className="mb-4"
    >
      {loading && !matrix ? <Skeleton className="h-[300px] w-full rounded-xl" /> : null}
      {error ? (
        <div className="space-y-2 text-sm text-destructive">
          <p>{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={retry}>
            Retry
          </Button>
        </div>
      ) : null}
      {matrix ? <EntryTimingFanChart matrix={matrix} /> : null}
      {!loading && !error && !matrix ? (
        <p className="text-sm text-muted-foreground">Lumpsum matrix is not available yet.</p>
      ) : null}
    </ReportInsightCard>
  )
}
