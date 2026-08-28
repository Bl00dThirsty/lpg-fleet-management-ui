import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePreferencesStore, type LanguagePreference } from '@/store/preferences-store'
import i18n from '@/lib/i18n'

export function LanguageSwitcher({ variant = 'header' }: { variant?: 'header' | 'settings' } = {}) {
  const lang = usePreferencesStore((s) => s.language)
  const setLang = usePreferencesStore((s) => s.setLanguage)
  const { t } = useTranslation('common')

  useEffect(() => {
    document.documentElement.lang = lang.slice(0, 2)
    void i18n.changeLanguage(lang.slice(0, 2))
  }, [lang])

  const onChange = (v: string) => setLang(v as LanguagePreference)

  return (
    <div className={variant === 'header' ? 'flex items-center gap-1' : ''}>
      <Select value={lang} onValueChange={onChange}>
        <SelectTrigger aria-label={t('language.label')} className={variant === 'header' ? 'h-8 w-[110px]' : ''}>
          <Languages className="mr-1.5 size-3.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fr-FR">Français</SelectItem>
          <SelectItem value="en-US">English</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
