import type { ReactNode } from "react"

interface ChartScrollProps {
  children: ReactNode
  /** Ancho mínimo del gráfico en px: en móvil se desplaza horizontalmente en vez de comprimirse */
  minWidth?: number
  /** Clases del contenedor interno (normalmente la altura, p. ej. "h-[300px]") */
  className?: string
}

/**
 * Envuelve un gráfico Recharts para móvil: si el viewport es más estrecho que
 * `minWidth`, el gráfico mantiene su ancho legible y se desplaza con el dedo
 * dentro de la tarjeta (la página no se mueve). En escritorio no cambia nada.
 */
export function ChartScroll({ children, minWidth = 560, className = "" }: ChartScrollProps) {
  return (
    <div className="overflow-x-auto">
      <div className={className} style={{ minWidth: `${minWidth}px` }}>
        {children}
      </div>
    </div>
  )
}
