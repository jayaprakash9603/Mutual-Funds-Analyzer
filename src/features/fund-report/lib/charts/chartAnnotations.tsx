import { CHART_COLORS } from '@/lib/charts/chartColors'

export type AxisScale = {
  scale?: (value: number) => number
}

export function firstScale(map?: Record<string, AxisScale>): ((value: number) => number) | undefined {
  if (!map) return undefined
  const axis = Object.values(map)[0]
  return axis?.scale
}

export type ChartMarker = {
  id: string
  date: string
  value: number
  headline: string
  detail: string
  tone: 'decline' | 'recovery'
}

export function MarkerPill({
  x,
  y,
  marker,
}: {
  x: number
  y: number
  marker: ChartMarker
}) {
  const fill = marker.tone === 'decline' ? CHART_COLORS.red : CHART_COLORS.fund
  const labelOffset = marker.tone === 'decline' ? 24 : -18
  const detailOffset = marker.tone === 'decline' ? 38 : -32
  const pillWidth = Math.max(44, marker.headline.length * 7 + 14)

  return (
    <g>
      <circle cx={x} cy={y} r={4.5} fill={fill} stroke="#ffffff" strokeWidth={1.5} />
      <rect
        x={x - pillWidth / 2}
        y={y + labelOffset - 11}
        width={pillWidth}
        height={20}
        rx={5}
        fill={fill}
        opacity={0.95}
      />
      <text
        x={x}
        y={y + labelOffset + 2}
        fill="#ffffff"
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        dominantBaseline="middle"
      >
        {marker.headline}
      </text>
      <text
        x={x}
        y={y + detailOffset}
        fill="var(--chart-marker-detail)"
        textAnchor="middle"
        fontSize={9}
        fontWeight={500}
        dominantBaseline="middle"
      >
        {marker.detail}
      </text>
    </g>
  )
}

export function ChartMarkers({
  markers,
  xAxisMap,
  yAxisMap,
  valueKey: _valueKey = 'drawdownPercent',
}: {
  markers: ChartMarker[]
  xAxisMap?: Record<string, AxisScale>
  yAxisMap?: Record<string, AxisScale>
  valueKey?: string
}) {
  const xScale = firstScale(xAxisMap)
  const yScale = firstScale(yAxisMap)
  if (!xScale || !yScale) return null

  const scaleX = xScale as (value: string | number) => number

  return (
    <g>
      {markers.map((marker) => (
        <MarkerPill
          key={marker.id}
          x={scaleX(marker.date)}
          y={yScale(marker.value)}
          marker={marker}
        />
      ))}
    </g>
  )
}
