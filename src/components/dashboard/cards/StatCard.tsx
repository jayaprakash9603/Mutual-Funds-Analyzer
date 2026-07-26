import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedNumber } from '../widgets/AnimatedNumber'

interface StatCardProps {
  label: string
  value: number
  display?: string
  suffix?: string
  format?: 'percent' | 'decimal' | 'text'
  index?: number
}

export function StatCard({ label, value, display, suffix = '', format = 'decimal', index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <Card className="glass-hover">
        <CardContent className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <div className="mt-2 text-2xl font-semibold">
            {format === 'text' ? (
              <span>{display}</span>
            ) : (
              <AnimatedNumber
                value={value}
                suffix={suffix}
                decimals={format === 'percent' ? 2 : 2}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
