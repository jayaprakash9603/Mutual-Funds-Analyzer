import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const points = Array.from({ length: 40 }, (_, i) => ({
  x: i * 30,
  y: 120 + Math.sin(i * 0.4) * 40 + Math.cos(i * 0.15) * 20,
}))

export function AnimatedStockGraph() {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const length = path.getTotalLength()
    path.style.strokeDasharray = `${length}`
    path.style.strokeDashoffset = `${length}`
    path.animate(
      [{ strokeDashoffset: `${length}` }, { strokeDashoffset: '0' }],
      { duration: 3000, fill: 'forwards', easing: 'ease-out' },
    )
  }, [])

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30" aria-hidden="true">
      <motion.svg
        className="absolute -right-20 top-20 h-64 w-[800px] text-primary"
        viewBox="0 0 1200 240"
        initial={{ x: 0 }}
        animate={{ x: -60 }}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path ref={pathRef} d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="2" />
      </motion.svg>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
    </div>
  )
}
