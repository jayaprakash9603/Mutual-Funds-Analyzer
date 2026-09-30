import type { Variants } from 'framer-motion'

export const EASE = [0.16, 1, 0.3, 1] as const
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const

export const VIEWPORT_ONCE = { once: true, amount: 0.3 } as const

export const revealUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay, ease: EASE },
  }),
}

export const INTRO_SEEN_KEY = 'analyzer.landing.introSeen'
