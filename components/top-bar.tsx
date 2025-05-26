"use client"

import { useState } from "react"
import { Search, Bell, User, Calendar, ChevronDown } from "lucide-react"

export default function TopBar() {
  const [period, setPeriod] = useState("Q1 2023")

  return (
    <header className="bg-white border-b border-gray-200 p-4 h-[73px] flex items-center">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-nua-primary focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>

          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-500">Periodo:</span>
            <button className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1.5 rounded-md">
              <Calendar size={14} />
              <span>{period}</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-gray-500 hover:text-nua-primary">
            <Bell size={20} />
          </button>
          <button className="flex items-center gap-2">
            <div className="bg-nua-accent text-white rounded-full w-8 h-8 flex items-center justify-center">
              <User size={16} />
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
