import { useCallback, useEffect, useState } from 'react'
import { fetchFundReportMatrix, type MatrixReport } from '../api'

export function useFundReportMatrix(
  scheme: string | null,
  mode: 'LUMPSUM' | 'MULTIPLE' | 'SIP' | 'STP_6M',
  enabled: boolean,
) {
  const [data, setData] = useState<MatrixReport | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!scheme || !enabled) return
    setLoading(true)
    try {
      setData(await fetchFundReportMatrix(scheme, mode))
    } finally {
      setLoading(false)
    }
  }, [scheme, mode, enabled])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading }
}
