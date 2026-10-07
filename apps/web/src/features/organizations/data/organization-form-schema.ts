import { z } from 'zod'
import type { OrganizationType, Region } from '@lpg/types'

export const REGIONS: { value: Region; label: string }[] = [
  { value: 'LITTORAL', label: 'Littoral (Douala)' },
  { value: 'CENTRE', label: 'Centre (Yaoundé)' },
  { value: 'OUEST', label: 'Ouest (Bafoussam)' },
  { value: 'SUDOUEST', label: 'Sud-Ouest (Limbé / Buéa)' },
  { value: 'NORD', label: 'Nord (Garoua)' },
  { value: 'EXTREMENORD', label: 'Extrême-Nord (Maroua)' },
  { value: 'ADAMAOUA', label: 'Adamaoua (Ngaoundéré)' },
  { value: 'SUD', label: 'Sud (Kribi / Ebolowa)' },
  { value: 'EST', label: 'Est (Bertoua)' },
  { value: 'NORDOUEST', label: 'Nord-Ouest (Bamenda)' },
]

export const SECTORS = [
  'Hôtellerie & Restauration (CHR)',
  'Industrie Agroalimentaire',
  'Industrie Lourde & Métallurgie',
  'Commerce & Distribution GPL',
  'Transport & Logistique',
  'Bâtiment & Travaux Publics',
  'Santé & Établissements Publics',
  'Autre',
]

export const CITY_COORDINATES = [
  { city: 'Douala', lat: 4.0511, lng: 9.7085, region: 'LITTORAL' as Region },
  { city: 'Yaoundé', lat: 3.8667, lng: 11.5167, region: 'CENTRE' as Region },
  { city: 'Bafoussam', lat: 5.4778, lng: 10.4176, region: 'OUEST' as Region },
  { city: 'Limbé', lat: 4.0242, lng: 9.2140, region: 'SUDOUEST' as Region },
  { city: 'Garoua', lat: 9.3000, lng: 13.4000, region: 'NORD' as Region },
  { city: 'Maroua', lat: 10.5956, lng: 14.3247, region: 'EXTREMENORD' as Region },
]

export const ORG_TYPE_OPTIONS: {
  value: OrganizationType
  label: string
  description: string
}[] = [
  {
    value: 'MARKETEUR',
    label: 'Marketeur (Société de distribution)',
    description: 'Titulaire d’un agrément de distribution de GPL avec réseau de centres ou stations.',
  },
  {
    value: 'TRANSPORTEUR',
    label: 'Transporteur agréé',
    description: 'Société logistique habilitée pour le transport vrac ou conditionné.',
  },
  {
    value: 'DEPOT',
    label: 'Dépôt / Centre de stockage (SCDP/SNH)',
    description: 'Point de stockage amont ou centre de chargement.',
  },
  {
    value: 'REGULATEUR',
    label: 'Régulateur institutionnel (CSPH / Autorité)',
    description: 'Organisme de contrôle des prix, des quotas et de la conformité.',
  },
  {
    value: 'CLIENT',
    label: 'Client distributeur / Point de consommation',
    description: 'Entreprise cliente recevant des livraisons de gaz vrac ou bouteilles 50 kg.',
  },
]

export function defaultRoleForOrgType(type: OrganizationType): string {
  switch (type) {
    case 'TRANSPORTEUR':
      return 'TRANSPORTEUR'
    case 'MARKETEUR':
      return 'MARKETEUR'
    case 'DEPOT':
      return 'AGENT'
    case 'REGULATEUR':
      return 'SUPERVISOR'
    case 'CLIENT':
      return 'LIVREUR'
    default:
      return 'LIVREUR'
  }
}

export const organizationSiteSchema = z.object({
  name: z.string().min(2, 'Le nom du site est requis'),
  region: z.string().min(1, 'La région est requise'),
  address: z.string().min(3, 'L’adresse physique est requise'),
  latitude: z
    .number()
    .min(1.5, 'Latitude invalide au Cameroun')
    .max(13.5, 'Latitude hors Cameroun'),
  longitude: z
    .number()
    .min(8.0, 'Longitude invalide au Cameroun')
    .max(16.5, 'Longitude hors Cameroun'),
  site_contact_name: z.string().optional(),
  site_contact_phone: z.string().optional(),
  capacity_info: z.string().optional(),
})

export const organizationFormSchema = z
  .object({
    name: z.string().min(2, 'La raison sociale est requise'),
    type: z.enum([
      'REGULATEUR',
      'DEPOT',
      'MARKETEUR',
      'TRANSPORTEUR',
      'CLIENT',
    ]),
    registration_number: z.string().min(3, 'Le numéro RCCM est requis'),
    tax_id: z.string().min(3, 'Le NIU fiscal est requis'),
    industry_sector: z.string().min(2, 'Le secteur d’activité est requis'),
    billing_address: z.string().min(3, 'L’adresse de facturation / siège est requise'),
    payment_terms: z.number().min(0, 'Délai positif requis'),
    credit_limit: z.number().min(0, 'Plafond positif requis'),
    is_active: z.boolean(),
    primary_contact_name: z.string().min(2, 'Le nom du contact est requis'),
    primary_contact_phone: z.string().min(6, 'Numéro de téléphone requis'),
    primary_contact_email: z.string().email('Adresse e-mail valide requise'),
    sites: z
      .array(organizationSiteSchema)
      .min(1, 'Veuillez configurer au moins un site ou point opérationnel'),

    // Compte de connexion optionnel
    create_account: z.boolean(),
    account_first_name: z.string().optional(),
    account_last_name: z.string().optional(),
    account_email: z.string().optional(),
    account_system_role: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.create_account) {
      if (!data.account_first_name || data.account_first_name.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['account_first_name'],
          message: 'Le prénom du titulaire est requis (2 caractères min)',
        })
      }
      if (!data.account_last_name || data.account_last_name.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['account_last_name'],
          message: 'Le nom du titulaire est requis (2 caractères min)',
        })
      }
      if (
        !data.account_email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.account_email)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['account_email'],
          message: 'Une adresse e-mail valide est requise pour le compte',
        })
      }
    }
  })

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>
export type OrganizationSiteValues = z.infer<typeof organizationSiteSchema>
