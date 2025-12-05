import type { ReactNode } from "react"

interface PageContentProps {
  children: ReactNode
}

export function PageContent({ children }: PageContentProps) {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      <div className="space-y-6">{children}</div>
    </div>
  )
}
