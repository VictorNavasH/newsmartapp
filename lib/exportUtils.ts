import { saveAs } from 'file-saver'

// --- CSV Export ---

interface CSVExportOptions {
  filename: string
  headers: string[]
  rows: (string | number | null | undefined)[][]
  /** Separador decimal para números (coma para España) */
  decimalSeparator?: string
}

/**
 * Exporta datos a CSV con formato español (separador punto y coma)
 */
export function exportToCSV({ filename, headers, rows, decimalSeparator = ',' }: CSVExportOptions): void {
  const separator = ';'

  const formatValue = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return ''
    if (typeof val === 'number') {
      return decimalSeparator === ',' ? val.toString().replace('.', ',') : val.toString()
    }
    const str = String(val)
    if (str.includes(separator) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvContent = [
    headers.map(h => formatValue(h)).join(separator),
    ...rows.map(row => row.map(cell => formatValue(cell)).join(separator))
  ].join('\n')

  // BOM para que Excel reconozca UTF-8
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, `${filename}.csv`)
}

// --- PDF Export ---

interface PDFExportOptions {
  filename: string
  title: string
  subtitle?: string
  headers: string[]
  rows: (string | number)[][]
  orientation?: 'portrait' | 'landscape'
  summary?: { label: string; value: string }[]
}

/**
 * Exporta datos a PDF con tabla formateada y branding NÜA
 */
export async function exportToPDF({
  filename,
  title,
  subtitle,
  headers,
  rows,
  orientation = 'landscape',
  summary,
}: PDFExportOptions): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })

  // Colores NÜA
  const primaryColor: [number, number, number] = [2, 177, 196] // #02b1c4
  const darkColor: [number, number, number] = [30, 41, 59] // slate-800

  // Header con línea de color
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 2, 'F')

  // Título
  let yPos = 15
  doc.setFontSize(18)
  doc.setTextColor(...darkColor)
  doc.text(title, 14, yPos)

  // Subtítulo
  if (subtitle) {
    yPos += 8
    doc.setFontSize(11)
    doc.setTextColor(100, 116, 139) // slate-500
    doc.text(subtitle, 14, yPos)
  }

  // Fecha de generación
  yPos += 8
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184) // slate-400
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, yPos)

  // Resumen de KPIs
  if (summary && summary.length > 0) {
    yPos += 10
    doc.setFontSize(10)
    summary.forEach((item, i) => {
      doc.setTextColor(...darkColor)
      doc.text(`${item.label}: `, 14, yPos + (i * 6))
      doc.setTextColor(...primaryColor)
      doc.text(item.value, 14 + doc.getTextWidth(`${item.label}: `), yPos + (i * 6))
    })
    yPos += summary.length * 6 + 5
  } else {
    yPos += 8
  }

  // Tabla con autoTable
  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: rows.map(row => row.map(cell => cell?.toString() ?? '')),
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: darkColor,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    styles: {
      cellPadding: 3,
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.1,
    },
    margin: { left: 14, right: 14 },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageHeight = doc.internal.pageSize.getHeight()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Línea inferior
    doc.setFillColor(...primaryColor)
    doc.rect(0, pageHeight - 2, pageWidth, 2, 'F')

    // Texto footer
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('NÜA Smart App — nuasmartrestaurant.com', 14, pageHeight - 5)
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 5, { align: 'right' })
  }

  doc.save(`${filename}.pdf`)
}
