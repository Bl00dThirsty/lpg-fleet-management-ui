import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { fallbackLng, defaultNS, resources } from './config'

export function createI18nForTest(lng: 'fr' | 'en' = 'fr') {
  const inst = i18n.createInstance()
  inst.use(initReactI18next).init({
    resources: resources as unknown as never,
    lng,
    fallbackLng,
    defaultNS,
    ns: ['common', 'nav', 'fields', 'errors', 'breadcrumbs', 'overview', 'dashboard', 'tours', 'pickups'],
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  })
  return inst
}

const singleton = i18n.createInstance()
singleton.use(initReactI18next).init({
  resources: resources as unknown as never,
  lng: 'fr',
  fallbackLng,
  defaultNS,
  ns: ['common', 'nav', 'fields', 'errors', 'breadcrumbs', 'overview', 'dashboard', 'tours', 'pickups'],
  interpolation: { escapeValue: false },
  returnEmptyString: false,
})

export default singleton
