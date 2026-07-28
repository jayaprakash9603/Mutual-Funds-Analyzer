export function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-60 dark:opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 75% 60% at 45% 40%, black, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 60% at 45% 40%, black, transparent 100%)',
        }}
      />
      <div className="absolute -left-40 -top-48 size-[34rem] rounded-full bg-primary/15 blur-[130px]" />
      <div className="absolute -bottom-56 right-[-10rem] size-[30rem] rounded-full bg-primary/10 blur-[140px]" />
    </div>
  )
}
