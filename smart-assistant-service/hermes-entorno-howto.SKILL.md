---
name: nua-entorno-howto
description: "Cómo ejecutar tareas técnicas en el entorno/VPS de NÜA: leer y extraer texto de PDFs y otros archivos, instalar librerías de Python sin romper el sistema, dónde escribir archivos temporales, y subir documentos a Cuentica. ÚSALO SIEMPRE que una tarea requiera ejecutar código, procesar un archivo (PDF, Excel, imagen) o subir algo a Cuentica — así no pierdes tiempo probando métodos que fallan en este contenedor."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [entorno, vps, pdf, python, uv, librerias, cuentica, archivos, howto, pep668]
    related_skills: [nua-datos-supabase]
---

# Cómo ejecutar cosas en el entorno NÜA (VPS / contenedor)

Recetas que FUNCIONAN en este contenedor. Úsalas directamente; no intentes los métodos
"normales" que aquí fallan (te ahorras el error y el tiempo).

## 🐍 Python con librerías extra (leer PDFs, Excel, etc.) — NO instales global

Este contenedor tiene Python **gestionado externamente (PEP 668)** y **sin `pip` global**.
Por eso `pip install pdfplumber` / `pip install pypdf` / `import fitz` **fallan** con error de
módulo no encontrado o "externally-managed-environment". **No te rindas por eso.**

**La forma que SÍ funciona: `uv` (ya está instalado).** Crea un entorno temporal al vuelo,
instala la librería en milisegundos, ejecuta y lo destruye. Sin tocar el sistema:

```bash
uv run --with pdfplumber python3 /tmp/script.py
```

- **Extraer texto de un PDF:** escribe un script Python que use `pdfplumber` (o `pypdf`) y
  ejecútalo con `uv run --with pdfplumber python3 /tmp/extraer.py`.
- Para otras librerías, lo mismo: `uv run --with <libreria> python3 /tmp/script.py`
  (se pueden encadenar: `--with pandas --with openpyxl`).
- NUNCA digas que "no puedes leer el PDF por un fallo de librerías": usa `uv run --with`.

### PDF escaneado / imagen (pdfplumber no saca texto) → OCR con Claude

Si el PDF es un **escaneo / imagen** (pdfplumber o pypdf devuelven vacío), NO necesitas OCR
pesado ni decir que no puedes. **Delega la lectura en Claude Code**, que lee PDFs e imágenes
con su **visión** (OCR de alta calidad y entiende la estructura). Guarda el archivo en `/tmp` y:

```bash
bash -lc 'set -a; . /opt/data/.env; set +a; claude -p --model opus "Lee el PDF /tmp/<archivo>.pdf y extrae en JSON: proveedor, CIF, fecha, nº factura, importe total, desglose de IVA y líneas"'
```

Funciona igual para imágenes (`.jpg`, `.png`). Es la forma preferida para facturas escaneadas.
(Alternativa local sin Claude: Tesseract — `uv run --with pytesseract --with pdf2image` + el
binario `tesseract-ocr` y `poppler-utils` instalados a nivel de sistema; peor calidad, solo si
no quieres usar cuota de Claude.)

## 📁 Dónde escribir scripts y archivos temporales

- **`/opt/hermes` es de SOLO LECTURA** → escribir ahí da `Permission denied`. NO escribas ahí.
- Escribe los scripts y temporales en **`/tmp`** (siempre con permiso) o en **`/opt/data`**
  (el volumen persistente, también escribible).

## 🧾 Subir documentos / crear gastos en Cuentica

- **NO hagas `curl` directo a `api.cuentica.com` desde el VPS**: Cuentica bloquea las IPs de
  hosting/VPS y devuelve **403 Forbidden**.
- Usa el **MCP de Cuentica** (servidor proxy con IP limpia) para crear gastos/facturas y
  adjuntar archivos. Encapsula la subida en el MCP, NO mandes el base64 del archivo por el
  chat (dispara el consumo de tokens).
- Tras crear un gasto en borrador, recuerda al usuario que lo **valide visualmente** en Cuentica
  (los datos extraídos de un PDF pueden tener algún número mal).

## Regla general

Antes de decir "no puedo" por un problema técnico de entorno, consulta este skill: casi
siempre hay una receta que funciona (`uv run` para librerías, `/tmp` para escribir, MCP para
APIs bloqueadas).
