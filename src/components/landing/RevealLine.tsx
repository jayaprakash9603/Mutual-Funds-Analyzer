import { useRef, type ReactNode } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { EASE, VIEWPORT_ONCE } from './motion'

type RevealLineProps = {
  children: ReactNode
  delay?: number
  /** When set, the line animates on this flag instead of on scroll into view. */
  play?: boolean
}

export function RevealLine({ children, delay = 0, play }: RevealLineProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduceMotion = useReducedMotion()
  const inView = useInView(ref, VIEWPORT_ONCE)
  const shown = play ?? inView

  return (
    <span ref={ref} className="-mb-[0.08em] block overflow-hidden pb-[0.16em]">
      <motion.span
        className="block origin-top-left"
        initial={reduceMotion ? false : { y: '110%', rotate: 2.5 }}
        animate={shown ? { y: '0%', rotate: 0 } : { y: '110%', rotate: 2.5 }}
        transition={{ duration: 1.1, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  )
}
