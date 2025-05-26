# New Smart App

Panel de control inteligente desarrollado con Next.js, React y Tailwind CSS.

## Índice

1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Componentes](#componentes)
   - [Sidebar](#sidebar)
   - [TopBar](#topbar)
   - [PageHeader](#pageheader)
   - [KPI Cards](#kpi-cards)
   - [MenuBar (Sistema de Pestañas)](#menubar-sistema-de-pestañas)
3. [Estilos y Diseño](#estilos-y-diseño)
   - [Colores](#colores)
   - [Tipografía](#tipografía)
   - [Efectos Visuales](#efectos-visuales)
4. [Patrones de Implementación](#patrones-de-implementación)
   - [Creación de Nuevas Páginas](#creación-de-nuevas-páginas)
   - [Implementación de KPIs](#implementación-de-kpis)
   - [Implementación de Sistemas de Pestañas](#implementación-de-sistemas-de-pestañas)

## Estructura del Proyecto

El proyecto sigue la estructura de carpetas del App Router de Next.js:

\`\`\`
/app                    # Carpeta principal de la aplicación
  /dashboard            # Página de dashboard
  /ventas               # Página de análisis de ventas
  /costes               # Página de análisis de costes
  /kpis                 # Página de análisis de KPIs
  /...                  # Otras páginas
  /layout.tsx           # Layout principal
  /globals.css          # Estilos globales
/components             # Componentes reutilizables
  /ui                   # Componentes de UI
  /sidebar.tsx          # Componente de barra lateral
  /top-bar.tsx          # Componente de barra superior
  /page-header.tsx      # Componente de encabezado de página
/lib                    # Utilidades y funciones
/public                 # Archivos estáticos
\`\`\`

## Componentes

### Sidebar

La barra lateral proporciona navegación principal entre las diferentes secciones de la aplicación.

**Características:**
- Menú vertical con iconos y texto
- Resaltado de la página activa
- Logo en la parte superior

**Implementación:**
\`\`\`jsx
<Sidebar />
\`\`\`

### TopBar

La barra superior proporciona funcionalidades globales como búsqueda, selección de periodo y acceso al perfil.

**Características:**
- Campo de búsqueda
- Selector de periodo
- Notificaciones
- Acceso al perfil de usuario

**Implementación:**
\`\`\`jsx
<TopBar />
\`\`\`

### PageHeader

Encabezado consistente para todas las páginas.

**Características:**
- Título de la página (26px)
- Texto descriptivo (12px)
- Espaciado reducido entre título y descripción

**Implementación:**
\`\`\`jsx
<PageHeader title="Título de la Página" />
\`\`\`

### KPI Cards

Tarjetas para mostrar indicadores clave de rendimiento.

**Características:**
- Efecto de borde animado en hover
- Degradado suave que entra desde el lado izquierdo
- Colores condicionales según el estado (positivo/negativo)
- Estructura consistente con título, valor principal, tendencia y proyección

**Especificaciones de Texto:**
- Título: 14px, color #364f6b (nua-title)
- Valor Principal: text-xl, color condicional según estado
- Cambio/Tendencia: 10px, color condicional según estado
- Subtítulo/Proyección: 12px, color #227c9d

**Implementación:**
\`\`\`jsx
<StarBorder status="positive">
  <h3 className="text-[14px] font-medium text-nua-title">Título del KPI</h3>
  <div className="mt-2 flex items-baseline">
    <p className="text-xl font-bold" style={{ color: colors.positive }}>
      €42,850
    </p>
    <span className="ml-2 text-[10px] flex items-center" style={{ color: colors.positive }}>
      <ArrowUp size={14} className="mr-0.5" />
      +7.5% vs mes anterior
    </span>
  </div>
  <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Proyección: €68,540</p>
</StarBorder>
\`\`\`

### MenuBar (Sistema de Pestañas)

Sistema de pestañas para navegar entre subpáginas dentro de una página principal.

**Características:**
- Animación de rotación 3D al pasar el cursor
- Texto de 14px para mejor legibilidad
- Pestaña activa indicada por:
  - Texto en negrita con color #364f6b (nua-title), igual que los títulos del dashboard
  - Icono en color específico de cada pestaña
- Centrado en la página para mejor equilibrio visual

**Implementaciones:**
- **Ventas**: Pestañas para "Resumen", "Evolución", "Productos", "Tickets" y "Patrones"
- **Satisfacción**: Pestañas para "Satisfacción General", "Reviews Google" y "Encuesta Interna"
- **Configuración**: Pestañas para "General", "Datos Operativos", "Datos Base" y "Conexiones"
- **KPIs**: Pestañas para "Económicos", "Operativos", "Smart Kitchen" y "Sala"

**Implementación:**

1. Importar el componente:
\`\`\`jsx
import { MenuBar } from "@/components/menu-bar"
\`\`\`

2. Configurar el estado para controlar la pestaña activa:
\`\`\`jsx
const [activeTab, setActiveTab] = useState("pestaña1")
\`\`\`

3. Renderizar el componente centrado:
\`\`\`jsx
<div className="flex justify-center mb-6">
  <MenuBar activeTab={activeTab} onTabChange={setActiveTab} />
</div>
\`\`\`

4. Renderizar el contenido según la pestaña activa:
\`\`\`jsx
const renderContent = () => {
  switch (activeTab) {
    case "pestaña1":
      return <Contenido1 />
    case "pestaña2":
      return <Contenido2 />
    // ...
  }
}
\`\`\`

5. Para adaptar a nuevas pestañas, modificar el array `menuItems` en `menu-bar.tsx`:
\`\`\`jsx
const menuItems = [
  {
    id: "pestaña1",
    icon: <IconoPestaña1 className="h-4 w-4" />,
    label: "Pestaña 1",
    iconColor: "text-[#colorHex]",
    color: "#colorHex",
  },
  // Añadir más pestañas...
]
\`\`\`

## Estilos y Diseño

### Colores

El proyecto utiliza una paleta de colores consistente definida en Tailwind:

\`\`\`js
colors: {
  nua: {
    primary: "#1EADB8", // Color principal turquesa
    accent: "#0F5A8E", // Color azul oscuro
    neutral: "#F5F7FA", // Color de fondo claro
    dark: "#2A3342", // Color oscuro para textos
    light: "#FFFFFF", // Color blanco
    title: "#364f6b", // Color para títulos
    subtitle: "#227c9d", // Color para subtítulos
  },
}
\`\`\`

Además, se utilizan colores condicionales para estados:
- Positivo: `#17c3b2`
- Negativo: `#fe6d73`
- Neutral: `#ffcb77` // Color ámbar/naranja para alertas no peligrosas

**Colores específicos para pestañas:**
- Rosa: `#ff4797` (usado en "Conexiones")
- Púrpura: `#edadff` (usado en "Datos Base", "Sala" y "Patrones")
- Cielo: `#47b0d7` (usado en "Resumen" y "Datos Operativos")
- Índigo: `#ffce85` (usado en "General" de Configuración y "Tickets")
- Amarillo: `#eab308` (usado en "Económicos")
- Naranja: `#f97316` (usado en "Operativos")
- Rojo: `#dc2626` (usado en "Smart Kitchen")
- Azul Google: `#4285f4` (usado en "Reviews Google")
- Verde Google: `#34a853` (usado en "Encuesta Interna")
- Verde: `#22c55e` (usado en "Productos")
- Turquesa: `#49eada` (usado en "Evolución")
- Ámbar: `#ffcb77` (usado en "Satisfacción General")

### Tipografía

El proyecto utiliza la fuente Inter de Google Fonts con tamaños consistentes:

- Títulos de página: 26px
- Títulos de KPI: 14px
- Valores principales de KPI: text-xl
- Cambio/Tendencia: 10px
- Subtítulos/Proyecciones: 12px
- Texto general: text-sm
- Texto de pestañas (MenuBar): 14px
  - Texto activo: negrita, color #364f6b (nua-title)
  - Texto inactivo: normal, color gris

### Efectos Visuales

**StarBorder (Efecto de Borde Animado)**

Componente que proporciona un efecto de borde animado y degradado interior para las tarjetas KPI.

**Características:**
- Animación en hover
- Degradado que entra desde el lado izquierdo
- Colores condicionales según el estado

**MenuBar (Efecto de Rotación 3D)**

Componente que proporciona un efecto de rotación 3D para las pestañas.

**Características:**
- Animación de rotación 3D en hover
- Sin degradado fijo para la pestaña activa
- Pestaña activa indicada por texto en negrita (color #364f6b) e icono en color

## Patrones de Implementación

### Creación de Nuevas Páginas

1. Crear un nuevo archivo en la carpeta `/app` con el nombre de la ruta deseada
2. Utilizar el componente `PageHeader` para mantener la consistencia
3. Implementar el contenido específico de la página

\`\`\`jsx
import PageHeader from "@/components/page-header"

export default function NuevaPagina() {
  return (
    <>
      <PageHeader title="Título de la Nueva Página" />
      <p>
        Contenido de <strong>Nueva Página</strong> aquí.
      </p>
    </>
  )
}
\`\`\`

### Implementación de KPIs

1. Importar el componente `StarBorder`
2. Definir los colores condicionales
3. Implementar la estructura consistente para cada KPI

\`\`\`jsx
import StarBorder from "@/components/ui/star-border"
import { ArrowUp, ArrowDown } from 'lucide-react'

// Definir colores condicionales
const colors = {
  positive: "#17c3b2",
  negative: "#fe6d73",
  neutral: "#364f6b",
}

// Implementar KPI
<StarBorder status="positive">
  <h3 className="text-[14px] font-medium text-nua-title">Título del KPI</h3>
  <div className="mt-2 flex items-baseline">
    <p className="text-xl font-bold" style={{ color: colors.positive }}>
      €42,850
    </p>
    <span className="ml-2 text-[10px] flex items-center" style={{ color: colors.positive }}>
      <ArrowUp size={14} className="mr-0.5" />
      +7.5% vs mes anterior
    </span>
  </div>
  <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Proyección: €68,540</p>
</StarBorder>
\`\`\`

### Implementación de Sistemas de Pestañas

1. Importar el componente `MenuBar`
2. Configurar el estado para controlar la pestaña activa
3. Renderizar el componente centrado:
\`\`\`jsx
<div className="flex justify-center mb-6">
  <MenuBar activeTab={activeTab} onTabChange={setActiveTab} />
</div>
\`\`\`
4. Definir los componentes para cada subpágina
5. Renderizar el contenido según la pestaña activa

\`\`\`jsx
"use client"

import { useState } from "react"
import PageHeader from "@/components/page-header"
import { MenuBar } from "@/components/menu-bar"

// Componentes para cada subpágina
const Subpagina1 = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">Subpágina 1</h2>
    <p>Contenido de la subpágina 1 aquí.</p>
  </div>
)

const Subpagina2 = () => (
  <div>
    <h2 className="text-lg font-medium text-nua-title mb-4">Subpágina 2</h2>
    <p>Contenido de la subpágina 2 aquí.</p>
  </div>
)

export default function PaginaConPestanas() {
  // Estado para controlar qué pestaña está activa
  const [activeTab, setActiveTab] = useState("subpagina1")

  // Renderizar el contenido según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case "subpagina1":
        return <Subpagina1 />
      case "subpagina2":
        return <Subpagina2 />
      default:
        return <Subpagina1 />
    }
  }

  return (
    <>
      <PageHeader title="Página con Pestañas" />

      {/* MenuBar con la pestaña activa - centrado */}
      <div className="flex justify-center mb-6">
        <MenuBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Contenido de la subpágina activa */}
      <div className="mt-6">{renderContent()}</div>
    </>
  )
}
\`\`\`

Para adaptar el `MenuBar` a nuevas pestañas, modificar el array `menuItems` en `menu-bar.tsx`:

\`\`\`jsx
// En components/menu-bar.tsx
const menuItems = [
  {
    id: "subpagina1",
    icon: <IconoSubpagina1 className="h-4 w-4" />,
    label: "Subpágina 1",
    iconColor: "text-[#colorHex]",
    color: "#colorHex",
  },
  {
    id: "subpagina2",
    icon: <IconoSubpagina2 className="h-4 w-4" />,
    label: "Subpágina 2",
    iconColor: "text-[#colorHex]",
    color: "#colorHex",
  },
  // Añadir más pestañas...
]
\`\`\`
