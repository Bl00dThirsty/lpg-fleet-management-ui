/**
 * Short, unobtrusive notification sound (Web Audio API). Enabled by default;
 * a settings toggle can pass `enabled=false`.
 */

let ctx: AudioContext | null = null

export function shouldPlaySound(enabled: boolean | undefined): boolean {
  return enabled !== false
}

export function playNotificationSound(): void {
  try {
    ctx = ctx ?? new AudioContext()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.18)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.5)
  } catch {
    /* audio not available (SSR / headless) — ignore */
  }
}
