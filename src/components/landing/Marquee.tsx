const CATEGORIES = [
  'Large Cap',
  'Flexi Cap',
  'Small Cap',
  'Mid Cap',
  'ELSS',
  'Hybrid',
  'Index',
  'International',
]

export function Marquee() {
  const items = [...CATEGORIES, ...CATEGORIES]

  return (
    <div className="relative z-10 -rotate-[1.5deg] scale-[1.03] overflow-hidden bg-primary py-4 text-primary-foreground" aria-hidden="true">
      <div className="landing-marquee flex w-max items-center gap-10 whitespace-nowrap">
        {items.map((name, index) => (
          <span key={index} className="flex items-center gap-10 font-display text-3xl sm:text-5xl">
            <em>{name}</em>
            <span className="text-base not-italic opacity-60 sm:text-xl">&#9650;</span>
          </span>
        ))}
      </div>
    </div>
  )
}
