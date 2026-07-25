import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { GoldenTriangleResult } from '@/lib/analytics/types'

interface RiskMeterProps {
  result: GoldenTriangleResult
}

const riskColors: Record<string, 'success' | 'secondary' | 'warning' | 'danger'> = {
  'Very Low': 'success',
  Low: 'success',
  Medium: 'warning',
  High: 'danger',
  'Very High': 'danger',
}

export function RiskMeter({ result }: RiskMeterProps) {
  const vol = result.metrics.fundVolatility
  const pct = Math.min(100, vol * 4)

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Risk Analysis</CardTitle>
        <Badge variant={riskColors[result.metrics.riskLevel] ?? 'secondary'}>
          {result.metrics.riskLevel}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low</span>
            <span>High</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Annualised volatility: {vol.toFixed(2)}%
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

interface PerformanceTimelineProps {
  events: { title: string; date: string; description: string }[]
}

export function PerformanceTimeline({ events }: PerformanceTimelineProps) {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Performance Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-6 border-l border-border pl-6">
          {events.map((event, i) => (
            <motion.li
              key={event.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
              <p className="text-xs font-medium uppercase tracking-wide text-primary">{event.date}</p>
              <p className="mt-1 font-medium">{event.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
            </motion.li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
