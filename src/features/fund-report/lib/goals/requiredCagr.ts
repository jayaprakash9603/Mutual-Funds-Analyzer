export type RequiredCagrCell = {
  multiple: number
  years: number
  cagrPercent: number
}

export type RequiredCagrGrid = {
  multiples: readonly number[]
  horizonsYears: readonly number[]
  rows: RequiredCagrCell[][]
}

const MULTIPLES = Array.from({ length: 19 }, (_, index) => index + 2)
const HORIZONS_YEARS = Array.from({ length: 19 }, (_, index) => index + 2)

export function requiredCagr(multiple: number, years: number): number {
  if (multiple <= 0 || years <= 0) {
    return 0
  }

  return (Math.pow(multiple, 1 / years) - 1) * 100
}

export function buildRequiredCagrGrid(): RequiredCagrGrid {
  const rows = MULTIPLES.map((multiple) =>
    HORIZONS_YEARS.map((years) => ({
      multiple,
      years,
      cagrPercent: requiredCagr(multiple, years),
    })),
  )

  return {
    multiples: MULTIPLES,
    horizonsYears: HORIZONS_YEARS,
    rows,
  }
}
