import { createContext, useContext, type ReactNode } from 'react'
import { REPORT_SECTION_SCROLL_OFFSET } from '../lib/nav/reportLayoutConstants'

export {
  REPORT_NAVBAR_HEIGHT_PX,
  REPORT_PAGE_TOP_PX,
  REPORT_SECTION_SCROLL_OFFSET,
  REPORT_STICKY_BAR_HEIGHT_PX,
} from '../lib/nav/reportLayoutConstants'

const ReportScrollContext = createContext(REPORT_SECTION_SCROLL_OFFSET)

export function ReportScrollProvider({
  offset,
  children,
}: {
  offset: number
  children: ReactNode
}) {
  return <ReportScrollContext.Provider value={offset}>{children}</ReportScrollContext.Provider>
}

export function useReportScrollOffset() {
  return useContext(ReportScrollContext)
}
