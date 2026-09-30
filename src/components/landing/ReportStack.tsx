import { useRef, type ReactNode, type RefObject } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useFundPicks, type FundPick } from '@/hooks/useFundPicks'
import { cn } from '@/lib/utils'
import { usePickedFund } from './pickedFund'
import { RevealLine } from './RevealLine'
import { SectionLabel } from './SectionLabel'

type Feature = {
  image: string
  tag: string
  title: string
  body: string
  details: string[]
  live: (pick: FundPick, picks: FundPick[]) => string
}

const pct = (value: number) => `${value.toFixed(1)}%`

const FEATURES: Feature[] = [
  {
    image: 'golden-triangle-score',
    tag: 'Scorecard',
    title: 'Golden Triangle verdict',
    body: 'Pass or fail on all three tests, with the numbers behind each one.',
    details: ['Rolling average vs benchmark', 'Windows beaten > 70%', 'Sharpe vs index'],
    live: (p) => `passed ${p.passCount} of 3 tests`,
  },
  {
    image: 'rolling-return-trend',
    tag: 'Performance',
    title: 'Rolling return trends',
    body: 'Every 1, 3, 5, 7 and 10-year window, charted against the benchmark.',
    details: ['1, 3, 5, 7, 10-year windows', 'TRI benchmark', '401 windows since 2013'],
    live: (p) => `${pct(p.rollingAvg)} rolling average vs ${pct(p.benchRollingAvg)} for the index`,
  },
  {
    image: 'sip-analysis',
    tag: 'Investment',
    title: 'SIP, lumpsum, STP and SWP',
    body: 'Simulate real investing plans on actual NAV history, with XIRR for each.',
    details: ['Monthly SIP on real NAVs', 'Lumpsum vs staggered entry', 'XIRR per plan'],
    live: (p) => `${pct(p.annReturn)} a year since ${p.startYear}`,
  },
  {
    image: 'peer-comparison',
    tag: 'Assessment',
    title: 'Category peers',
    body: 'See where the fund ranks among its category peers on the same tests.',
    details: ['Same three tests for every peer', 'Ranked on rolling returns', 'Category averages'],
    live: (p, picks) => {
      const rank = [...picks].sort((a, b) => b.annReturn - a.annReturn).findIndex((f) => f.amc === p.amc) + 1
      return `ranks #${rank} of ${picks.length} fund houses on CAGR`
    },
  },
  {
    image: 'drawdown-analysis',
    tag: 'Risk',
    title: 'Drawdowns and recoveries',
    body: 'How deep it fell, how long it took to recover, and how often it happens.',
    details: ['Deepest fall from peak', 'Months to recover', 'Drawdown frequency'],
    live: (p) => `fell ${pct(Math.abs(p.maxDrawdown))} at worst vs ${pct(Math.abs(p.benchMaxDrawdown))} for the index`,
  },
  {
    image: 'ai-insights',
    tag: 'Insights',
    title: 'Plain-language takeaways',
    body: 'Meeting-ready conclusions you can paste straight into a client deck.',
    details: ['Verdict in one line', 'Strengths and watch-outs', 'Copy-ready for decks'],
    live: (p) => `beat the index in ${p.cob.toFixed(0)}% of windows`,
  },
]

const TINTS = [0, 3, 6, 9, 12, 15]

function shortName(name: string) {
  return name.replace(/\s*-\s*(Direct|Regular|Growth).*$/i, '').replace(/\s+Fund$/i, '')
}

function Heading() {
  return (
    <div>
      <SectionLabel index="05">Inside the report</SectionLabel>
      <h2 className="mt-5 font-display text-[clamp(2.6rem,5.5vw,5rem)] leading-[0.95] tracking-[-0.01em]">
        <RevealLine>Everything a fund</RevealLine>
        <RevealLine delay={0.1}>
          <em className="text-primary">review meeting</em> needs.
        </RevealLine>
      </h2>
    </div>
  )
}

function Screenshot({ feature, animate }: { feature: Feature; animate: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 30%'] })
  const scale = useTransform(scrollYProgress, [0, 1], [1.25, 1])

  return (
    <div ref={ref} className="relative order-first flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-muted lg:order-none">
      <div className="flex items-center gap-1.5 border-b border-border/60 bg-card px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-destructive/60" />
        <span className="size-2.5 rounded-full bg-gold/70" />
        <span className="size-2.5 rounded-full bg-primary/70" />
        <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{feature.tag}</span>
      </div>
      <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:flex-1">
        <motion.img
          src={`${import.meta.env.BASE_URL}landing/${feature.image}.webp`}
          alt={`${feature.title} section of an Analyzer fund report`}
          loading="lazy"
          decoding="async"
          style={animate ? { scale } : undefined}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      </div>
    </div>
  )
}

function CardBody({ feature, index }: { feature: Feature; index: number }) {
  const { pick } = usePickedFund()
  const picks = useFundPicks()

  return (
    <div className="relative flex min-w-0 flex-col justify-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
          0{index + 1} · {feature.tag}
        </p>
        <h3 className="mt-3 font-display text-[clamp(2rem,4vw,3.8rem)] leading-[0.95] tracking-[-0.02em]">
          {feature.title}
        </h3>
        <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-muted-foreground sm:text-base">{feature.body}</p>
        <ul className="mt-5 border-t border-border/60 lg:mt-8">
          {feature.details.map((detail, i) => (
            <li
              key={detail}
              className={cn(
                'border-b border-border/60 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/85 lg:py-3',
                i === 2 && 'hidden lg:block',
              )}
            >
              {detail}
            </li>
          ))}
        </ul>
        {pick && (
          <p className="mt-5 inline-flex max-w-full items-center gap-2 self-start rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-foreground lg:mt-7">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
            <span className="truncate">
              <span className="font-semibold">{shortName(pick.fundName)}</span> · {feature.live(pick, picks)}
            </span>
          </p>
        )}
    </div>
  )
}

const CARD_CLASS =
  'relative grid gap-5 overflow-hidden rounded-[28px] border border-border/70 p-4 sm:p-6 lg:min-h-[72vh] lg:grid-cols-[1fr_1.25fr] lg:gap-12 lg:p-10'

function ClosingBody() {
  return (
    <Link to="/fund" className="group col-span-full flex flex-col justify-between gap-10 text-primary-foreground">
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">And much more</span>
      <span className="max-w-[18ch] font-display text-[clamp(2.4rem,6vw,6rem)] leading-[0.92] tracking-[-0.02em]">
        Dozens more charts, tables and matrices.
      </span>
      <span className="inline-flex items-center gap-2 font-medium">
        Open a report
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  )
}

type StackCardProps = {
  index: number
  nextRef: RefObject<HTMLDivElement | null> | null
  cardRef: RefObject<HTMLDivElement | null>
  closing?: boolean
  children: ReactNode
}

function StackCard({ index, nextRef, cardRef, closing, children }: StackCardProps) {
  const { scrollYProgress } = useScroll({
    target: nextRef ?? cardRef,
    offset: ['start end', 'start 20%'],
  })
  const progress = nextRef !== null
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9 + index * 0.015])
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-2%'])
  const shade = useTransform(scrollYProgress, [0, 1], [0, 0.5])

  return (
    <div
      ref={cardRef}
      className="sticky mb-[6vh] last:mb-0"
      style={{ top: `calc(var(--app-chrome-offset) + 4vh + ${index} * 1.2rem)`, zIndex: index + 1 }}
    >
      <motion.article
        style={progress ? { scale, y, transformOrigin: 'center top' } : undefined}
        className={cn(
          CARD_CLASS,
          closing ? 'bg-primary lg:min-h-[56vh]' : 'bg-background',
          'shadow-2xl shadow-black/20',
        )}
      >
        {!closing && (
          <span
            className="pointer-events-none absolute inset-0 bg-card"
            style={{
              backgroundImage: `linear-gradient(color-mix(in oklch, var(--primary) ${TINTS[index % TINTS.length] * 0.35}%, transparent), transparent)`,
            }}
            aria-hidden
          />
        )}
        {children}
        {progress && (
          <motion.span className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: shade }} aria-hidden />
        )}
      </motion.article>
    </div>
  )
}

function StackAnimated() {
  const refs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ]
  return (
    <div>
      {FEATURES.map((feature, index) => (
        <StackCard key={feature.image} index={index} cardRef={refs[index]} nextRef={refs[index + 1]}>
          <CardBody feature={feature} index={index} />
          <Screenshot feature={feature} animate />
        </StackCard>
      ))}
      <StackCard index={FEATURES.length} cardRef={refs[FEATURES.length]} nextRef={null} closing>
        <ClosingBody />
      </StackCard>
    </div>
  )
}

function StackStatic() {
  return (
    <div className="space-y-5">
      {FEATURES.map((feature, index) => (
        <article key={feature.image} className={cn(CARD_CLASS, 'bg-card lg:min-h-0')}>
          <span className="pointer-events-none absolute inset-0 bg-card" aria-hidden />
          <CardBody feature={feature} index={index} />
          <Screenshot feature={feature} animate={false} />
        </article>
      ))}
      <article className={cn(CARD_CLASS, 'bg-primary lg:min-h-0')}>
        <ClosingBody />
      </article>
    </div>
  )
}

export function ReportStack() {
  const reduceMotion = useReducedMotion()
  return (
    <section className="mx-auto w-full max-w-[84rem] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <Heading />
      <div className="mt-12 lg:mt-16">{reduceMotion ? <StackStatic /> : <StackAnimated />}</div>
    </section>
  )
}
