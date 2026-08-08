import { useIsSmallScreen } from '@/hooks/useMediaQuery'
import { TICK_MD, TICK_SM } from '@/lib/charts/chartAxes'
import {
  createYearChangeTickFormatter,
  formatAxisIndianMoneyTick,
  formatAxisMonthYearTick,
  formatAxisPercentCompact,
  formatMissDaysScenarioTick,
} from '@/lib/charts/axisFormatters'

type ResponsiveAxisOptions = {
  dense?: boolean
}

export function useResponsiveAxis(options?: ResponsiveAxisOptions) {
  const isSmall = useIsSmallScreen()
  const dense = options?.dense ?? false
  const compact = isSmall

  return {
    isSmall,
    compact,
    tick: isSmall ? TICK_SM : TICK_MD,
    // Flat labels + short ticks need less bottom room than angled desktop labels.
    xHeight: isSmall ? 28 : dense ? 60 : 70,
    xAngle: isSmall ? 0 : dense ? -45 : -20,
    xAnchor: isSmall ? ('middle' as const) : ('end' as const),
    // Wider gap on phones → fewer ticks, no horizontal chart overflow.
    xGap: isSmall ? 48 : dense ? 48 : 48,
    yWidth: isSmall ? 32 : 48,
    yWidthMoney: isSmall ? 44 : 72,
    showYLabel: !isSmall,
    showXLabel: !isSmall,
    formatMonthYearTick: (value: string | number) => formatAxisMonthYearTick(value, compact),
    /** Fresh formatter each call so year-change state resets per chart render. */
    createTimeTickFormatter: () =>
      compact ? createYearChangeTickFormatter() : (value: string | number) => formatAxisMonthYearTick(value, false),
    formatPercentTick: (value: number) => formatAxisPercentCompact(value, compact),
    formatMoneyTick: (value: number) => formatAxisIndianMoneyTick(value, compact),
    formatMissDaysTick: (label: string) => formatMissDaysScenarioTick(label, compact),
  }
}
