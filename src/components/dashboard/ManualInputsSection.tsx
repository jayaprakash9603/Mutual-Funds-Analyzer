import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { manualInputsSchema, type ManualInputsForm } from '@/api/schemas'
import { Info } from 'lucide-react'

interface ManualInputsSectionProps {
  values: ManualInputsForm
  onChange: (values: ManualInputsForm) => void
  fundAgeYears?: number
}

/** Keeps cleared fields as undefined instead of NaN, which would override real metrics. */
function toOptionalNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function ManualInputsSection({ values, onChange, fundAgeYears }: ManualInputsSectionProps) {
  const { register, watch } = useForm<ManualInputsForm>({
    resolver: zodResolver(manualInputsSchema),
    defaultValues: values,
  })

  const watched = watch()

  const handleBlur = () => {
    onChange(watched)
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Manual Inputs</CardTitle>
        <CardDescription>
          Fields not provided by the API. Optional overrides for advanced analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="Expense Ratio (%)"
          id="expenseRatio"
          placeholder="Not provided by API"
          register={register('expenseRatio', { setValueAs: toOptionalNumber, onBlur: handleBlur })}
          notProvided={values.expenseRatio === undefined}
        />
        <Field
          label="Benchmark Expense Ratio (%)"
          id="benchmarkExpenseRatio"
          placeholder="Optional"
          register={register('benchmarkExpenseRatio', { setValueAs: toOptionalNumber, onBlur: handleBlur })}
        />
        <Field
          label="AUM (₹ Crores)"
          id="aum"
          placeholder="Not provided by API"
          register={register('aum', { setValueAs: toOptionalNumber, onBlur: handleBlur })}
          notProvided={values.aum === undefined}
        />
        <Field
          label="Fund Rating (1-5)"
          id="fundRating"
          placeholder="Not provided by API"
          register={register('fundRating', { setValueAs: toOptionalNumber, onBlur: handleBlur })}
          notProvided={values.fundRating === undefined}
        />
        <div className="space-y-2">
          <Label>Fund Age (years)</Label>
          <Input
            readOnly
            value={fundAgeYears !== undefined ? fundAgeYears.toFixed(1) : 'Computed from NAV data'}
            className="bg-muted/40"
          />
        </div>
        <Field
          label="COB Override (%)"
          id="cobOverride"
          placeholder="Optional override"
          register={register('cobOverride', { setValueAs: toOptionalNumber, onBlur: handleBlur })}
        />
        <Field
          label="Fund Sharpe Override"
          id="fundSharpeOverride"
          placeholder="Optional override"
          register={register('fundSharpeOverride', { setValueAs: toOptionalNumber, onBlur: handleBlur })}
        />
        <Field
          label="Benchmark Sharpe Override"
          id="benchmarkSharpeOverride"
          placeholder="Optional override"
          register={register('benchmarkSharpeOverride', { setValueAs: toOptionalNumber, onBlur: handleBlur })}
        />
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  id,
  placeholder,
  register,
  notProvided,
}: {
  label: string
  id: string
  placeholder: string
  register: UseFormRegisterReturn
  notProvided?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" step="0.01" placeholder={placeholder} {...register} />
      {notProvided && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="h-3 w-3" aria-hidden="true" />
          Not provided by API
        </p>
      )}
    </div>
  )
}
