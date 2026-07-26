import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedNumberProps {
  value: number
  suffix?: string
  decimals?: number
  className?: string
}

export function AnimatedNumber({ value, suffix = '', decimals = 2, className }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => `${v.toFixed(decimals)}${suffix}`)

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.8, ease: 'easeOut' })
    return controls.stop
  }, [value, motionValue])

  return <motion.span className={cn('font-mono tabular-nums', className)}>{rounded}</motion.span>
}
