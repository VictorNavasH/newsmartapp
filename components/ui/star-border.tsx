import type React from "react"
import "./star-border.css"

interface StarBorderProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
  className?: string
  color?: string
  status?: "positive" | "negative" | "neutral"
  children: React.ReactNode
}

const StarBorder = ({
  as: Component = "div",
  className = "",
  color,
  status = "neutral",
  children,
  ...rest
}: StarBorderProps) => {
  // Determinar el color según el estado
  const statusColor = status === "positive" ? "#17c3b2" : status === "negative" ? "#fe6d73" : "#cccccc"

  // Usar el color proporcionado o el color basado en el estado
  const borderColor = color || statusColor

  // Color del sombreado interior
  const glowColor = status === "positive" ? "#17c3b2" : status === "negative" ? "#fe6d73" : "transparent"

  return (
    <Component className={`star-border-container ${className}`} {...rest}>
      <div
        className="border-gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${borderColor}, transparent 15%)`,
        }}
      ></div>
      <div
        className="border-gradient-top"
        style={{
          background: `radial-gradient(circle, ${borderColor}, transparent 15%)`,
        }}
      ></div>
      <div
        className="inner-content"
        style={{
          background: status !== "neutral" ? `linear-gradient(to right, ${glowColor}10, white 40%)` : "white",
        }}
      >
        {children}
      </div>
    </Component>
  )
}

export default StarBorder
