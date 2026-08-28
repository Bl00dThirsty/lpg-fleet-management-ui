/** Shared runtime configuration helpers (workspace-wide). */

export function getEnv(key: string, fallback = ''): string {
  return (import.meta.env[key as keyof ImportMetaEnv] as string) ?? fallback
}

export const isDev = import.meta.env.DEV
export const isProd = import.meta.env.PROD

export const API_BASE_URL = getEnv('VITE_API_BASE_URL', '/api')
export const ARCGIS_API_KEY = getEnv('VITE_ARCGIS_API_KEY')
