import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'
export type LanguagePreference = 'fr-FR' | 'en-US'
export type DigestFrequency = 'realtime' | 'daily' | 'weekly' | 'never'

interface PreferencesState {
  theme: ThemePreference
  language: LanguagePreference
  emailDigest: DigestFrequency
  pushEnabled: boolean
  soundEnabled: boolean
  telemetryOptIn: boolean
  compactMode: boolean
  setTheme: (theme: ThemePreference) => void
  setLanguage: (language: LanguagePreference) => void
  setEmailDigest: (freq: DigestFrequency) => void
  setPushEnabled: (enabled: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
  setTelemetryOptIn: (enabled: boolean) => void
  setCompactMode: (enabled: boolean) => void
  reset: () => void
}

const defaults = {
  theme: 'system' as ThemePreference,
  language: 'fr-FR' as LanguagePreference,
  emailDigest: 'daily' as DigestFrequency,
  pushEnabled: true,
  soundEnabled: false,
  telemetryOptIn: true,
  compactMode: false,
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaults,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setEmailDigest: (emailDigest) => set({ emailDigest }),
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setTelemetryOptIn: (telemetryOptIn) => set({ telemetryOptIn }),
      setCompactMode: (compactMode) => set({ compactMode }),
      reset: () => set({ ...defaults }),
    }),
    {
      name: 'lpg-user-preferences',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        emailDigest: state.emailDigest,
        pushEnabled: state.pushEnabled,
        soundEnabled: state.soundEnabled,
        telemetryOptIn: state.telemetryOptIn,
        compactMode: state.compactMode,
      }),
    },
  ),
)