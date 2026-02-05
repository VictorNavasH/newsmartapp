"use client"

import type React from "react"
import { NAVIGATION_ITEMS } from "../../constants"
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react"

interface SidebarProps {
  collapsed: boolean
  toggle: () => void
  currentPath: string
  onNavigate: (path: string) => void
  userName?: string
  userEmail?: string
  onSignOut?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggle, currentPath, onNavigate, userName, userEmail, onSignOut }) => {
  const displayName = userName || userEmail?.split("@")[0] || "Usuario"
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  return (
    <div
      className={`h-screen bg-white shadow-xl transition-all duration-300 flex flex-col z-50 ${collapsed ? "w-20" : "w-64"}`}
    >
      {/* HEADER */}
      <div className="h-16 flex items-center justify-center border-b border-slate-100 relative">
        {!collapsed ? (
          <img src="/images/logo-smart-app.png" alt="NÜA Smart App" className="h-8 object-contain" />
        ) : (
          <img
            src="/images/logo-smart-app.png"
            alt="NÜA"
            className="h-6 w-6 object-contain object-left"
            style={{ clipPath: "inset(0 70% 0 0)" }}
          />
        )}

        <button
          onClick={toggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1 shadow-sm text-slate-400 hover:text-[#02b1c4] transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = currentPath === item.path
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative
                ${
                  isActive
                    ? "bg-[#02b1c4]/10 text-[#02b1c4] font-bold shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#364f6b]"
                }
              `}
            >
              <Icon
                size={20}
                className={`transition-colors ${isActive ? "text-[#02b1c4]" : "text-slate-400 group-hover:text-[#364f6b]"} ${collapsed ? "mx-auto" : "mr-3"}`}
              />

              {!collapsed && <span className="truncate">{item.name}</span>}

              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <div className="absolute left-14 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-slate-100">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#02b1c4] to-[#227c9d] flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-[#364f6b] truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            </div>
          )}
          {!collapsed && onSignOut && (
            <button
              onClick={onSignOut}
              title="Cerrar sesión"
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
        {collapsed && onSignOut && (
          <button
            onClick={onSignOut}
            title="Cerrar sesión"
            className="mt-2 w-full flex justify-center p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
