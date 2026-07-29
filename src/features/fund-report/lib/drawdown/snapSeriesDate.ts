export function snapToNearestSeriesDate(dates: string[], targetDate: string): string {
  if (dates.length === 0) return targetDate
  if (dates.includes(targetDate)) return targetDate

  const targetMs = Date.parse(targetDate)
  let best = dates[0]!
  let bestDiff = Math.abs(Date.parse(best) - targetMs)

  for (const date of dates) {
    const diff = Math.abs(Date.parse(date) - targetMs)
    if (diff < bestDiff) {
      best = date
      bestDiff = diff
    }
  }

  return best
}
