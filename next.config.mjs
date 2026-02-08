import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
}

export default withSentryConfig(nextConfig, {
  // Solo subir source maps en CI/producción
  silent: true,

  // Organización y proyecto Sentry (se configurarán con env vars)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // No subir source maps si no hay auth token
  ...(process.env.SENTRY_AUTH_TOKEN ? {} : {
    sourcemaps: { disable: true }
  }),
})
