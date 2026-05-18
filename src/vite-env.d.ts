/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAILRADAR_API_KEY: string
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_MAPTILER_API_KEY: string
  readonly GEMINI_API_KEY: string
  readonly APP_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}