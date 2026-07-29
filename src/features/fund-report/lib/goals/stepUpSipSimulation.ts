const MAX_SIMULATION_MONTHS = 12 * 100

export type StepUpSipMonthSnapshot = {
  month: number
  sip: number
  invested: number
  corpus: number
}

export function resolveStepUpSipAmount(
  initialSip: number,
  instalmentIndex: number,
  stepUpPercent: number,
): number {
  const completedYears = Math.floor(instalmentIndex / 12)
  let amount = initialSip

  for (let year = 0; year < completedYears; year += 1) {
    amount = Math.round(amount * (1 + stepUpPercent / 100))
  }

  return Math.max(1, amount)
}

export function monthlyGrowthRate(cagrPercent: number): number {
  return cagrPercent / 100 / 12
}

export function simulateStepUpSip(
  monthlySip: number,
  stepUpPercent: number,
  cagrPercent: number,
  horizonMonths: number,
): StepUpSipMonthSnapshot[] {
  const monthlyRate = monthlyGrowthRate(cagrPercent)
  const timeline: StepUpSipMonthSnapshot[] = []
  let corpus = 0
  let invested = 0

  for (let month = 1; month <= horizonMonths; month += 1) {
    const sip = resolveStepUpSipAmount(monthlySip, month - 1, stepUpPercent)
    invested += sip
    corpus = (corpus + sip) * (1 + monthlyRate)
    timeline.push({ month, sip, invested, corpus })
  }

  return timeline
}

export function monthsToTargetCorpus(
  monthlySip: number,
  target: number,
  cagrPercent: number,
  stepUpPercent: number,
): number {
  if (monthlySip <= 0 || target <= 0) {
    return 0
  }

  const monthlyRate = monthlyGrowthRate(cagrPercent)
  let corpus = 0
  let months = 0

  while (corpus < target && months < MAX_SIMULATION_MONTHS) {
    months += 1
    const sip = resolveStepUpSipAmount(monthlySip, months - 1, stepUpPercent)
    corpus = (corpus + sip) * (1 + monthlyRate)
  }

  return months
}
