import { formatDurationMonths } from './formatDuration'
import { monthsToTargetCorpus } from './stepUpSipSimulation'

export const TARGET_SIP_AMOUNTS = [5_000, 10_000, 25_000, 50_000] as const
export const TARGET_AMOUNTS = [50_00_000, 1_00_00_000, 2_00_00_000, 5_00_00_000] as const

export type TargetAmountGridCell = {
  months: number
  duration: string
}

export type TargetAmountGrid = {
  sipAmounts: readonly number[]
  targetAmounts: readonly number[]
  cagrPercent: number
  stepUpPercent: number
  rows: TargetAmountGridCell[][]
}

export function monthsToTarget(
  sip: number,
  target: number,
  cagrPercent: number,
  stepUpPercent: number,
): number {
  return monthsToTargetCorpus(sip, target, cagrPercent, stepUpPercent)
}

export function buildTargetAmountGrid(
  cagrPercent: number,
  stepUpPercent: number,
): TargetAmountGrid {
  const rows = TARGET_SIP_AMOUNTS.map((sip) =>
    TARGET_AMOUNTS.map((target) => {
      const months = monthsToTarget(sip, target, cagrPercent, stepUpPercent)
      return {
        months,
        duration: formatDurationMonths(months),
      }
    }),
  )

  return {
    sipAmounts: TARGET_SIP_AMOUNTS,
    targetAmounts: TARGET_AMOUNTS,
    cagrPercent,
    stepUpPercent,
    rows,
  }
}
