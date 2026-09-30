import { useId, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, Search } from 'lucide-react'
import { useFundSearch } from '@/hooks/useFundSearch'
import { SEARCH_MIN_QUERY_LENGTH } from '@/lib/constants'
import { EASE } from './motion'
import { MagneticCta } from './MagneticCta'
import { RevealLine } from './RevealLine'
import { SectionLabel } from './SectionLabel'

const reportPath = (scheme: string) => `/fund?scheme=${encodeURIComponent(scheme)}`

function FundSearch() {
  const navigate = useNavigate()
  const listId = useId()
  const [query, setQuery] = useState('')
  const searching = query.trim().length >= SEARCH_MIN_QUERY_LENGTH
  const { schemes, loading } = useFundSearch(query, 'All', searching)
  const results = schemes.slice(0, 5)

  function submit(event: FormEvent) {
    event.preventDefault()
    navigate(results[0] ? reportPath(results[0]) : '/fund')
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-xl" role="search">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search a mutual fund
      </label>
      <div className="flex items-center gap-3 rounded-full border border-border bg-card/80 py-2 pl-5 pr-2 shadow-lg shadow-black/5 backdrop-blur focus-within:border-primary/60">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          id={`${listId}-input`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try “Parag Parikh” or “Axis Small Cap”"
          autoComplete="off"
          aria-controls={listId}
          aria-expanded={searching && results.length > 0}
          role="combobox"
          className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-muted-foreground/80"
        />
        {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />}
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Analyze
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence>
        {searching && results.length > 0 && (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-xl backdrop-blur"
          >
            {results.map((scheme) => (
              <li key={scheme} role="option" aria-selected={false}>
                <Link
                  to={reportPath(scheme)}
                  className="block truncate rounded-xl px-4 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {scheme}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </form>
  )
}

export function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -bottom-40 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-[84rem] flex-col px-4 py-28 sm:px-6 lg:px-8 lg:py-36">
        <SectionLabel index="07">Start here</SectionLabel>
        <h2 className="mt-6 font-display text-[clamp(3.6rem,11vw,10rem)] leading-[0.88] tracking-[-0.02em]">
          <RevealLine>Stop guessing.</RevealLine>
          <RevealLine delay={0.1}>
            <em className="text-primary">Start testing.</em>
          </RevealLine>
        </h2>

        <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4">
            <FundSearch />
            <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
              Educational research only, not investment advice. Mutual fund investments are subject to market
              risks; read all scheme-related documents carefully.
            </p>
          </div>

          <MagneticCta strength={0.35} className="self-end">
            <Link
              to="/method"
              className="group flex size-40 flex-col items-center justify-center rounded-full border border-gold/50 text-center transition-colors hover:bg-gold hover:text-background sm:size-48"
            >
              <span className="font-display text-2xl italic leading-tight">
                How the
                <br />
                method works
              </span>
              <ArrowRight className="mt-2 size-4 -rotate-45 transition-transform group-hover:rotate-0" aria-hidden="true" />
            </Link>
          </MagneticCta>
        </div>
      </div>
    </section>
  )
}
