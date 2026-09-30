import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useCountUp } from '@/hooks/useCountUp'
import { useLandingSample, type LandingSample } from '@/hooks/useLandingSample'
import { cn } from '@/lib/utils'
import { CRITERIA } from './criteria'
import { EASE, revealUp, VIEWPORT_ONCE } from './motion'
import { PerformanceCurve } from './PerformanceCurve'
import { RevealLine } from './RevealLine'
import { SectionLabel } from './SectionLabel'

const shortName = (name: string) => name.split(' - ')[0]

function ruleFormat(id: string) {
  if (id === 'sharpe') return { decimals: 2, suffix: '' }
  if (id === 'cob') return { decimals: 0, suffix: '%' }
  return { decimals: 2, suffix: '%' }
}

function RuleRow({ rule, start, index }: { rule: LandingSample['rules'][number]; start: boolean; index: number }) {
  const { decimals, suffix } = ruleFormat(rule.id)
  const fund = useCountUp(rule.fundValue, { decimals, start })
  const benchmark = rule.id === 'cob' ? '> 70%' : `${rule.benchmarkValue.toFixed(decimals)}${suffix}`
  const label = CRITERIA.find((c) => c.id === rule.id)?.title ?? rule.label

  return (
    <motion.li
      initial={{ opacity: 0, x: 24 }}
      animate={start ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: 0.7, delay: 0.3 + index * 0.12, ease: EASE }}
      className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-border/60 py-4"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Fund <span className="text-foreground">{fund}{suffix}</span>
          <span className="mx-2 text-border">/</span>
          {rule.id === 'cob' ? 'Needs' : 'Benchmark'} {benchmark}
        </p>
      </div>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wider',
          rule.passed ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive',
        )}
      >
        {rule.passed ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
        {rule.passed ? 'Pass' : 'Fail'}
      </span>
    </motion.li>
  )
}

function Scorecard({ sample, start }: { sample: LandingSample; start: boolean }) {
  const annual = useCountUp(sample.metrics.fundAnnReturn, { decimals: 1, start })
  const drawdown = useCountUp(Math.abs(sample.metrics.maxDrawdown), { decimals: 1, start })

  return (
    <div className="glass flex h-full flex-col rounded-2xl p-6 sm:p-7">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{sample.category}</p>
      <h3 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{shortName(sample.fundName)}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        vs {sample.benchmarkName} · {sample.period} rolling windows
      </p>

      <div className="mt-6 flex items-end gap-4">
        <p className="font-display text-7xl leading-none text-gold">
          {sample.passCount}
          <span className="text-4xl text-muted-foreground">/3</span>
        </p>
        <p className="pb-2 text-sm leading-snug text-muted-foreground">
          {sample.passCount === 3 ? 'Passed all three' : `Passed ${sample.passCount} of three`}
          <br />
          Golden Triangle tests
        </p>
      </div>

      <ul className="mt-6">
        {sample.rules.map((rule, index) => (
          <RuleRow key={rule.id} rule={rule} start={start} index={index} />
        ))}
      </ul>

      <dl className="mt-2 grid grid-cols-2 gap-4 border-t border-border/60 pt-4">
        <div>
          <dt className="text-xs text-muted-foreground">Annualised return</dt>
          <dd className="mt-1 font-mono text-xl font-semibold tabular-nums">
            {annual}%
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              vs {sample.metrics.benchmarkAnnReturn.toFixed(1)}%
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Max drawdown</dt>
          <dd className="mt-1 font-mono text-xl font-semibold tabular-nums">
            -{drawdown}%
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              vs {sample.metrics.benchmarkMaxDrawdown.toFixed(1)}%
            </span>
          </dd>
        </div>
      </dl>

      <Link
        to={`/fund?scheme=${encodeURIComponent(sample.fundName)}`}
        className="group mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-primary"
      >
        Open the full report
        <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </div>
  )
}

export function FundShowcase() {
  const ref = useRef<HTMLElement>(null)
  const near = useInView(ref, { once: true, margin: '600px 0px' })
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const sample = useLandingSample(near)

  return (
    <section ref={ref} className="mx-auto w-full max-w-[84rem] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <SectionLabel index="03">A real example</SectionLabel>
          <h2 className="mt-5 font-display text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.95] tracking-[-0.01em]">
            <RevealLine>One fund.</RevealLine>
            <RevealLine delay={0.1}>
              <em className="text-primary">Every</em> start date.
            </RevealLine>
          </h2>
        </div>
        <motion.p
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          className="max-w-md text-muted-foreground lg:col-span-5"
        >
          Here is how the analyzer scores a well-known flexi cap fund against its benchmark, using the same
          captured data as the demo report. Illustrative only, and past performance does not guarantee future
          returns.
        </motion.p>
      </div>

      <div className="mt-14 grid gap-5 lg:grid-cols-12">
        <motion.div
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          className="lg:col-span-7"
        >
          {sample === undefined ? (
            <Skeleton className="aspect-[4/3.6] w-full rounded-2xl" />
          ) : (
            <PerformanceCurve
              className="h-full"
              series={sample?.series}
              title={sample ? `Growth of \u20b91,00,000 since ${sample.startYear}` : undefined}
              badge={sample ? 'Illustrative · past performance' : undefined}
              fundLabel={sample ? shortName(sample.fundName) : undefined}
              benchmarkLabel={sample?.benchmarkName}
            />
          )}
        </motion.div>
        <motion.div
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          custom={0.12}
          className="lg:col-span-5"
        >
          {sample ? (
            <Scorecard sample={sample} start={inView} />
          ) : (
            <Skeleton className="h-full min-h-[28rem] w-full rounded-2xl" />
          )}
        </motion.div>
      </div>
    </section>
  )
}
