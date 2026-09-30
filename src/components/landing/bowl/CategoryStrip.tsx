import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STAGE_ORDER, type StageEvent } from './sieve'

type CategoryStripProps = {
  labels: string[]
  event: StageEvent | null
  onSelect: (index: number) => void
  className?: string
}

export function CategoryStrip({ labels, event, onSelect, className }: CategoryStripProps) {
  const active = event?.category.index ?? 0
  const progress = event ? (STAGE_ORDER.indexOf(event.stage) + 1) / STAGE_ORDER.length : 0

  return (
    <div className={className}>
      <div className="flex gap-1.5" role="tablist" aria-label="Fund categories">
        {labels.map((label, index) => {
          const selected = index === active
          const done = index < active
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onSelect(index)}
              className={cn(
                'relative flex min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-500',
                selected ? 'border-primary/60 text-foreground' : 'border-border/60 text-muted-foreground hover:text-foreground',
              )}
            >
              {selected && (
                <motion.span
                  layoutId="category-pill"
                  className="absolute inset-0 bg-primary/15"
                  transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                />
              )}
              {done && <Check className="relative size-3 text-primary" aria-hidden />}
              <span className="relative truncate">{label}</span>
              {selected && (
                <motion.span
                  className="absolute bottom-0 left-0 h-0.5 bg-primary"
                  initial={false}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              )}
            </button>
          )
        })}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={event?.category.id ?? 'none'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35 }}
          className="mt-2.5 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
          aria-live="polite"
        >
          {event
            ? `Screening ${event.counts[0]} ${event.category.label.toLowerCase()} funds vs ${event.category.benchmark}`
            : 'Loading fund categories'}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
