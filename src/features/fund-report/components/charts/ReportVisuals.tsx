import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { appMetricCardClasses } from '@/lib/ui/appCardStyles'
import { cn } from '@/lib/utils'

export function ProbabilityBar({ label, value, explanation }: { label: string; value: number; explanation?: string }) {
  return (
    <div className={appMetricCardClasses('md')}>
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 text-xs leading-snug text-foreground sm:text-sm">{label}</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="shrink-0 font-mono text-xs font-semibold tabular-nums sm:text-sm"
        >
          {value.toFixed(0)}%
        </motion.span>
      </div>
      <Progress value={Math.min(100, Math.max(0, value))} className="mt-2 h-1.5 sm:h-2" />
      {explanation ? (
        <p className="mt-1.5 text-[10px] text-muted-foreground sm:text-xs">{explanation}</p>
      ) : null}
    </div>
  )
}

export function VerdictBadge({
  verdict,
  confidence,
  variant = 'default',
}: {
  verdict: string
  confidence: number
  variant?: 'default' | 'inline'
}) {
  const tone =
    verdict === 'Strong Buy' || verdict === 'Buy'
      ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
      : verdict === 'Avoid'
        ? 'border-destructive/35 bg-destructive/10 text-destructive'
        : 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200'

  if (variant === 'inline') {
    return (
      <div className={cn('inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-full border px-4 py-2', tone)}>
        <span className="text-base font-bold tracking-tight sm:text-lg">{verdict}</span>
        <span className="text-sm font-medium opacity-80">{confidence}% confidence</span>
      </div>
    )
  }

  return (
    <div className={cn('inline-flex flex-col items-center rounded-xl border px-6 py-4', tone)}>
      <span className="text-2xl font-bold tracking-tight">{verdict}</span>
      <span className="text-sm font-medium opacity-80">{confidence}% confidence</span>
    </div>
  )
}

export function GaugeMeter({ score, label }: { score: number; label: string }) {
  const pct = Math.min(100, Math.max(0, score))
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative flex size-36 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(var(--chart-gauge-fill) ${pct * 3.6}deg, var(--chart-gauge-track) 0deg)`,
        }}
      >
        <div className="flex size-28 flex-col items-center justify-center rounded-full bg-card text-card-foreground">
          <span className="font-mono text-3xl font-bold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  )
}
