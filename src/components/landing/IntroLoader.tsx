import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE, EASE_IN_OUT, INTRO_SEEN_KEY } from './motion'

const DURATION_MS = 1700

function shouldPlayIntro() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) !== '1'
  } catch {
    return false
  }
}

function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    /* storage can be blocked in private modes; the intro simply replays */
  }
}

export function IntroLoader({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(shouldPlayIntro)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!visible) {
      onDone()
      return
    }

    document.documentElement.style.overflow = 'hidden'
    let frame = 0
    let timer = 0
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION_MS, 1)
      setProgress(Math.round((1 - Math.pow(1 - t, 3)) * 100))
      if (t < 1) {
        frame = requestAnimationFrame(tick)
        return
      }
      timer = window.setTimeout(() => {
        markIntroSeen()
        setVisible(false)
      }, 220)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      document.documentElement.style.overflow = ''
    }
  }, [visible, onDone])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[70] flex flex-col justify-between bg-background px-5 py-6 sm:px-10 sm:py-8"
          exit={{ y: '-100%', transition: { duration: 1, ease: EASE_IN_OUT } }}
          aria-hidden="true"
        >
          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>Analyzer / Golden Triangle</span>
            <span>Loading NAV history</span>
          </div>

          <svg viewBox="0 0 120 104" className="mx-auto h-28 w-32 sm:h-36 sm:w-40">
            <motion.path
              d="M60 4 L116 100 L4 100 Z"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progress / 100 }}
              transition={{ duration: 0.2, ease: 'linear' }}
            />
            {[
              [60, 4],
              [116, 100],
              [4, 100],
            ].map(([cx, cy], index) => (
              <motion.circle
                key={index}
                cx={cx}
                cy={cy}
                r="3.5"
                fill="var(--gold)"
                initial={{ scale: 0 }}
                animate={{ scale: progress >= (index + 1) * 33 ? 1 : 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />
            ))}
          </svg>

          <div>
            <div className="flex items-end justify-between gap-6">
              <p className="font-display text-[clamp(6rem,24vw,18rem)] leading-[0.8] tabular-nums">
                {progress}
                <span className="align-top text-[0.3em] text-primary">%</span>
              </p>
              <p className="hidden max-w-[16rem] pb-4 text-sm text-muted-foreground sm:block">
                Three tests. Every rolling window. No lucky streaks.
              </p>
            </div>
            <div className="mt-6 h-px w-full bg-border">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
