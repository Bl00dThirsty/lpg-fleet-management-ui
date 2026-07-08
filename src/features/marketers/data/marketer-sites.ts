import { type SiteType, type SiteStatus } from '@/features/sites/data/sites'

export type MarketerSite = {
  id: string
  marketerId: string
  name: string
  type: SiteType
  city: string
  region: string
  status: SiteStatus
}

/**
 * Sites propres à chaque marketer.
 * Pour ajouter les sites d'un nouveau marketer, il suffit d'ajouter
 * des entrées avec le `marketerId` correspondant.
 */
export const marketerSites: MarketerSite[] = [
  // ── TOTALENERGIES (MKT-001) ──────────────────────────────
  { id: 'ms-total-01', marketerId: 'MKT-001', name: 'Total Bonanjo', type: 'marketer', city: 'Douala', region: 'Littoral', status: 'active' },
  { id: 'ms-total-02', marketerId: 'MKT-001', name: 'Total Nsam', type: 'marketer', city: 'Yaoundé', region: 'Centre', status: 'active' },
  { id: 'ms-total-03', marketerId: 'MKT-001', name: 'Total Bonamoussadi', type: 'marketer', city: 'Douala', region: 'Littoral', status: 'active' },
  { id: 'ms-total-04', marketerId: 'MKT-001', name: 'Total Mokolo', type: 'marketer', city: 'Yaoundé', region: 'Centre', status: 'active' },
  { id: 'ms-total-05', marketerId: 'MKT-001', name: 'Dépôt Total Bonaberi', type: 'depot', city: 'Douala', region: 'Littoral', status: 'active' },
  { id: 'ms-total-06', marketerId: 'MKT-001', name: 'Dépôt Total Nsam', type: 'depot', city: 'Yaoundé', region: 'Centre', status: 'active' },
  { id: 'ms-total-07', marketerId: 'MKT-001', name: 'Total Ebolowa', type: 'delivery-point', city: 'Ebolowa', region: 'Sud', status: 'active' },

  // ── TRADEX (MKT-006) ─────────────────────────────────────
  { id: 'ms-tradex-01', marketerId: 'MKT-006', name: 'Tradex Akwa', type: 'marketer', city: 'Douala', region: 'Littoral', status: 'active' },
  { id: 'ms-tradex-02', marketerId: 'MKT-006', name: 'Tradex Biyem-Assi', type: 'marketer', city: 'Yaoundé', region: 'Centre', status: 'active' },
  { id: 'ms-tradex-03', marketerId: 'MKT-006', name: 'Tradex Ndokoti', type: 'marketer', city: 'Douala', region: 'Littoral', status: 'active' },
  { id: 'ms-tradex-04', marketerId: 'MKT-006', name: 'Dépôt Tradex Bonaberi', type: 'depot', city: 'Douala', region: 'Littoral', status: 'active' },
  { id: 'ms-tradex-05', marketerId: 'MKT-006', name: 'Tradex Bafoussam', type: 'marketer', city: 'Bafoussam', region: 'Ouest', status: 'active' },
  { id: 'ms-tradex-06', marketerId: 'MKT-006', name: 'Tradex Garoua', type: 'delivery-point', city: 'Garoua', region: 'Nord', status: 'planned' },

  // ── CAMGAZ (MKT-002) ─────────────────────────────────────
  { id: 'ms-camgaz-01', marketerId: 'MKT-002', name: 'Camgaz Douala Bassa', type: 'marketer', city: 'Douala', region: 'Littoral', status: 'active' },
  { id: 'ms-camgaz-02', marketerId: 'MKT-002', name: 'Camgaz Yaoundé Mvan', type: 'marketer', city: 'Yaoundé', region: 'Centre', status: 'active' },
  { id: 'ms-camgaz-03', marketerId: 'MKT-002', name: 'Dépôt Camgaz Bonaberi', type: 'depot', city: 'Douala', region: 'Littoral', status: 'active' },
  { id: 'ms-camgaz-04', marketerId: 'MKT-002', name: 'Centre Emplisseur Camgaz Douala', type: 'filling-center', city: 'Douala', region: 'Littoral', status: 'active' },
  { id: 'ms-camgaz-05', marketerId: 'MKT-002', name: 'Camgaz Bamenda', type: 'delivery-point', city: 'Bamenda', region: 'Nord-Ouest', status: 'active' },

  // ── OLA ENERGY (MKT-003) ─────────────────────────────────
  { id: 'ms-ola-01', marketerId: 'MKT-003', name: 'Ola Energy Deido', type: 'marketer', city: 'Douala', region: 'Littoral', status: 'active' },
  { id: 'ms-ola-02', marketerId: 'MKT-003', name: 'Ola Energy Ngousso', type: 'marketer', city: 'Yaoundé', region: 'Centre', status: 'active' },
  { id: 'ms-ola-03', marketerId: 'MKT-003', name: 'Ola Energy Bafoussam', type: 'marketer', city: 'Bafoussam', region: 'Ouest', status: 'active' },
  { id: 'ms-ola-04', marketerId: 'MKT-003', name: 'Dépôt Ola Energy Douala', type: 'depot', city: 'Douala', region: 'Littoral', status: 'active' },
  { id: 'ms-ola-05', marketerId: 'MKT-003', name: 'Ola Energy Kribi', type: 'delivery-point', city: 'Kribi', region: 'Sud', status: 'planned' },
]

export function getMarketerSites(marketerId: string): MarketerSite[] {
  return marketerSites.filter((s) => s.marketerId === marketerId)
}
