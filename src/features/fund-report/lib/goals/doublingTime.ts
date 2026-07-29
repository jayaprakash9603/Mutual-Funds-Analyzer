export type DoublingTimePoint = {
  cagrPercent: number
  yearsToDouble: number
}

export function yearsToDouble(cagrPercent: number): number {
  if (cagrPercent <= 0) {
    return Number.POSITIVE_INFINITY
  }

  const rate = cagrPercent / 100
  return Math.log(2) / Math.log(1 + rate)
}

export function buildDoublingTimeSeries(): DoublingTimePoint[] {
  return Array.from({ length: 25 }, (_, index) => {
    const cagrPercent = index + 1
    return {
      cagrPercent,
      yearsToDouble: yearsToDouble(cagrPercent),
    }
  })
}
