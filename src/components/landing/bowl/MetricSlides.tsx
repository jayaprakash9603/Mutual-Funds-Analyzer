import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { HORIZONS, type CategoryFund, type FundCategory } from '@/hooks/useCategoryPicks'
import { cn } from '@/lib/utils'
import { fundBadge } from './amcs'
import { EASE } from '../motion'

const SLIDE_MS = 2600

function signed(value: number, digits = 1, unit = '%') {
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}${unit}`
}

function SlideHead({ label, value, badge }: { label: string; value: string; badge?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums sm:text-[1.7rem]">{value}</p>
      </div>
      {badge && (
        <span className="shrink-0 rounded-md bg-primary/12 px-2 py-1 font-mono text-xs font-semibold text-primary">
          {badge}
        </span>
      )}
    </div>
  )
}

function Bar({ label, value, pct, tone, delay = 0 }: { label: string; value: string; pct: number; tone: 'fund' | 'index' | 'loss'; delay?: number }) {
  return (
    <div className="grid grid-cols-[3.2rem_1fr_3.4rem] items-center gap-2 font-mono text-[10px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-border/60">
        <motion.span
          className={cn(
            'block h-full rounded-full',
            tone === 'fund' && 'bg-primary',
            tone === 'index' && 'bg-muted-foreground/60',
            tone === 'loss' && 'bg-red-500/80',
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
          transition={{ duration: 0.9, delay: 0.15 + delay, ease: EASE }}
        />
      </span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  )
}

type SlideProps = { fund: CategoryFund; category: FundCategory; peers: CategoryFund[] }

function RollingSlide({ fund, category }: SlideProps) {
  const low = Math.min(0, fund.rollingMin, category.benchRollingMin)
  const high = Math.max(fund.rollingMax, category.benchRollingMax)
  const at = (v: number) => ((v - low) / (high - low)) * 100
  const rows = [
    { label: 'Fund', min: fund.rollingMin, max: fund.rollingMax, avg: fund.rollingAvg, isFund: true },
    { label: 'Index', min: category.benchRollingMin, max: category.benchRollingMax, avg: category.benchRollingAvg, isFund: false },
  ]
  return (
    <>
      <SlideHead
        label={`${category.period} rolling return avg`}
        value={`${fund.rollingAvg.toFixed(1)}%`}
        badge={`${signed(fund.rollingAvg - category.benchRollingAvg)} vs index`}
      />
      <div className="mt-3 space-y-2.5">
        {rows.map((row, i) => (
          <div key={row.label} className="grid grid-cols-[3.2rem_1fr] items-center gap-2 font-mono text-[10px]">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="relative h-1.5 rounded-full bg-border/60">
              <motion.span
                className={cn('absolute inset-y-0 rounded-full', row.isFund ? 'bg-primary/60' : 'bg-muted-foreground/40')}
                style={{ left: `${at(row.min)}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${at(row.max) - at(row.min)}%` }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: EASE }}
              />
              <motion.span
                className={cn(
                  'absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-background',
                  row.isFund ? 'bg-primary' : 'bg-muted-foreground',
                )}
                style={{ left: `${at(row.avg)}%` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.8 + i * 0.12 }}
              />
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 font-mono text-[10px] text-muted-foreground">
        Range {fund.rollingMin.toFixed(1)}% to {fund.rollingMax.toFixed(1)}% vs {category.benchmark}
      </p>
    </>
  )
}

function ConsistencySlide({ fund, category }: SlideProps) {
  const cells = 40
  const won = Math.round((fund.cob / 100) * cells)
  return (
    <>
      <SlideHead label="Beat the index in" value={`${fund.cob.toFixed(0)}%`} badge="Needs > 70%" />
      <div className="mt-3 grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[3px]">
        {Array.from({ length: cells }, (_, i) => (
          <motion.span
            key={i}
            className={cn('h-2.5 rounded-[2px]', i < won ? 'bg-primary' : 'bg-red-500/60')}
            initial={{ opacity: 0, scaleY: 0.2 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.3, delay: 0.1 + i * 0.018 }}
          />
        ))}
      </div>
      <p className="mt-2.5 font-mono text-[10px] text-muted-foreground">
        of rolling {category.period.toLowerCase()} windows vs {category.benchmark}
      </p>
    </>
  )
}

function RiskSlide({ fund, category }: SlideProps) {
  const top = Math.max(fund.sharpe, category.benchSharpe) * 1.1
  return (
    <>
      <SlideHead
        label="Sharpe ratio · return per risk"
        value={fund.sharpe.toFixed(2)}
        badge={`${signed(fund.sharpe - category.benchSharpe, 2, '')} vs index`}
      />
      <div className="mt-3 space-y-2">
        <Bar label="Fund" value={fund.sharpe.toFixed(2)} pct={(fund.sharpe / top) * 100} tone="fund" />
        <Bar label="Index" value={category.benchSharpe.toFixed(2)} pct={(category.benchSharpe / top) * 100} tone="index" delay={0.1} />
      </div>
      <p className="mt-2.5 font-mono text-[10px] text-muted-foreground">
        Std dev {fund.stdDev.toFixed(1)}% · worst fall {fund.maxDrawdown.toFixed(1)}% vs {category.benchMaxDrawdown.toFixed(1)}% index
      </p>
    </>
  )
}

function ReturnSlide({ fund }: SlideProps) {
  const values = HORIZONS.flatMap((h) => {
    const value = fund.horizons[h.key]
    return value === null ? [] : [{ label: h.label, value }]
  })
  const top = Math.max(...values.map((v) => v.value), 1)
  const longest = values.at(-1)
  return (
    <>
      <SlideHead label="Average CAGR by holding period" value={longest ? `${longest.value.toFixed(1)}%` : '-'} badge={longest?.label} />
      <div className="mt-3 space-y-1.5">
        {values.map((v, i) => (
          <Bar key={v.label} label={v.label} value={`${v.value.toFixed(1)}%`} pct={(v.value / top) * 100} tone="fund" delay={i * 0.08} />
        ))}
      </div>
    </>
  )
}

function CompareSlide({ fund, peers }: SlideProps) {
  const rows = [
    { label: 'Rolling', value: (f: CategoryFund) => f.rollingAvg, format: (v: number) => `${v.toFixed(1)}%` },
    { label: 'Beat idx', value: (f: CategoryFund) => f.cob, format: (v: number) => `${v.toFixed(0)}%` },
    { label: 'Sharpe', value: (f: CategoryFund) => f.sharpe, format: (v: number) => v.toFixed(2) },
    { label: 'Worst fall', value: (f: CategoryFund) => f.maxDrawdown, format: (v: number) => `${v.toFixed(0)}%` },
  ]
  return (
    <>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        Top {peers.length} winners, rule by rule
      </p>
      <table className="mt-1 w-full font-mono text-[10px] tabular-nums sm:mt-2">
        <thead>
          <tr className="text-muted-foreground">
            <th className="pb-1 text-left font-normal" />
            {peers.map((peer) => (
              <th
                key={peer.id}
                className={cn('truncate pb-1 text-right font-semibold', peer.id === fund.id ? 'text-foreground' : 'font-normal')}
              >
                {fundBadge(peer)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => {
            const best = Math.max(...peers.map(row.value))
            return (
              <motion.tr
                key={row.label}
                className="border-t border-border/50"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + r * 0.07 }}
              >
                <td className="py-0.5 text-muted-foreground sm:py-1">{row.label}</td>
                {peers.map((peer) => {
                  const value = row.value(peer)
                  return (
                    <td
                      key={peer.id}
                      className={cn(
                        'py-0.5 text-right sm:py-1',
                        value === best ? 'text-gold' : 'text-foreground/80',
                        peer.id === fund.id && 'bg-primary/10',
                      )}
                    >
                      {row.format(value)}
                    </td>
                  )
                })}
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}

type Slide = { id: string; title: string; Component: (props: SlideProps) => ReactNode }

const SLIDES: Slide[] = [
  { id: 'rolling', title: 'Rolling', Component: RollingSlide },
  { id: 'consistency', title: 'Consistency', Component: ConsistencySlide },
  { id: 'risk', title: 'Sharpe', Component: RiskSlide },
  { id: 'return', title: 'Returns', Component: ReturnSlide },
]
const COMPARE_SLIDES: Slide[] = [{ id: 'compare', title: 'Compare', Component: CompareSlide }, ...SLIDES]

export function MetricSlides({ fund, category, peers }: SlideProps) {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const slides = peers.length > 1 ? COMPARE_SLIDES : SLIDES
  const count = slides.length
  const active = index % count
  const slide = slides[active]

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS)
    return () => window.clearInterval(id)
  }, [count])

  return (
    <div>
      <div className="relative h-[7.6rem] sm:h-[9.4rem]" style={{ perspective: 900 }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={`${slide.id}-${fund.id}`}
            className="absolute inset-0"
            style={{ transformOrigin: '50% 50% -30px', backfaceVisibility: 'hidden' }}
            initial={reduceMotion ? { opacity: 0 } : { rotateX: -85, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { rotateX: 85, opacity: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <slide.Component fund={fund} category={category} peers={peers} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div
        className="mt-2 grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
        role="tablist"
        aria-label="Fund metrics"
      >
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setIndex(i)}
            className="group text-left"
          >
            <span className="block h-0.5 overflow-hidden rounded-full bg-border/70">
              {i === active ? (
                <motion.span
                  key={`${s.id}-${index}`}
                  className="block h-full bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: SLIDE_MS / 1000, ease: 'linear' }}
                />
              ) : (
                <span className={cn('block h-full', i < active ? 'bg-primary/50' : '')} />
              )}
            </span>
            <span
              className={cn(
                'mt-1 block truncate font-mono text-[8px] uppercase tracking-[0.14em] transition-colors',
                i === active ? 'text-foreground' : 'text-muted-foreground/70 group-hover:text-foreground',
              )}
            >
              {s.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function MetricTicker({ fund }: { fund: CategoryFund }) {
  const items: [string, string][] = [
    ['Rolling avg', `${fund.rollingAvg.toFixed(1)}%`],
    ['Beat index', `${fund.cob.toFixed(0)}%`],
    ['Sharpe', fund.sharpe.toFixed(2)],
    ...HORIZONS.filter((h) => fund.horizons[h.key] !== null).map(
      (h): [string, string] => [`${h.label} CAGR`, `${fund.horizons[h.key]!.toFixed(1)}%`],
    ),
    ['Std dev', `${fund.stdDev.toFixed(1)}%`],
    ['Worst fall', `${fund.maxDrawdown.toFixed(1)}%`],
  ]
  const row = items.map(([label, value]) => (
    <span key={label} className="flex shrink-0 items-center gap-1.5 pr-5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('tabular-nums', value.startsWith('-') ? 'text-red-500' : 'text-foreground')}>{value}</span>
      <span className="pl-3 text-primary/60">◆</span>
    </span>
  ))
  return (
    <div
      className="overflow-hidden border-y border-border/50 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em]"
      style={{ maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)' }}
      aria-hidden
    >
      <div className="landing-marquee flex w-max" style={{ animationDuration: '22s' }}>
        <div className="flex">{row}</div>
        <div className="flex">{row}</div>
      </div>
    </div>
  )
}
