import { cn } from '@/lib/utils'

export type ChartRangeOption<T extends string> = {
  id: T
  label: string
  disabled?: boolean
}

type ChartRangeToggleProps<T extends string> = {
  options: ReadonlyArray<ChartRangeOption<T>>
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

export function ChartRangeToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: ChartRangeToggleProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex flex-wrap items-center justify-center gap-1 px-0.5 py-1 sm:gap-1.5"
    >
      {options.map((option) => {
        const active = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            disabled={option.disabled}
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={cn(
              'rounded-full border px-2 py-1 text-[11px] font-semibold transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3.5 sm:py-1.5 sm:text-sm',
              active
                ? 'border-brand bg-brand/12 text-brand'
                : 'border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground',
              option.disabled && 'cursor-not-allowed opacity-40 hover:bg-muted/30 hover:text-muted-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
