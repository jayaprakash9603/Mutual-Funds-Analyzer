export function formatDurationMonths(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  return `${years}Y${months}M`
}

export function formatDurationYears(years: number): string {
  const wholeYears = Math.floor(years)
  let months = Math.round((years - wholeYears) * 12)
  let adjustedYears = wholeYears

  if (months === 12) {
    adjustedYears += 1
    months = 0
  }

  return `${adjustedYears}Y${months}M`
}
