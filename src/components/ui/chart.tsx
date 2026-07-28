import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/lib/utils'

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    color?: string
  }
>

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }
  return context
}

/** Theme-aware hover band — uses --chart-tooltip-cursor from index.css. */
export const CHART_TOOLTIP_CURSOR = {
  fill: 'var(--chart-tooltip-cursor)',
  opacity: 1,
} as const

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          'flex aspect-video justify-center rounded-lg bg-[var(--chart-surface)] text-xs text-foreground min-w-0 w-full',
          '[&_.recharts-cartesian-axis-tick_text]:fill-[var(--chart-axis)]',
          '[&_.recharts-cartesian-grid_line]:stroke-[var(--chart-grid-stroke)]',
          '[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-[var(--chart-tooltip-cursor)]',
          className,
        )}
        {...props}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `[data-chart=${chartId}]{${Object.entries(config)
              .map(([key, item]) => (item.color ? `--color-${key}:${item.color};` : ''))
              .join('')}}`,
          }}
        />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = 'ChartContainer'

const ChartTooltip = RechartsPrimitive.Tooltip

type TooltipPayloadItem = {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
  payload?: Record<string, unknown>
}

type ChartTooltipContentProps = {
  active?: boolean
  payload?: ReadonlyArray<TooltipPayloadItem>
  label?: string | number
  /** percent = always %; number = plain; auto = infer from dataKey */
  format?: 'percent' | 'number' | 'auto'
  labelFormatter?: (label: string | number | undefined, payload: ReadonlyArray<TooltipPayloadItem>) => string
  className?: string
}

function formatTooltipValue(value: unknown, dataKey: string, format: ChartTooltipContentProps['format']) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return String(value ?? '—')
  }

  const mode =
    format === 'percent' || format === 'number'
      ? format
      : /percent|drawdown|cagr|return|volatility|alpha|cob/i.test(dataKey)
        ? 'percent'
        : 'number'

  if (mode === 'percent') {
    return `${value.toFixed(2)}%`
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function valueToneClass(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value) || value === 0) {
    return 'text-popover-foreground'
  }
  if (value < 0) return 'text-red-600 dark:text-red-400'
  return 'text-emerald-700 dark:text-emerald-400'
}

function ChartTooltipContent({
  active,
  payload,
  label,
  format = 'auto',
  labelFormatter,
  className,
}: ChartTooltipContentProps) {
  const { config } = useChart()
  if (!active || !payload?.length) return null

  const heading = labelFormatter ? labelFormatter(label, payload) : label

  return (
    <div
      className={cn(
        'z-50 min-w-[9rem] rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md',
        className,
      )}
    >
      {heading != null && heading !== '' && (
        <p className="mb-1.5 font-semibold text-foreground">{heading}</p>
      )}
      <div className="space-y-1">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? 'value')
          const numeric = typeof item.value === 'number' ? item.value : Number(item.value)
          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color ?? config[key]?.color }}
                  aria-hidden="true"
                />
                {config[key]?.label ?? item.name ?? key}
              </span>
              <span className={cn('font-mono font-medium tabular-nums', valueToneClass(numeric))}>
                {formatTooltipValue(item.value, key, format)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent(props: unknown) {
  const { payload } = props as {
    payload?: ReadonlyArray<{ value?: string; color?: string; dataKey?: string | number }>
  }
  const { config } = useChart()
  if (!payload?.length) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.value ?? 'value')
        return (
          <div key={key} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">{config[key]?.label ?? item.value}</span>
          </div>
        )
      })}
    </div>
  )
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
