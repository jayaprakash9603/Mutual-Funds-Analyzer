/** Matches SectionShell scroll-mt-36 (header + sticky section nav). */
export const REPORT_SECTION_SCROLL_OFFSET = 144

export function scrollToReportSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return false

  const top = el.getBoundingClientRect().top + window.scrollY - REPORT_SECTION_SCROLL_OFFSET
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  return true
}

export function centerElementInScroller(scroller: HTMLElement, element: HTMLElement) {
  const targetLeft = element.offsetLeft - (scroller.clientWidth - element.offsetWidth) / 2
  scroller.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
}
