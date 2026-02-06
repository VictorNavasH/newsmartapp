import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Whitelist de archivos permitidos (seguridad anti-path traversal)
const ALLOWED_FILES = [
  "ARCHITECTURE",
  "CHANGELOG",
  "INTEGRATIONS",
  "SERVICES",
  "TYPES",
  "VIEWS",
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const file = searchParams.get("file")

  if (!file) {
    return NextResponse.json(
      { error: "Parámetro 'file' requerido" },
      { status: 400 }
    )
  }

  // Caso especial: devolver todos los docs como bundle JSON
  if (file === "all") {
    const docs: Record<string, string> = {}
    for (const name of ALLOWED_FILES) {
      const filePath = path.join(process.cwd(), "docs", `${name}.md`)
      try {
        docs[name] = fs.readFileSync(filePath, "utf-8")
      } catch {
        docs[name] = `# ${name}\n\nArchivo no encontrado.`
      }
    }
    return NextResponse.json({ docs })
  }

  // Archivo individual
  const upperFile = file.toUpperCase()
  if (!ALLOWED_FILES.includes(upperFile)) {
    return NextResponse.json(
      { error: "Archivo no permitido" },
      { status: 403 }
    )
  }

  const filePath = path.join(process.cwd(), "docs", `${upperFile}.md`)

  try {
    const content = fs.readFileSync(filePath, "utf-8")
    return NextResponse.json({ file: upperFile, content })
  } catch {
    return NextResponse.json(
      { error: "Archivo no encontrado" },
      { status: 404 }
    )
  }
}
