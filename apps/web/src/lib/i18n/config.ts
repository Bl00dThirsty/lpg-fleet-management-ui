import commonFr from '../../../public/locales/fr/common.json'
import commonEn from '../../../public/locales/en/common.json'
import navFr from '../../../public/locales/fr/nav.json'
import navEn from '../../../public/locales/en/nav.json'
import fieldsFr from '../../../public/locales/fr/fields.json'
import fieldsEn from '../../../public/locales/en/fields.json'
import errorsFr from '../../../public/locales/fr/errors.json'
import errorsEn from '../../../public/locales/en/errors.json'
import bcFr from '../../../public/locales/fr/breadcrumbs.json'
import bcEn from '../../../public/locales/en/breadcrumbs.json'
import overviewFr from '../../../public/locales/fr/overview.json'
import overviewEn from '../../../public/locales/en/overview.json'
import dashboardFr from '../../../public/locales/fr/dashboard.json'
import dashboardEn from '../../../public/locales/en/dashboard.json'
import toursFr from '../../../public/locales/fr/tours.json'
import toursEn from '../../../public/locales/en/tours.json'
import pickupsFr from '../../../public/locales/fr/pickups.json'
import pickupsEn from '../../../public/locales/en/pickups.json'

export const resources = {
  fr: { common: commonFr, nav: navFr, fields: fieldsFr, errors: errorsFr, breadcrumbs: bcFr, overview: overviewFr, dashboard: dashboardFr, tours: toursFr, pickups: pickupsFr },
  en: { common: commonEn, nav: navEn, fields: fieldsEn, errors: errorsEn, breadcrumbs: bcEn, overview: overviewEn, dashboard: dashboardEn, tours: toursEn, pickups: pickupsEn },
} as const

export const defaultNS = 'common' as const
export const fallbackLng = 'fr' as const
