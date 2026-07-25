import type { GoldenTriangleResult } from './types'
import { withMetrics } from './metrics'

export interface MetricOverrides {
  fundRollingAvgOverride?: number
  benchmarkRollingAvgOverride?: number
  cobOverride?: number
  fundSharpeOverride?: number
  benchmarkSharpeOverride?: number
}

/**
 * A cleared number input yields NaN rather than undefined, so an override only
 * wins when it is a real finite number.
 */
function pick(current: number, candidate?: number) {
  return candidate !== undefined && Number.isFinite(candidate) ? candidate : current
}

/**
 * Applies manual metric overrides and re-derives the rules and score, so the
 * result card can never disagree with the insights panel.
 */
export function applyMetricOverrides(
  result: GoldenTriangleResult,
  overrides?: MetricOverrides,
): GoldenTriangleResult {
  if (!overrides) return result

  const current = result.metrics
  return withMetrics(result, {
    ...current,
    fundRollingAvg: pick(current.fundRollingAvg, overrides.fundRollingAvgOverride),
    benchmarkRollingAvg: pick(current.benchmarkRollingAvg, overrides.benchmarkRollingAvgOverride),
    cob: pick(current.cob, overrides.cobOverride),
    fundSharpe: pick(current.fundSharpe, overrides.fundSharpeOverride),
    benchmarkSharpe: pick(current.benchmarkSharpe, overrides.benchmarkSharpeOverride),
  })
}
