import { useIsSmallScreen } from '@/hooks/useMediaQuery'
import { TICK_MD, TICK_SM } from '@/lib/charts/chartAxes'

type ResponsiveAxisOptions = {
  dense?: boolean
}

export function useResponsiveAxis(options?: ResponsiveAxisOptions) {
  const isSmall = useIsSmallScreen()
  const dense = options?.dense ?? false

  return {
    tick: isSmall ? TICK_SM : TICK_MD,
    xHeight: isSmall ? 40 : dense ? 60 : 70,
    xAngle: isSmall ? 0 : dense ? -45 : -20,
    xAnchor: isSmall ? ('middle' as const) : ('end' as const),
    xGap: isSmall ? 32 : dense ? 48 : 48,
    yWidth: isSmall ? 36 : 48,
    showYLabel: !isSmall,
  }
}
