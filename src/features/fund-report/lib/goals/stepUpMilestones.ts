import { formatDurationMonths } from './formatDuration'
import { simulateStepUpSip } from './stepUpSipSimulation'

export type StepUpMilestoneBand = {
  band: number
  corpusSharePercent: number
  months: number
  duration: string
  investment: number
  returns: number
  corpusEnd: number
}

export type StepUpMilestones = {
  monthlySip: number
  stepUpPercent: number
  cagrPercent: number
  horizonYears: number
  finalCorpus: number
  totalInvested: number
  totalReturns: number
  bands: StepUpMilestoneBand[]
}

const BAND_COUNT = 10

export function buildStepUpMilestones(
  monthlySip: number,
  stepUpPercent: number,
  cagrPercent: number,
  horizonYears: number,
): StepUpMilestones {
  const horizonMonths = horizonYears * 12
  const timeline = simulateStepUpSip(monthlySip, stepUpPercent, cagrPercent, horizonMonths)
  const finalSnapshot = timeline[timeline.length - 1]
  const finalCorpus = finalSnapshot?.corpus ?? 0
  const totalInvested = finalSnapshot?.invested ?? 0
  const totalReturns = finalCorpus - totalInvested
  const bandSize = finalCorpus / BAND_COUNT

  if (bandSize <= 0) {
    return {
      monthlySip,
      stepUpPercent,
      cagrPercent,
      horizonYears,
      finalCorpus,
      totalInvested,
      totalReturns,
      bands: [],
    }
  }

  const bands: StepUpMilestoneBand[] = []
  let bandStartMonth = 0
  let bandStartCorpus = 0
  let bandStartInvested = 0
  let timelineIndex = 0

  for (let band = 1; band <= BAND_COUNT; band += 1) {
    const targetCorpus = bandSize * band

    while (timelineIndex < timeline.length && timeline[timelineIndex].corpus < targetCorpus) {
      timelineIndex += 1
    }

    const endSnapshot = timeline[timelineIndex] ?? finalSnapshot
    const endMonth = endSnapshot?.month ?? horizonMonths
    const endCorpus = endSnapshot?.corpus ?? finalCorpus
    const endInvested = endSnapshot?.invested ?? totalInvested
    const investment = endInvested - bandStartInvested
    const corpusGain = endCorpus - bandStartCorpus

    bands.push({
      band,
      corpusSharePercent: 100 / BAND_COUNT,
      months: endMonth - bandStartMonth,
      duration: formatDurationMonths(endMonth - bandStartMonth),
      investment,
      returns: corpusGain - investment,
      corpusEnd: endCorpus,
    })

    bandStartMonth = endMonth
    bandStartCorpus = endCorpus
    bandStartInvested = endInvested
  }

  return {
    monthlySip,
    stepUpPercent,
    cagrPercent,
    horizonYears,
    finalCorpus,
    totalInvested,
    totalReturns,
    bands,
  }
}
