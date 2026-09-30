import { useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { Check } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { SectionLabel } from './SectionLabel'

const HEADLINE = 'Nothing but evidence.'

const NOISE = [
  { label: 'Star ratings', why: 'Star ratings lag, and most lean on 3-year point-to-point returns.' },
  { label: "Last year's toppers", why: 'Top-quartile funds rarely stay there; last year is one window of hundreds.' },
  { label: '1-year returns', why: 'One year is mostly market mood, not manager skill.' },
  { label: 'Point-to-point returns', why: 'A single start and end date can flatter or bury any fund.' },
  { label: 'AUM size', why: 'Big assets show popularity, not whether the fund beats its index.' },
  { label: 'NFO hype', why: 'A new fund has no history to test, so it cannot pass the triangle yet.' },
  { label: 'Star fund managers', why: 'Managers move; we judge what the fund actually delivered.' },
  { label: 'Forum tips', why: 'Anecdotes are not a benchmark.' },
  { label: 'Sponsored rankings', why: 'Paid placement says nothing about rolling returns.' },
  { label: 'Bull-run snapshots', why: 'Everything looks brilliant in a bull run; we test every cycle.' },
  { label: 'Recency bias', why: 'Every rolling window counts equally, old or new.' },
  { label: 'Commission-led picks', why: 'We never earn from a fund, so nothing tilts the verdict.' },
]

const KEPT = ['Rolling returns', 'Beat index > 70%', 'Sharpe vs index']

function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }
}

const random = seeded(20260930)
const between = (min: number, max: number) => min + random() * (max - min)

const LETTERS = [...HEADLINE].map((char) => ({
  char,
  y: between(-200, 200),
  rotate: between(-40, 40),
  start: between(0, 0.3),
}))

const CHIP_SCATTER = NOISE.map(() => ({
  x: between(-400, 400),
  y: between(-200, 200),
  rotate: between(-90, 90),
  start: between(0.25, 0.5),
}))

function Letter({ letter, progress }: { letter: (typeof LETTERS)[number]; progress: MotionValue<number> }) {
  const range = [letter.start, letter.start + 0.35]
  const y = useTransform(progress, range, [`${letter.y}%`, '0%'])
  const rotate = useTransform(progress, range, [letter.rotate, 0])
  const opacity = useTransform(progress, range, [0, 1])
  return (
    <motion.span className="inline-block" style={{ y, rotate, opacity }}>
      {letter.char}
    </motion.span>
  )
}

function Headline({ progress }: { progress: MotionValue<number> }) {
  const words = HEADLINE.split(' ')
  let offset = 0
  return (
    <h2
      aria-label={HEADLINE}
      className="mx-auto mt-8 max-w-[14ch] font-display text-[clamp(2.8rem,9vw,9rem)] leading-[0.95] tracking-[-0.04em]"
    >
      {words.map((word, w) => {
        const letters = LETTERS.slice(offset, offset + word.length)
        offset += word.length + 1
        return (
          <span key={word} aria-hidden className="inline-block whitespace-nowrap">
            {letters.map((letter, i) => (
              <Letter key={i} letter={letter} progress={progress} />
            ))}
            {w < words.length - 1 && '\u00a0'}
          </span>
        )
      })}
    </h2>
  )
}

type ChipProps = {
  index: number
  progress: MotionValue<number>
  spread: number
  active: boolean
  onFocus: (index: number | null) => void
}

function NoiseChip({ index, progress, spread, active, onFocus }: ChipProps) {
  const scatter = CHIP_SCATTER[index]
  const range = [scatter.start, scatter.start + 0.3]
  const strikeRange = [scatter.start + 0.3, scatter.start + 0.42]
  const x = useTransform(progress, range, [scatter.x * spread, 0])
  const y = useTransform(progress, range, [scatter.y * spread, 0])
  const rotate = useTransform(progress, range, [scatter.rotate, 0])
  const scale = useTransform(progress, range, [0, 1])
  const opacity = useTransform(progress, range, [0, 1])
  const strike = useTransform(progress, strikeRange, [0, 1])
  const textOpacity = useTransform(progress, strikeRange, [1, 0.55])

  return (
    <motion.button
      type="button"
      style={{ x, y, rotate, scale, opacity }}
      onMouseEnter={() => onFocus(index)}
      onMouseLeave={() => onFocus(null)}
      onFocus={() => onFocus(index)}
      onBlur={() => onFocus(null)}
      onClick={() => onFocus(active ? null : index)}
      aria-pressed={active}
      className={cn(
        'relative rounded-full border px-4 py-2 font-mono text-[11px] tracking-[0.08em] transition-colors duration-300 sm:px-5 sm:py-2.5 sm:text-xs',
        active ? 'border-foreground bg-foreground text-background' : 'border-border/80',
      )}
    >
      <motion.span className="relative" style={{ opacity: active ? 1 : textOpacity }}>
        {NOISE[index].label}
        <motion.span
          className="absolute inset-x-[-2px] top-1/2 h-px origin-left bg-gold"
          style={{ scaleX: strike }}
          aria-hidden
        />
      </motion.span>
    </motion.button>
  )
}

function KeptChips({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0.8, 0.95], [0, 1])
  const y = useTransform(progress, [0.8, 0.95], [24, 0])

  return (
    <motion.div style={{ opacity, y }} className="mt-12 flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2.5">
        {KEPT.map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/12 px-4 py-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-primary shadow-[0_0_24px_-6px_var(--primary)] sm:text-xs"
          >
            <Check className="size-3.5" aria-hidden />
            {label}
          </span>
        ))}
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        What's left: three tests, full NAV history.
      </p>
    </motion.div>
  )
}

function Content({ progress }: { progress: MotionValue<number> }) {
  const desktop = useMediaQuery('(min-width: 1024px)')
  const [focused, setFocused] = useState<number | null>(null)
  const spread = desktop ? 1 : 0.35

  return (
    <>
      <div className="flex justify-center">
        <SectionLabel index="03">What we ignore</SectionLabel>
      </div>
      <Headline progress={progress} />
      <div className="mx-auto mt-10 flex max-w-[62rem] flex-wrap justify-center gap-2.5 sm:mt-14 sm:gap-3">
        {NOISE.map((noise, index) => (
          <NoiseChip
            key={noise.label}
            index={index}
            progress={progress}
            spread={spread}
            active={focused === index}
            onFocus={setFocused}
          />
        ))}
      </div>
      <p className="mx-auto mt-6 min-h-[2.75rem] max-w-[46ch] text-sm text-muted-foreground" aria-live="polite">
        {focused === null ? 'Hover or tap any of them to see why it is left out.' : NOISE[focused].why}
      </p>
      <KeptChips progress={progress} />
    </>
  )
}

export function NoiseIgnored() {
  const ref = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'start 15%'] })
  const settled = useMotionValue(1)
  return (
    <section ref={ref} className="overflow-hidden px-4 py-28 text-center sm:px-6 lg:py-40">
      <Content progress={reduceMotion ? settled : scrollYProgress} />
    </section>
  )
}
