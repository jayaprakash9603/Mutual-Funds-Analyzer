import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCalendarReturns } from '../../hooks/useCalendarReturns'
import { CalendarAlphaHeatmap } from './CalendarAlphaHeatmap'
import { CalendarReturnsHeatmap } from './CalendarReturnsHeatmap'
import { ChartRangeToggle } from './ChartRangeToggle'

type ViewMode = 'returns' | 'alpha'

export function CalendarReturnsViews({
  scheme,
  startDate,
  offlineView = false,
}: {
  scheme: string
  startDate?: string
  offlineView?: boolean
}) {
  const [view, setView] = useState<ViewMode>('returns')
  const { data, loading, error, retry } = useCalendarReturns(
    offlineView ? null : scheme,
    startDate,
    !offlineView && view === 'alpha',
  )

  if (offlineView) {
    return (
      <CalendarReturnsHeatmap scheme={scheme} startDate={startDate} offlineView />
    )
  }

  return (
    <div className="space-y-3">
      <ChartRangeToggle
        ariaLabel="Calendar returns view"
        options={[
          { id: 'returns', label: 'Returns' },
          { id: 'alpha', label: 'Alpha vs benchmark' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'returns' ? (
        <CalendarReturnsHeatmap scheme={scheme} startDate={startDate} offlineView={false} />
      ) : (
        <>
          {error ? (
            <div className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
              <p className="text-destructive">{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={retry}>
                Retry
              </Button>
            </div>
          ) : null}
          {loading && !data ? <Skeleton className="h-64 w-full rounded-2xl" /> : null}
          {data ? <CalendarAlphaHeatmap data={data} /> : null}
          {!loading && !error && !data ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              Calendar alpha is not available yet.
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
