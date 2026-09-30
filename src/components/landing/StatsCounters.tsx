import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useCountUp } from '@/hooks/useCountUp'
import { useLandingSample } from '@/hooks/useLandingSample'
import { EASE } from './motion'
import { SectionLabel } from './SectionLabel'

type Stat = { value: number; prefix?: string; suffix?: string; label: string }

function StatItem({ stat, start, index }: { stat: Stat; start: boolean; index: number }) {
  const value = useCountUp(stat.value, { start, duration: 1800 })
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={start ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, delay: index * 0.1, ease: EASE }}
      className="border-border/70 py-8 sm:px-6 sm:first:pl-0 lg:border-l lg:first:border-l-0"
    >
      <p className="font-display text-[clamp(4rem,8vw,7rem)] leading-none tabular-nums">
        {stat.prefix}
        {value}
        {stat.suffix && <span className="text-primary">{stat.suffix}</span>}
      </p>
      <p className="mt-3 max-w-[15rem] text-sm text-muted-foreground">{stat.label}</p>
    </motion.div>
  )
}

export function StatsCounters() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.35 })
  const sample = useLandingSample(inView)

  const stats: Stat[] = [
    { value: 3, label: 'Benchmark tests every fund has to pass' },
    { value: 70, prefix: '>', suffix: '%', label: 'Share of rolling windows a fund must win' },
    { value: 5, label: 'Rolling horizons, from one to ten years' },
    {
      value: sample?.windows ?? 401,
      label: `Five-year windows tested for the example fund since ${sample?.startYear ?? 2013}`,
    },
  ]

  return (
    <section ref={ref} className="mx-auto w-full max-w-[84rem] px-4 py-24 sm:px-6 lg:px-8">
      <SectionLabel index="07">By the numbers</SectionLabel>
      <div className="mt-8 grid border-t border-border/70 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatItem key={stat.label} stat={stat} start={inView} index={index} />
        ))}
      </div>
    </section>
  )
}
