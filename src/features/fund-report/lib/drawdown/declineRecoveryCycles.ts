import type { FundReport } from '../../schemas'

type Phase = FundReport['drawdown']['phases'][number]
type IndexedNavPoint = FundReport['drawdown']['indexedNav'][number]

export type DeclineRecoveryCycle = {
  id: string
  label: string
  declinePercent: number
  recoveryPercent: number
  declineDuration: string
  recoveryDuration: string
  ongoing: boolean
  declineStart: string
  declineEnd: string
  recoveryStart: string
  recoveryEnd: string
}

const MIN_CYCLE_DECLINE = 10

export function buildDeclineRecoveryCycles(phases: Phase[]): DeclineRecoveryCycle[] {
  const cycles: DeclineRecoveryCycle[] = []

  for (let index = 0; index < phases.length; index++) {
    const decline = phases[index]
    if (decline?.type !== 'DECLINE') continue

    const recovery = phases[index + 1]
    if (!recovery || recovery.type !== 'RECOVERY') continue

    const declinePercent = Math.abs(decline.changePercent)
    if (declinePercent < MIN_CYCLE_DECLINE) continue

    cycles.push({
      id: `${decline.startDate}-${recovery.endDate}`,
      label: formatYearRange(decline.startDate, recovery.endDate),
      declinePercent,
      recoveryPercent: Math.abs(recovery.changePercent),
      declineDuration: decline.durationLabel,
      recoveryDuration: recovery.durationLabel,
      ongoing: recovery.ongoing,
      declineStart: decline.startDate,
      declineEnd: decline.endDate,
      recoveryStart: recovery.startDate,
      recoveryEnd: recovery.endDate,
    })
  }

  return cycles
}

function formatYearRange(start: string, end: string): string {
  const startYear = new Date(start).getFullYear()
  const endYear = new Date(end).getFullYear()
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return ''
  if (startYear === endYear) return String(startYear)
  const endSuffix = String(endYear).slice(-2)
  return `${startYear}-${endSuffix}`
}

export type IndexedNavTimelinePoint = {
  date: string
  indexValue: number
  declineNav: number | null
  recoveryNav: number | null
}

export type CycleBand = {
  cycle: DeclineRecoveryCycle
  dateStart: string
  dateEnd: string
}

export function buildIndexedNavTimelineModel(
  indexedNav: IndexedNavPoint[],
  phases: Phase[],
): { points: IndexedNavTimelinePoint[]; bands: CycleBand[]; yDomain: [number, number] } {
  const cycles = buildDeclineRecoveryCycles(phases)
  if (indexedNav.length === 0 || cycles.length === 0) {
    return { points: [], bands: [], yDomain: [90, 110] }
  }

  const navByDate = new Map(indexedNav.map((point) => [point.date, point.indexValue]))
  const declineRanges = cycles.map((cycle) => ({
    start: cycle.declineStart,
    end: cycle.declineEnd,
  }))
  const recoveryRanges = cycles.map((cycle) => ({
    start: cycle.recoveryStart,
    end: cycle.recoveryEnd,
  }))

  const points: IndexedNavTimelinePoint[] = indexedNav.map((point) => {
    const inDecline = declineRanges.some(
      (range) => point.date >= range.start && point.date <= range.end,
    )
    const inRecovery = recoveryRanges.some(
      (range) => point.date >= range.start && point.date <= range.end,
    )
    return {
      date: point.date,
      indexValue: point.indexValue,
      declineNav: inDecline ? point.indexValue : null,
      recoveryNav: inRecovery ? point.indexValue : null,
    }
  })

  const bands: CycleBand[] = cycles.map((cycle) => ({
    cycle,
    dateStart: cycle.declineStart,
    dateEnd: cycle.recoveryEnd,
  }))

  const values = indexedNav.map((point) => point.indexValue).filter(Number.isFinite)
  const cyclePeaks = cycles
    .map((cycle) => navByDate.get(cycle.declineStart))
    .filter((value): value is number => value != null && Number.isFinite(value))
  const cycleTroughs = cycles
    .flatMap((cycle) => [navByDate.get(cycle.declineEnd), navByDate.get(cycle.recoveryStart)])
    .filter((value): value is number => value != null && Number.isFinite(value))

  const allValues = [...values, ...cyclePeaks, ...cycleTroughs]
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const padding = Math.max(5, (max - min) * 0.08)

  return {
    points,
    bands,
    yDomain: [Math.floor(min - padding), Math.ceil(max + padding)],
  }
}

export type CycleChartPoint = {
  x: number
  value: number
  decline: number | null
  recovery: number | null
  cycleId: string
}

export type CycleColumnBand = {
  cycle: DeclineRecoveryCycle
  xStart: number
  xEnd: number
  xCenter: number
  minY: number
  maxY: number
}

const SLOT_WIDTH = 1
const SLOT_GAP = 0.18

export function buildCycleChartModel(
  cycles: DeclineRecoveryCycle[],
  indexedNav: IndexedNavPoint[] = [],
) {
  if (indexedNav.length > 0) {
    return buildCycleChartModelFromNav(cycles, indexedNav)
  }
  return buildSyntheticCycleChartModel(cycles)
}

function buildCycleChartModelFromNav(
  cycles: DeclineRecoveryCycle[],
  indexedNav: IndexedNavPoint[],
) {
  const navByDate = new Map(indexedNav.map((point) => [point.date, point.indexValue]))
  const points: CycleChartPoint[] = []
  const bands: CycleColumnBand[] = []

  cycles.forEach((cycle, index) => {
    const xStart = index * (SLOT_WIDTH + SLOT_GAP)
    const peakNav = navByDate.get(cycle.declineStart)
    if (peakNav == null || peakNav <= 0) return

    const windowPoints = indexedNav.filter(
      (point) => point.date >= cycle.declineStart && point.date <= cycle.recoveryEnd,
    )
    if (windowPoints.length < 2) return

    const startMs = Date.parse(cycle.declineStart)
    const endMs = Date.parse(cycle.recoveryEnd)
    const spanMs = Math.max(endMs - startMs, 1)

    const curve = windowPoints.map((point) => {
      const t = (Date.parse(point.date) - startMs) / spanMs
      const x = xStart + t * SLOT_WIDTH
      const value = ((point.indexValue / peakNav) - 1) * 100
      const inDecline = point.date <= cycle.declineEnd
      const inRecovery = point.date >= cycle.recoveryStart
      return {
        x,
        value,
        decline: inDecline ? value : null,
        recovery: inRecovery ? value : null,
        cycleId: cycle.id,
      }
    })

    points.push(...curve)
    const values = curve.map((point) => point.value)
    bands.push({
      cycle,
      xStart,
      xEnd: xStart + SLOT_WIDTH,
      xCenter: xStart + SLOT_WIDTH / 2,
      minY: Math.min(...values),
      maxY: Math.max(...values),
    })
  })

  const maxDecline = Math.max(...bands.map((band) => Math.abs(band.minY)), 1)
  const maxRecovery = Math.max(...bands.map((band) => band.maxY), 1)
  const yLimit = Math.ceil(Math.max(maxDecline, maxRecovery) * 1.12)

  return {
    points,
    bands,
    yLimit,
    xMax: Math.max(cycles.length * (SLOT_WIDTH + SLOT_GAP) - SLOT_GAP, SLOT_WIDTH),
    usesRealNav: true,
  }
}

function buildSyntheticCycleChartModel(cycles: DeclineRecoveryCycle[]) {
  const points: CycleChartPoint[] = []
  const bands: CycleColumnBand[] = []
  const CURVE_STEPS = 7

  cycles.forEach((cycle, index) => {
    const xStart = index * (SLOT_WIDTH + SLOT_GAP)
    const decline = -cycle.declinePercent
    const troughValue = decline
    const endValue =
      ((1 + cycle.recoveryPercent / 100) * (1 + troughValue / 100) - 1) * 100
    const curve: CycleChartPoint[] = []

    const tValues = [...new Set([
      ...Array.from({ length: CURVE_STEPS }, (_, step) => step / (CURVE_STEPS - 1)),
      TROUGH_END,
    ])].sort((a, b) => a - b)

    for (const t of tValues) {
      const value = sampleCycleValue(t, decline, endValue)
      const x = xStart + t * SLOT_WIDTH
      const inDecline = t <= TROUGH_END
      const inRecovery = t >= TROUGH_END
      curve.push({
        x,
        value,
        decline: inDecline ? value : null,
        recovery: inRecovery ? value : null,
        cycleId: cycle.id,
      })
    }

    points.push(...curve)
    const values = curve.map((point) => point.value)
    bands.push({
      cycle,
      xStart,
      xEnd: xStart + SLOT_WIDTH,
      xCenter: xStart + SLOT_WIDTH / 2,
      minY: Math.min(...values),
      maxY: Math.max(...values),
    })
  })

  const maxDecline = Math.max(...bands.map((band) => Math.abs(band.minY)), 1)
  const maxRecovery = Math.max(...bands.map((band) => band.maxY), 1)
  const yLimit = Math.ceil(Math.max(maxDecline, maxRecovery) * 1.15)

  return {
    points,
    bands,
    yLimit,
    xMax: cycles.length * (SLOT_WIDTH + SLOT_GAP) - SLOT_GAP,
    usesRealNav: false,
  }
}

const TROUGH_END = 0.48

function sampleCycleValue(t: number, decline: number, endValue: number): number {
  const declineEnd = 0.38

  if (t <= declineEnd) {
    const progress = t / declineEnd
    return decline * easeInOut(progress)
  }
  if (t <= TROUGH_END) {
    const progress = (t - declineEnd) / (TROUGH_END - declineEnd)
    return decline + (0 - decline) * easeInOut(progress)
  }
  const progress = (t - TROUGH_END) / (1 - TROUGH_END)
  return endValue * easeInOut(progress)
}

function easeInOut(t: number): number {
  return t * t * (3 - 2 * t)
}

export function cycleHeadline(cycles: DeclineRecoveryCycle[]): string | null {
  if (cycles.length === 0) return null
  const avgDecline =
    cycles.reduce((sum, cycle) => sum + cycle.declinePercent, 0) / cycles.length
  const avgRecovery =
    cycles.reduce((sum, cycle) => sum + cycle.recoveryPercent, 0) / cycles.length
  if (avgRecovery <= avgDecline) return null
  return 'Upsides are much higher than the declines!'
}

export function formatIndexedNavTick(value: number): string {
  if (!Number.isFinite(value)) return ''
  return value.toFixed(0)
}
