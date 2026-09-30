import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SieveStage, StageEvent } from './sieve'

const RULES = [
  { title: 'Rolling returns', detail: 'Rolling average beats the benchmark' },
  { title: 'Consistency', detail: 'Wins more than 70% of rolling windows' },
  { title: 'Risk-adjusted', detail: 'Sharpe ratio above the index' },
]

const STAGE_INDEX: Record<SieveStage, number> = {
  pour: 0,
  test1: 1,
  test2: 2,
  gate: 3,
  podium: 4,
  spotlight: 4,
  drain: 4,
}

type RowState = 'idle' | 'active' | 'done'

function rowState(stage: SieveStage | undefined, row: number): RowState {
  const index = stage ? STAGE_INDEX[stage] : 0
  if (index > row) return 'done'
  return index === row ? 'active' : 'idle'
}

type WinnerDot = { id: string; label: string; color: string }
type RuleChecklistProps = { event: StageEvent | null; winners?: WinnerDot[]; more?: number; className?: string }

export function RuleChecklist({ event, winners = [], more = 0, className }: RuleChecklistProps) {
  const stage = event?.stage
  const counts = event?.counts
  const showWinner = (stage === 'podium' || stage === 'spotlight' || stage === 'drain') && winners.length > 0

  return (
    <div className={className}>
      <ol className="hidden space-y-1.5 lg:block" aria-label="The three tests every fund faces">
        {RULES.map((rule, i) => {
          const state = rowState(stage, i + 1)
          return (
            <li
              key={rule.title}
              className={cn(
                'relative flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 transition-colors duration-500',
                state === 'active' && 'border-primary/50 bg-primary/10',
                state === 'done' && 'border-border/60 bg-card/40',
                state === 'idle' && 'border-border/40 bg-transparent',
              )}
            >
              {state === 'active' && (
                <motion.span
                  className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                  animate={{ x: ['-100%', '320%'] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  'relative grid size-7 shrink-0 place-items-center rounded-full font-mono text-[11px] transition-colors duration-500',
                  state === 'done' ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground',
                  state === 'active' && 'border-primary text-primary',
                )}
              >
                {state === 'done' ? <Check className="size-3.5" aria-hidden /> : `0${i + 1}`}
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="block text-sm font-medium">{rule.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{rule.detail}</span>
              </span>
              <span className="relative shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {counts && state === 'done' ? (
                  <>
                    {counts[i]} <span className="text-primary">→ {counts[i + 1]}</span>
                  </>
                ) : state === 'active' ? (
                  <span className="text-primary">testing</span>
                ) : null}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="lg:hidden" aria-hidden>
        <div className="flex gap-1.5">
          {RULES.map((rule, i) => {
            const state = rowState(stage, i + 1)
            return (
              <div key={rule.title} className="flex-1">
                <div className="h-1 overflow-hidden rounded-full bg-border/70">
                  <motion.div
                    className="h-full bg-primary"
                    initial={false}
                    animate={{ width: state === 'done' ? '100%' : state === 'active' ? '55%' : '0%' }}
                    transition={{ duration: state === 'active' ? 2 : 0.4 }}
                  />
                </div>
                <p
                  className={cn(
                    'mt-1.5 truncate font-mono text-[9px] uppercase tracking-[0.14em]',
                    state === 'idle' ? 'text-muted-foreground/70' : 'text-foreground',
                  )}
                >
                  {rule.title}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground" aria-live="polite">
        {showWinner && counts ? (
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{counts[3]} passed all three</span>
            {winners.map((w) => (
              <span key={w.id} className="inline-flex items-center gap-1 text-foreground">
                <span className="size-2 rounded-full" style={{ background: w.color }} />
                {w.label}
              </span>
            ))}
            {more > 0 && <span className="text-gold">+{more} more</span>}
          </span>
        ) : counts && stage === 'pour' ? (
          <>Pouring in {counts[0]} funds · real 5-year data</>
        ) : counts ? (
          <>{counts[0]} funds in the bowl · real 5-year data</>
        ) : (
          'Loading funds'
        )}
      </p>
    </div>
  )
}
