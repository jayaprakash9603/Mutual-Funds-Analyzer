import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export function ProbabilityBar({ label, value, explanation }: { label: string; value: number; explanation?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono font-medium"
        >
          {value.toFixed(0)}%
        </motion.span>
      </div>
      <Progress value={Math.min(100, Math.max(0, value))} />
      {explanation && <p className="text-xs text-muted-foreground">{explanation}</p>}
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
