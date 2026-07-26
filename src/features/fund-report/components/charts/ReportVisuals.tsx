import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'

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

export function VerdictBadge({ verdict, confidence }: { verdict: string; confidence: number }) {
  const tone =
    verdict === 'Strong Buy' || verdict === 'Buy'
      ? 'bg-primary/15 text-primary border-primary/30'
      : verdict === 'Avoid'
        ? 'bg-destructive/15 text-destructive border-destructive/30'
        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'

  return (
    <div className={`inline-flex flex-col items-center rounded-xl border px-6 py-4 ${tone}`}>
      <span className="text-2xl font-bold">{verdict}</span>
      <span className="text-sm opacity-80">{confidence}% confidence</span>
    </div>
  )
}

import { CHART_COLORS } from '@/lib/charts/chartColors'

export function GaugeMeter({ score, label }: { score: number; label: string }) {
  const pct = Math.min(100, Math.max(0, score))
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative flex size-36 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${CHART_COLORS.fund} ${pct * 3.6}deg, ${CHART_COLORS.track} 0deg)`,
        }}
      >
        <div className="flex size-28 flex-col items-center justify-center rounded-full bg-card">
          <span className="font-mono text-3xl font-bold">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
