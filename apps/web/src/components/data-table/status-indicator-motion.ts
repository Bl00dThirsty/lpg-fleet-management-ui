export const TRANSIENT_STATUSES = ['SYNCING', 'PENDINGSYNC'] as const

export function isTransientStatus(status: string | null | undefined): boolean {
  return (TRANSIENT_STATUSES as readonly string[]).includes(status ?? '')
}

export function pingDotClasses(toneClass: string, pulse: boolean): string | null {
  if (!pulse) return null
  return `absolute inset-0 -m-0.5 animate-ping rounded-full opacity-50 motion-reduce:hidden ${toneClass}`
}
