import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { MatrixReport } from '../schemas'
import { trimMatrixToCalculatedValues } from '../lib/matrixTableUtils'
import { FundsIndiaMatrixTable } from './FundsIndiaMatrixTable'

const SKELETON_YEARS = 13
const SKELETON_ROWS = 10
const GRID_LINE = 'border-slate-300/80 dark:border-slate-600/70'

export function HeatMatrix({ data }: { data: MatrixReport }) {
  const trimmed = trimMatrixToCalculatedValues(data)
  const highlightLabels = new Set(trimmed.recovery?.rows.map((row) => row.startLabel) ?? [])

  return (
    <div className="w-full space-y-3">
      <FundsIndiaMatrixTable
        data={trimmed}
        highlightLabels={highlightLabels.size > 0 ? highlightLabels : undefined}
        dashedHighlightLabels={new Set(trimmed.recovery?.exceptionStartLabels ?? [])}
      />
    </div>
  )
}

export function HeatMatrixSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-300/90 bg-white dark:border-slate-600 dark:bg-card">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <tbody>
          {Array.from({ length: 3 }, (_, r) => (
            <tr key={`summary-${r}`} className={cn('border-b', GRID_LINE)}>
              <td className={cn('sticky left-0 z-10 border-r bg-muted/40 px-3 py-2', GRID_LINE)}>
                <Skeleton className="h-6 w-20 rounded-full" />
              </td>
              {Array.from({ length: SKELETON_YEARS }, (_, c) => (
                <td key={c} className={cn('border-r px-3 py-2 last:border-r-0', GRID_LINE)}>
                  <Skeleton className="mx-auto h-5 w-10 rounded-full" />
                </td>
              ))}
            </tr>
          ))}
          <tr className={cn('border-b', GRID_LINE)}>
            <td className={cn('sticky left-0 z-10 border-r px-3 py-2.5', GRID_LINE)}>
              <Skeleton className="h-4 w-12" />
            </td>
            {Array.from({ length: SKELETON_YEARS }, (_, i) => (
              <td key={i} className={cn('border-r px-3 py-2.5 last:border-r-0', GRID_LINE)}>
                <Skeleton className="mx-auto h-4 w-6" />
              </td>
            ))}
          </tr>
          {Array.from({ length: SKELETON_ROWS }, (_, r) => (
            <tr key={`row-${r}`} className={cn('border-b', GRID_LINE)}>
              <td className={cn('sticky left-0 z-10 border-r bg-white px-3 py-2 dark:bg-card', GRID_LINE)}>
                <Skeleton className="h-4 w-14" />
              </td>
              {Array.from({ length: SKELETON_YEARS }, (_, c) => {
                const filled = c < SKELETON_YEARS - r
                return (
                  <td key={c} className={cn('px-2 py-2', GRID_LINE)}>
                    {filled ? <Skeleton className="mx-auto h-7 w-full max-w-[3rem]" /> : null}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
