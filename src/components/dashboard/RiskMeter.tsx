import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { GoldenTriangleResult } from '@/lib/analytics/types'
import { RISK_LEVELS, VOLATILITY_ELEVATED, VOLATILITY_HIGH } from '@/lib/constants'

interface RiskMeterProps {
  result: GoldenTriangleResult
}

type BadgeVariant = 'success' | 'warning' | 'danger'

const MAX_METER_PERCENT = 100
const METER_SCALE = 4

function badgeVariant(label: string): BadgeVariant {
  const level = RISK_LEVELS.find((entry) => entry.label === label)
  if (!level) return 'warning'
  if (level.maxVol <= VOLATILITY_ELEVATED) return 'success'
  if (level.maxVol <= VOLATILITY_HIGH) return 'warning'
  return 'danger'
}

export function RiskMeter({ result }: RiskMeterProps) {
  const vol = result.metrics.fundVolatility
  const pct = Math.min(MAX_METER_PERCENT, vol * METER_SCALE)

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Risk Analysis</CardTitle>
        <Badge variant={badgeVariant(result.metrics.riskLevel)}>
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
