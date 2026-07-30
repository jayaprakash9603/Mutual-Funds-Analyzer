import { motion } from 'framer-motion'
import { AppMetricCard } from '@/components/ui/AppMetricCard'
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
      <AppMetricCard
        label={label}
        size="md"
        valueVariant={format === 'text' ? 'text' : 'numeric'}
        value={
          format === 'text' ? (
            display
          ) : (
            <AnimatedNumber value={value} suffix={suffix} decimals={format === 'percent' ? 2 : 2} />
          )
        }
      />
    </motion.div>
  )
}
