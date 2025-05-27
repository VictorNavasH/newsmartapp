"use client"

import { cn } from "@/lib/utils"

interface SubMenuBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  items: {
    id: string
    label: string
    color: string
  }[]
}

export function SubMenuBar({ activeTab, onTabChange, items }: SubMenuBarProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-8">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "relative py-2 px-1 text-xs font-medium transition-colors duration-200",
              activeTab === item.id ? "text-nua-title" : "text-gray-500 hover:text-gray-700",
            )}
          >
            {item.label}
            {activeTab === item.id && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300"
                style={{ backgroundColor: item.color }}
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
