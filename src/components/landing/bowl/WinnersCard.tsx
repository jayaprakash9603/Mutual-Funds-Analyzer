import { motion } from 'framer-motion'
import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { HORIZONS, shortFundName, type CategoryFund, type FundCategory } from '@/hooks/useCategoryPicks'
import { cn } from '@/lib/utils'
import { amcById, fundBadge } from './amcs'
import { MetricSlides, MetricTicker } from './MetricSlides'
import { EASE } from '../motion'

const TEST_NAMES = ['rolling return', 'consistency', 'Sharpe']

function HorizonChart({ funds, active }: { funds: CategoryFund[]; active: CategoryFund }) {
  const values = funds.flatMap((f) => HORIZONS.map((h) => f.horizons[h.key] ?? 0))
  const top = Math.max(...values, 1)
  return (
    <div>
      <div className="grid h-16 grid-cols-4 gap-3" role="img" aria-label="Average CAGR by holding period for the top winners">
        {HORIZONS.map((h, col) => (
          <div key={h.key} className="flex items-end justify-center gap-[3px]">
            {funds.map((fund, i) => {
              const value = fund.horizons[h.key]
              const selected = fund.id === active.id
              return (
                <motion.span
                  key={fund.id}
                  className="w-full max-w-3 rounded-t-[3px]"
                  style={{ background: selected ? 'var(--primary)' : amcById(fund.amc)?.color }}
                  initial={{ height: 0 }}
                  animate={{ height: value === null ? 2 : `${Math.max(4, (value / top) * 100)}%`, opacity: selected ? 1 : 0.45 }}
                  transition={{ height: { duration: 0.8, delay: 0.15 + col * 0.08 + i * 0.04, ease: EASE }, opacity: { duration: 0.4 } }}
                />
              )
            })}
          </div>
        ))}
      </div>
      <p className="mt-1 grid grid-cols-4 gap-3 text-center font-mono text-[9px] text-muted-foreground">
        {HORIZONS.map((h) => (
          <span key={h.key}>
            {h.label} <span className="text-foreground/80">{active.horizons[h.key]?.toFixed(0) ?? '-'}%</span>
          </span>
        ))}
      </p>
    </div>
  )
}

function FieldRow({ category, winnerId }: { category: FundCategory; winnerId: string }) {
  const failed = category.funds.filter((f) => f.failsAt !== null)
  const worst = [1, 2, 3].map((t) => failed.filter((f) => f.failsAt === t).length)
  const biggest = worst.indexOf(Math.max(...worst))
  return (
    <div>
      <div className="flex gap-1.5" role="img" aria-label={`1 of ${category.funds.length} funds passed`}>
        {category.funds.map((fund, i) => {
          const won = fund.id === winnerId
          return (
            <motion.span
              key={fund.id}
              className={cn(
                'grid h-6 flex-1 place-items-center rounded-md font-mono text-[8px] font-semibold',
                won ? 'bg-primary text-primary-foreground' : 'bg-border/50 text-muted-foreground/70',
              )}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.04 }}
            >
              {won ? '✓' : `T${fund.failsAt}`}
            </motion.span>
          )
        })}
      </div>
      <p className="mt-1 font-mono text-[9px] text-muted-foreground">
        {failed.length} failed · most at the {TEST_NAMES[biggest]} test ({worst[biggest]})
      </p>
    </div>
  )
}

function MorePill({ funds }: { funds: CategoryFund[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        className="rounded-full border border-gold/40 bg-gold/10 px-2 py-1 font-mono text-[10px] font-semibold text-gold"
      >
        +{funds.length} more
      </button>
      {open && (
        <motion.ul
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 top-full z-10 mt-1.5 w-56 space-y-1 rounded-xl border border-white/10 bg-background/95 p-2.5 shadow-xl backdrop-blur-xl"
        >
          {funds.map((fund) => (
            <li key={fund.id} className="flex items-center gap-2 font-mono text-[10px]">
              <span className="size-2 shrink-0 rounded-full" style={{ background: amcById(fund.amc)?.color }} />
              <span className="truncate">{shortFundName(fund.fundName)}</span>
              <span className="ml-auto text-muted-foreground">{fund.rollingAvg.toFixed(1)}%</span>
            </li>
          ))}
        </motion.ul>
      )}
    </div>
  )
}

type WinnersCardProps = {
  category: FundCategory
  winners: CategoryFund[]
  podiumIds: string[]
  activeId: string
  onSelect: (fundId: string) => void
  className?: string
}

export function WinnersCard({ category, winners, podiumIds, activeId, onSelect, className }: WinnersCardProps) {
  const chipId = `winners-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const podium = podiumIds.map((id) => winners.find((w) => w.id === id)).filter((w): w is CategoryFund => w !== undefined)
  const top = podium.length ? podium : winners.slice(0, 1)
  const bench = winners.filter((w) => !top.includes(w))
  const active = winners.find((w) => w.id === activeId) ?? top[0]
  const several = top.length > 1

  const item = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
  })

  return (
    <motion.article
      initial={{ opacity: 0, y: 24, scale: 0.96, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 10, scale: 0.94, filter: 'blur(10px)', transition: { duration: 0.9, ease: EASE } }}
      transition={{ duration: 0.7, ease: EASE }}
      className={cn(
        'pointer-events-auto rounded-2xl border border-white/10 bg-background/70 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-5',
        className,
      )}
      aria-live="polite"
    >
      <motion.header {...item(0.05)} className="flex items-center justify-between gap-3">
        <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {category.label} · {winners.length} of {category.funds.length} passed
        </p>
        <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
          3/3 tests
        </span>
      </motion.header>

      {(several || bench.length > 0) && (
        <motion.div {...item(0.1)} className="mt-3 flex items-center gap-1.5">
          <div className="flex min-w-0 flex-1 gap-1.5" role="tablist" aria-label="Winning funds">
            {top.map((winner) => {
              const selected = winner.id === active.id
              return (
                <button
                  key={winner.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onSelect(winner.id)}
                  className="relative flex min-w-0 flex-1 items-center gap-1.5 rounded-full px-2 py-1 text-left"
                >
                  {selected && (
                    <motion.span
                      layoutId={`${chipId}-chip`}
                      className="absolute inset-0 rounded-full border border-primary/40 bg-primary/12"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative size-2.5 shrink-0 rounded-full" style={{ background: amcById(winner.amc)?.color }} />
                  <span className="relative truncate font-mono text-[10px] font-semibold">{fundBadge(winner)}</span>
                  <span className="relative ml-auto hidden font-mono text-[10px] text-muted-foreground sm:inline">
                    {winner.rollingAvg.toFixed(0)}%
                  </span>
                </button>
              )
            })}
          </div>
          {bench.length > 0 && <MorePill funds={bench} />}
        </motion.div>
      )}

      <motion.div {...item(0.15)} className="mt-2.5">
        <motion.h3
          key={active.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="font-display text-xl leading-tight sm:text-[1.6rem]"
        >
          {shortFundName(active.fundName)}
        </motion.h3>
        <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
          {category.label} · vs {category.benchmark}
        </p>
      </motion.div>

      <motion.div {...item(0.22)} className="mt-2 hidden sm:block">
        {several ? <HorizonChart funds={top} active={active} /> : <FieldRow category={category} winnerId={active.id} />}
      </motion.div>

      <motion.div {...item(0.3)} className="mt-3">
        <MetricSlides fund={active} category={category} peers={top} />
      </motion.div>

      <motion.div {...item(0.38)} className="mt-3 hidden sm:block">
        <MetricTicker fund={active} />
      </motion.div>

      <motion.footer {...item(0.45)} className="mt-2 flex items-center justify-between gap-3 sm:mt-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">
          {category.period} rolling<span className="hidden sm:inline"> · past performance</span>
        </p>
        <Link
          to={`/fund?scheme=${encodeURIComponent(active.fundName)}`}
          className="group inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Full report
          <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </motion.footer>
    </motion.article>
  )
}
