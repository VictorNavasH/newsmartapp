import type { MetadataRoute } from "next"

// Manifest PWA: permite instalar la app en la pantalla de inicio del móvil
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NÜA Smart App",
    short_name: "NÜA",
    description: "Dashboard inteligente para gestión de restaurantes",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#ffffff",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  }
}
