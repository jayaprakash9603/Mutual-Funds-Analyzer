import { useEffect, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isDemoModeEnabled } from '@/demo/demoMode'
import { loadDemoManifest, type DemoFund } from '@/demo/demoManifest'

interface DemoFundPickerProps {
  selectedScheme: string | null
  onSelect: (scheme: string) => void
}

/** SEBI category names are long; a chip only has room for the distinguishing part. */
function shortCategory(category: string): string {
  const [, tail] = category.split(' - ')
  const [head] = (tail ?? category).split(/\s+or\s+|\//)
  return head.replace(/\s+fund$/i, '').trim()
}

/**
 * Quick-pick chips for the handful of funds that have captured fixtures, so a demo never
 * has to guess which scheme names will resolve. Renders nothing outside demo mode.
 */
export function DemoFundPicker({ selectedScheme, onSelect }: DemoFundPickerProps) {
  const enabled = isDemoModeEnabled()
  const [funds, setFunds] = useState<DemoFund[]>([])

  useEffect(() => {
    if (!enabled) {
      return
    }
    let active = true
    loadDemoManifest()
      .then((manifest) => {
        if (active) setFunds(manifest.funds)
      })
      .catch(() => {
        if (active) setFunds([])
      })
    return () => {
      active = false
    }
  }, [enabled])

  if (!enabled || funds.length === 0) {
    return null
  }

  return (
    <section
      className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
      aria-label="Demo funds"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        Demo data — pick a sample fund
        <span className="font-normal text-muted-foreground">(the backend is not used)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {funds.map((fund) => (
          <Button
            key={fund.scheme}
            variant={fund.scheme === selectedScheme ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(fund.scheme)}
            title={fund.scheme}
          >
            <span>{fund.label}</span>
            {fund.category && (
              <span className="hidden text-xs font-normal opacity-70 md:inline">
                {shortCategory(fund.category)}
              </span>
            )}
          </Button>
        ))}
      </div>
    </section>
  )
}
