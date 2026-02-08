import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"

// Capturar el contenido pasado al Blob constructor
let lastBlobContent: string = ""
const OriginalBlob = globalThis.Blob

class MockBlob extends OriginalBlob {
  constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
    super(parts, options)
    // Guardar el contenido como string para poder verificarlo
    if (parts) {
      lastBlobContent = parts.map(p => (typeof p === 'string' ? p : '')).join('')
    }
  }
}
globalThis.Blob = MockBlob as typeof Blob

// Mock file-saver
vi.mock("file-saver", () => ({
  saveAs: vi.fn(),
}))

import { saveAs } from "file-saver"
import { exportToCSV } from "../exportUtils"

// Helper para acceder al mock de saveAs
const mockSaveAs = saveAs as unknown as Mock

describe("lib/exportUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lastBlobContent = ""
  })

  describe("exportToCSV", () => {
    it("generates correct CSV content", () => {
      exportToCSV({
        filename: "test-export",
        headers: ["Nombre", "Valor"],
        rows: [
          ["Ingresos", 1000],
          ["Gastos", 500],
        ],
      })

      expect(mockSaveAs).toHaveBeenCalledOnce()

      const filename = mockSaveAs.mock.calls[0][1] as string
      expect(filename).toBe("test-export.csv")

      // Verificar contenido
      expect(lastBlobContent).toContain("Nombre;Valor")
      expect(lastBlobContent).toContain("Ingresos")
      expect(lastBlobContent).toContain("Gastos")
    })

    it("escapes values containing semicolons", () => {
      exportToCSV({
        filename: "test-escape",
        headers: ["Descripción", "Valor"],
        rows: [
          ["Venta; IVA incluido", 100],
        ],
      })

      // El valor con punto y coma debe estar entrecomillado
      expect(lastBlobContent).toContain('"Venta; IVA incluido"')
    })

    it("uses BOM for UTF-8 compatibility", () => {
      exportToCSV({
        filename: "test-bom",
        headers: ["Test"],
        rows: [["Valor"]],
      })

      // BOM character at the start
      expect(lastBlobContent.charCodeAt(0)).toBe(0xFEFF)
    })

    it("uses Spanish decimal format (comma separator)", () => {
      exportToCSV({
        filename: "test-decimal",
        headers: ["Precio"],
        rows: [
          [45.5],
          [1234.99],
        ],
      })

      // Números con coma decimal (formato español por defecto)
      expect(lastBlobContent).toContain("45,5")
      expect(lastBlobContent).toContain("1234,99")
    })

    it("handles null and undefined values", () => {
      exportToCSV({
        filename: "test-null",
        headers: ["Col1", "Col2"],
        rows: [
          [null, undefined],
          ["ok", 1],
        ],
      })

      // El contenido debe tener separadores para las celdas vacías
      expect(lastBlobContent).toContain(";")
    })

    it("uses semicolon as field separator", () => {
      exportToCSV({
        filename: "test-separator",
        headers: ["A", "B", "C"],
        rows: [["x", "y", "z"]],
      })

      expect(lastBlobContent).toContain("A;B;C")
      expect(lastBlobContent).toContain("x;y;z")
    })
  })
})
