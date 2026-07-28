import { useRef, type PointerEvent, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

type MagneticCtaProps = {
  children: ReactNode
  className?: string
  strength?: number
}

export function MagneticCta({ children, className, strength = 0.24 }: MagneticCtaProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)
  const x = useSpring(offsetX, { stiffness: 260, damping: 20, mass: 0.4 })
  const y = useSpring(offsetY, { stiffness: 260, damping: 20, mass: 0.4 })

  function trackPointer(event: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== 'mouse') return
    const bounds = ref.current?.getBoundingClientRect()
    if (!bounds) return
    offsetX.set((event.clientX - (bounds.left + bounds.width / 2)) * strength)
    offsetY.set((event.clientY - (bounds.top + bounds.height / 2)) * strength * 1.3)
  }

  function release() {
    offsetX.set(0)
    offsetY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onPointerMove={trackPointer}
      onPointerLeave={release}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      className={cn('inline-flex', className)}
    >
      {children}
    </motion.div>
  )
}
