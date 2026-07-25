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
          'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50',
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

function ChartTooltipContent(props: unknown) {
  const { active, payload, label } = props as {
    active?: boolean
    payload?: ReadonlyArray<{ name?: string; value?: number; color?: string; dataKey?: string | number }>
    label?: string
  }
  const { config } = useChart()
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-border/50 bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name ?? 'value')
        return (
          <div key={key} className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{config[key]?.label ?? item.name ?? key}</span>
            <span className="font-mono font-medium tabular-nums">{item.value}</span>
          </div>
        )
      })}
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
