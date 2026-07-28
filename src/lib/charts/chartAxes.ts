/** Theme tokens — resolved from CSS variables in index.css (light + dark). */
export const AXIS_STROKE = 'var(--chart-axis)'
export const GRID_STROKE = 'var(--chart-grid-stroke)'
export const ZERO_LINE_STROKE = 'var(--chart-zero-line)'

export const TICK_SM = { fontSize: 10, fill: AXIS_STROKE }
export const TICK_MD = { fontSize: 11, fill: AXIS_STROKE }

export const AXIS_LINE = { stroke: GRID_STROKE }
export const TICK_LINE = { stroke: GRID_STROKE }

export const AXIS_LABEL = { fill: AXIS_STROKE, fontSize: 11 }

export const CHART_HEIGHT = 'aspect-auto h-[320px] w-full sm:h-[380px] lg:h-[420px]'
export const CHART_HEIGHT_WIDE = 'aspect-auto h-[360px] w-full sm:h-[420px] lg:h-[480px]'
export const CHART_HEIGHT_COMPACT = 'mx-auto aspect-square h-[280px] w-full max-w-[360px] sm:h-[320px]'
/** @deprecated Prefer CHART_HEIGHT_COMPACT — kept for existing imports */
export const CHART_HEIGHT_SQUARE = CHART_HEIGHT_COMPACT

export const MARGIN_X = { top: 8, right: 16, left: 8, bottom: 8 }
export const MARGIN_LEFT = { top: 8, right: 8, left: 8, bottom: 8 }
export const DOMAIN_0_100: [number, number] = [0, 100]

export type ChartPlotMarginOverrides = {
  top?: number
  right?: number
  bottom?: number
}

/** Plot margins when YAxis `width` reserves the left gutter — never duplicate in margin.left. */
export function chartPlotMargin(overrides: ChartPlotMarginOverrides = {}) {
  return {
    top: overrides.top ?? 8,
    right: overrides.right ?? 8,
    bottom: overrides.bottom ?? 8,
    left: 0,
  }
}

export function xLabel(text: string, offset = 0) {
  return {
    value: text,
    position: 'insideBottom' as const,
    offset,
    style: AXIS_LABEL,
  }
}

export function yLabel(text: string, angle = -90) {
  return {
    value: text,
    angle,
    position: 'insideLeft' as const,
    style: { ...AXIS_LABEL, fontSize: 10 },
  }
}

export function yLabelRight(text: string) {
  return {
    value: text,
    angle: 90,
    position: 'insideRight' as const,
    style: AXIS_LABEL,
  }
}

/** Recharts `unit="%"` can corrupt negative tick labels — format ticks explicitly instead. */
export function formatAxisPercentTick(value: number) {
  if (!Number.isFinite(value)) return ''
  return `${value.toFixed(0)}%`
}

export function drawdownYDomain(series: Array<{ drawdownPercent: number }>): [number, number] {
  const values = series.map((point) => point.drawdownPercent).filter(Number.isFinite)
  if (values.length === 0) return [-10, 0]
  const min = Math.min(...values)
  const padding = Math.max(2, Math.abs(min) * 0.05)
  return [Math.floor(min - padding), 0]
}
