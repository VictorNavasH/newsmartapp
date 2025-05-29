"use client"

import { useState } from "react"
import { SubMenuBar } from "./sub-menu-bar"
import { BancosConfig } from "./bancos-config"

const subMenuItems = [
  {
    id: "bancos",
    label: "Bancos",
    color: "#0073e6",
  },
  {
    id: "ia",
    label: "Inteligencia Artificial",
    color: "#10b981",
  },
  {
    id: "apps",
    label: "Apps Externas",
    color: "#8b5cf6",
  },
]

const IAContent = () => (
  <div>
    <h3 className="text-[14px] font-medium text-nua-title mb-4">Inteligencia Artificial</h3>
    <p className="text-[12px] text-nua-dark">Configuración de APIs de inteligencia artificial.</p>
  </div>
)

const AppsContent = () => (
  <div>
    <h3 className="text-[14px] font-medium text-nua-title mb-4">Apps Externas</h3>
    <p className="text-[12px] text-nua-dark">Configuración de aplicaciones externas.</p>
  </div>
)

export function ConexionesContent() {
  const [activeSubTab, setActiveSubTab] = useState("bancos")

  const renderSubContent = () => {
    switch (activeSubTab) {
      case "bancos":
        return <BancosConfig />
      case "ia":
        return <IAContent />
      case "apps":
        return <AppsContent />
      default:
        return <BancosConfig />
    }
  }

  return (
    <div>
      <SubMenuBar activeTab={activeSubTab} onTabChange={setActiveSubTab} items={subMenuItems} />
      {renderSubContent()}
    </div>
  )
}
