import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const CAPTURE_SCALE = 1.25
const JPEG_QUALITY = 0.9
const OKLCH_RE = /oklch\(\s*[\d.]+%?\s+[\d.]+\s+[\d.]+(?:\s*\/\s*[\d.]+%?)?\s*\)/gi

const COLOR_PROPS = [
  'color',
  'background-color',
  'background-image',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'fill',
  'stroke',
  'stop-color',
  'box-shadow',
] as const

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 80) || 'fund-report'
}

const oklchCache = new Map<string, string>()

/** Resolve oklch() to rgb/rgba using the browser — html2canvas cannot parse oklch. */
function resolveOklch(value: string, doc: Document): string {
  const cached = oklchCache.get(value)
  if (cached) return cached

  const probe = doc.createElement('span')
  probe.style.setProperty('color', value)
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.pointerEvents = 'none'
  doc.body.appendChild(probe)
  const resolved = getComputedStyle(probe).color || '#808080'
  doc.body.removeChild(probe)
  oklchCache.set(value, resolved)
  return resolved
}

function sanitizeCssText(css: string, doc: Document): string {
  return css.replace(OKLCH_RE, (match) => resolveOklch(match, doc))
}

/** Snapshot live stylesheets with oklch replaced — injected into the clone in place of link tags. */
function buildSanitizedStylesheet(doc: Document): string {
  let css = ''
  for (const sheet of doc.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        css += `${rule.cssText}\n`
      }
    } catch {
      // Cross-origin stylesheets cannot be read; clone will rely on inlined colors.
    }
  }
  return sanitizeCssText(css, doc)
}

function injectSanitizedStyles(clonedDoc: Document, sourceDoc: Document) {
  clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove())
  const style = clonedDoc.createElement('style')
  style.textContent = buildSanitizedStylesheet(sourceDoc)
  clonedDoc.head.appendChild(style)
}

function mirrorResolvedColors(source: Element, target: Element): void {
  if (source instanceof HTMLElement && target instanceof HTMLElement) {
    const computed = getComputedStyle(source)
    for (const prop of COLOR_PROPS) {
      const value = computed.getPropertyValue(prop)
      if (!value || value === 'none' || value === 'normal' || value === 'rgba(0, 0, 0, 0)') {
        continue
      }
      if (value.includes('oklch')) continue
      target.style.setProperty(prop, value)
    }
  }

  if (source instanceof SVGElement && target instanceof SVGElement) {
    for (const attr of ['fill', 'stroke'] as const) {
      const value = source.getAttribute(attr)
      if (value && !value.startsWith('url(') && value !== 'none') {
        target.setAttribute(attr, value)
      }
    }
  }

  const sourceChildren = source.children
  const targetChildren = target.children
  for (let i = 0; i < sourceChildren.length; i += 1) {
    const targetChild = targetChildren[i]
    if (targetChild) mirrorResolvedColors(sourceChildren[i]!, targetChild)
  }
}

function prepareCloneForCapture(
  clonedDoc: Document,
  sourceDoc: Document,
  sourceRoot: HTMLElement,
  cloneRoot: HTMLElement,
) {
  injectSanitizedStyles(clonedDoc, sourceDoc)
  cloneRoot.classList.add('pdf-export-capture')
  mirrorResolvedColors(sourceRoot, cloneRoot)

  const patch = clonedDoc.createElement('style')
  patch.textContent = `
    .pdf-export-capture, .pdf-export-capture * {
      --background: #ffffff !important;
      --foreground: #1e293b !important;
      --card: #ffffff !important;
      --card-foreground: #1e293b !important;
      --muted: #f1f5f9 !important;
      --muted-foreground: #64748b !important;
      --border: #e2e8f0 !important;
      --primary: #16a34a !important;
      --chart-positive: #15803d !important;
      --chart-negative: #b91c1c !important;
      --chart-surface: #f8fafc !important;
      --chart-axis: #64748b !important;
      --chart-grid-stroke: rgba(148, 163, 184, 0.45) !important;
    }
    .pdf-export-capture .sticky { position: relative !important; top: auto !important; }
    .pdf-export-capture [data-slot="chart"] svg { overflow: visible !important; }
  `
  cloneRoot.prepend(patch)
}

function shouldIgnoreElement(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false
  if (element.classList.contains('sticky')) return true
  if (element.dataset.slot === 'scroll-area-scrollbar') return true
  return false
}

async function captureNode(sourceNode: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(sourceNode, {
    scale: CAPTURE_SCALE,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: sourceNode.scrollWidth,
    windowHeight: sourceNode.scrollHeight,
    height: sourceNode.scrollHeight,
    width: sourceNode.scrollWidth,
    ignoreElements: shouldIgnoreElement,
    onclone: (clonedDoc, cloneNode) => {
      prepareCloneForCapture(clonedDoc, document, sourceNode, cloneNode)
    },
  })
}

function addCanvasToPdf(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  pageWidth: number,
  pageHeight: number,
  startOnNewPage: boolean,
) {
  const imgData = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0
  let firstSlice = true

  while (heightLeft > 0) {
    if (startOnNewPage && firstSlice) {
      pdf.addPage()
    } else if (!firstSlice) {
      pdf.addPage()
      position -= pageHeight
    }

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
    heightLeft -= pageHeight
    firstSlice = false
    startOnNewPage = false
  }
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

export async function exportReportElementToPdf(
  element: HTMLElement,
  filenameBase: string,
): Promise<void> {
  oklchCache.clear()

  const scrollX = window.scrollX
  const scrollY = window.scrollY

  const sections = Array.from(element.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  )
  const chunks = sections.length > 0 ? sections : [element]

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  for (let i = 0; i < chunks.length; i += 1) {
    const canvas = await captureNode(chunks[i]!)
    addCanvasToPdf(pdf, canvas, pageWidth, pageHeight, i > 0)
    await yieldToMain()
  }

  window.scrollTo(scrollX, scrollY)
  pdf.save(`${sanitizeFilename(filenameBase)}.pdf`)
}
