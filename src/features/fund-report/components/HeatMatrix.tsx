import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { bandColor, bandTextColor, RETURN_BAND_COLORS } from '@/lib/chartColors'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { MatrixReport } from '../schemas'

const SKELETON_YEARS = 13
const SKELETON_ROWS = 10

const SUMMARY_META: Record<
  string,
  { icon: typeof ArrowUp; labelClass: string; rowClass: string; chipClass: string }
> = {
  Average: {
    icon: Minus,
    labelClass: 'text-sky-700 dark:text-sky-300',
    rowClass: 'bg-sky-500/10',
    chipClass: 'bg-sky-500/20 text-sky-800 dark:text-sky-200 ring-sky-500/30',
  },
  Max: {
    icon: ArrowUp,
    labelClass: 'text-emerald-700 dark:text-emerald-300',
    rowClass: 'bg-emerald-500/10',
    chipClass: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 ring-emerald-500/30',
  },
  Min: {
    icon: ArrowDown,
    labelClass: 'text-rose-700 dark:text-rose-300',
    rowClass: 'bg-rose-500/10',
    chipClass: 'bg-rose-500/20 text-rose-800 dark:text-rose-200 ring-rose-500/30',
  },
}

export function HeatMatrix({ data }: { data: MatrixReport }) {
  return (
    <div className="w-full space-y-3">
      <div className="w-full overflow-x-auto rounded-xl border border-border bg-card/40">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Start
              </th>
              {data.holdingYears.map((y) => (
                <th
                  key={y}
                  className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {y}Y
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="border-b-2 border-border">
            {data.summaryRows.map((row) => {
              const meta = SUMMARY_META[row.label] ?? SUMMARY_META.Average
              const Icon = meta.icon
              return (
                <tr key={row.label} className={cn('border-b border-border/50', meta.rowClass)}>
                  <td className={cn('sticky left-0 z-10 px-3 py-2.5', meta.rowClass)}>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                        meta.chipClass,
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                      {row.label}
                    </span>
                  </td>
                  {row.values.map((v, i) => (
                    <td
                      key={`${row.label}-${i}`}
                      className={cn(
                        'px-3 py-2.5 text-center font-mono text-sm font-semibold tabular-nums tracking-tight',
                        meta.labelClass,
                      )}
                    >
                      {v == null ? (
                        <span className="text-muted-foreground/70">—</span>
                      ) : (
                        formatValue(data.mode, v)
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>

          <tbody>
            {data.dataRows.map((row) => (
              <tr key={row.startLabel} className="border-b border-border/35 last:border-0">
                <td className="sticky left-0 z-10 bg-card px-3 py-2 text-sm font-medium text-foreground">
                  {row.startLabel}
                </td>
                {row.cells.map((cell) => {
                  const hasValue = cell.value != null
                  return (
                    <td
                      key={cell.holdingYears}
                      className="px-2 py-1.5 text-center"
                    >
                      {hasValue ? (
                        <span
                          className="inline-flex min-w-[2.75rem] items-center justify-center rounded-md px-1.5 py-1 font-mono text-xs font-semibold tabular-nums sm:text-sm"
                          style={{
                            backgroundColor: bandColor(cell.band),
                            color: bandTextColor(cell.band),
                          }}
                          title={formatValue(data.mode, cell.value!)}
                        >
                          {formatValue(data.mode, cell.value!)}
                        </span>
                      ) : null}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">Legend</span>
        <LegendSwatch label="Strong" fill={RETURN_BAND_COLORS.STRONG} text="#fff" />
        <LegendSwatch label="Moderate" fill={RETURN_BAND_COLORS.MODERATE} text="#1c1917" />
        <LegendSwatch label="Weak" fill={RETURN_BAND_COLORS.WEAK} text="#0f172a" />
        <LegendSwatch label="Negative" fill={RETURN_BAND_COLORS.NEGATIVE} text="#fff" />
      </div>
    </div>
  )
}

function LegendSwatch({ label, fill, text }: { label: string; fill: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex size-5 items-center justify-center rounded font-mono text-[10px] font-bold"
        style={{ backgroundColor: fill, color: text }}
        aria-hidden="true"
      >
        #
      </span>
      {label}
    </span>
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
                <Skeleton className="h-6 w-20 rounded-full" />
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
