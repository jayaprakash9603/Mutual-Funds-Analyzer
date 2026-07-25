import { z } from 'zod'

export const rollingReturnRowSchema = z.object({
  id: z.number(),
  scheme_company: z.string().optional(),
  scheme_category: z.string().optional().default(''),
  scheme_name: z.string(),
  period: z.string().optional(),
  nav_date: z.string(),
  scheme_nav: z.number(),
  scheme_forward_date: z.string(),
  scheme_forward_nav: z.number(),
  scheme_rolling_returns: z.number(),
})

export type RollingReturnRow = z.infer<typeof rollingReturnRowSchema>

export function normalizeRollingRows(
  rows: unknown[],
  period: string,
): RollingReturnRow[] {
  return rows.map((row) => {
    const r = row as Record<string, unknown>
    return rollingReturnRowSchema.parse({
      ...r,
      period: typeof r.period === 'string' ? r.period : period,
      scheme_category: typeof r.scheme_category === 'string' ? r.scheme_category : '',
    })
  })
}

export const schemesResponseSchema = z.array(z.string())

export type RollingReturnsResponse = {
  fund: RollingReturnRow[]
  benchmark: RollingReturnRow[]
}

export const manualInputsSchema = z.object({
  expenseRatio: z.number().min(0).max(10).optional(),
  benchmarkExpenseRatio: z.number().min(0).max(10).optional(),
  aum: z.number().min(0).optional(),
  fundRating: z.number().min(1).max(5).optional(),
  fundRollingAvgOverride: z.number().optional(),
  benchmarkRollingAvgOverride: z.number().optional(),
  cobOverride: z.number().min(0).max(100).optional(),
  fundSharpeOverride: z.number().optional(),
  benchmarkSharpeOverride: z.number().optional(),
})

export type ManualInputsForm = z.infer<typeof manualInputsSchema>
