export function yearsForNextCrore(currentCrores: number, cagrPercent: number): number {
  if (currentCrores <= 0 || cagrPercent <= 0) {
    return 0
  }

  const rate = cagrPercent / 100
  return Math.log((currentCrores + 1) / currentCrores) / Math.log(1 + rate)
}

export type IncrementalCroreRow = {
  fromLabel: string
  toLabel: string
  returnRequiredPercent: number
  yearsRequired: number
}

export function buildIncrementalCroreJourney(cagrPercent: number): IncrementalCroreRow[] {
  const rows: IncrementalCroreRow[] = []
  for (let crore = 1; crore < 10; crore += 1) {
    const returnRequired = ((crore + 1) / crore - 1) * 100
    rows.push({
      fromLabel: `${crore}Cr`,
      toLabel: `${crore + 1}Cr`,
      returnRequiredPercent: returnRequired,
      yearsRequired: yearsForNextCrore(crore, cagrPercent),
    })
  }
  return rows
}
