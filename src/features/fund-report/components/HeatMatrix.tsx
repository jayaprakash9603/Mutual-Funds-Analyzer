import { bandColor } from '@/lib/chartColors'
import { Skeleton } from '@/components/ui/skeleton'
import type { MatrixReport } from '../schemas'

const SKELETON_YEARS = 13
const SKELETON_ROWS = 10

export function HeatMatrix({ data }: { data: MatrixReport }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2.5 text-left font-semibold">Start</th>
            {data.holdingYears.map((y) => (
              <th key={y} className="px-3 py-2.5 text-center font-semibold">
                {y}Y
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.summaryRows.map((row) => (
            <tr key={row.label} className="border-b border-border/60 font-medium">
              <td className="sticky left-0 z-10 bg-muted/50 px-3 py-2">{row.label}</td>
              {row.values.map((v, i) => (
                <td key={`${row.label}-${i}`} className="px-3 py-2 text-center">
                  {v == null ? '—' : formatValue(data.mode, v)}
                </td>
              ))}
            </tr>
          ))}
          {data.dataRows.map((row) => (
            <tr key={row.startLabel} className="border-b border-border/40 last:border-0">
              <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium">{row.startLabel}</td>
              {row.cells.map((cell) => (
                <td
                  key={cell.holdingYears}
                  className="px-3 py-2 text-center tabular-nums text-foreground/90"
                  style={{ backgroundColor: bandColor(cell.band) }}
                  title={cell.value == null ? undefined : formatValue(data.mode, cell.value)}
                >
                  {cell.value == null ? '' : formatValue(data.mode, cell.value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function HeatMatrixSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2.5 text-left">
              <Skeleton className="h-4 w-12" />
            </th>
            {Array.from({ length: SKELETON_YEARS }, (_, i) => (
              <th key={i} className="px-3 py-2.5">
                <Skeleton className="mx-auto h-4 w-8" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 3 }, (_, r) => (
            <tr key={`summary-${r}`} className="border-b border-border/60">
              <td className="sticky left-0 z-10 bg-muted/50 px-3 py-2">
                <Skeleton className="h-4 w-14" />
              </td>
              {Array.from({ length: SKELETON_YEARS }, (_, c) => (
                <td key={c} className="px-3 py-2">
                  <Skeleton className="mx-auto h-5 w-10 rounded-md" />
                </td>
              ))}
            </tr>
          ))}
          {Array.from({ length: SKELETON_ROWS }, (_, r) => (
            <tr key={`row-${r}`} className="border-b border-border/40">
              <td className="sticky left-0 z-10 bg-card px-3 py-2">
                <Skeleton className="h-4 w-14" />
              </td>
              {Array.from({ length: Math.max(1, SKELETON_YEARS - r) }, (_, c) => (
                <td key={c} className="px-3 py-2">
                  <Skeleton className="mx-auto h-6 w-full max-w-[3rem] rounded-md" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatValue(mode: string, value: number) {
  if (mode === 'MULTIPLE') return `${value.toFixed(1)}x`
  return `${value.toFixed(0)}%`
}
