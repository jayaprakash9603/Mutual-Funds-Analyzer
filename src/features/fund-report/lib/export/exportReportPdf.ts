import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 80) || 'fund-report'
}

/** Clone hook: html2canvas cannot parse oklch() — swap CSS variables to hex for capture. */
function prepareCloneForCapture(root: HTMLElement) {
  root.classList.add('pdf-export-capture')
  const style = root.ownerDocument.createElement('style')
  style.textContent = `
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
  `
  root.prepend(style)
}

export async function exportReportElementToPdf(
  element: HTMLElement,
  filenameBase: string,
): Promise<void> {
  const scrollX = window.scrollX
  const scrollY = window.scrollY

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    height: element.scrollHeight,
    width: element.scrollWidth,
    onclone: (doc) => {
      const cloned = doc.getElementById(element.id)
      if (cloned) prepareCloneForCapture(cloned)
    },
  })

  window.scrollTo(scrollX, scrollY)

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position -= pageHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
    heightLeft -= pageHeight
  }

  pdf.save(`${sanitizeFilename(filenameBase)}.pdf`)
}
