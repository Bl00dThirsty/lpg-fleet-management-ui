/**
 * Role → bespoke-screen contract.
 *
 * Uniform CRUD modules are rendered generically via `module/module-screen.tsx`
 * (driven by `config/modules/registry.ts`) and gated by `@lpg/permissions`.
 * This manifest is the single, explicit registry for the *bespoke* screens that
 * a role owns — the screens that are NOT a generic module view.
 *
 * Each role may register one screen per module key (e.g. `LIVREUR:scan`).
 * `module/custom-screens.tsx` consumes this manifest at runtime.
 */
import { type Role } from '@lpg/permissions'

import { AgentDeclarationsScreen } from '@/roles/agent/declarations-screen'
import { IntegrateurPdaScreen } from '@/roles/integrateur/pda-screen'
import { LivreurMissionsScreen } from '@/roles/livreur/missions-screen'
import { LivreurScanScreen } from '@/roles/livreur/scan-screen'
import { MarketeurDeliveryToursScreen } from '@/roles/marketeur/delivery-tours-screen'
import { MarketeurSupplyScreen } from '@/roles/marketeur/supply-screen'
import { SuperAdminMapScreen } from '@/roles/super-admin/map-screen'
import { SuperAdminRiskDashboardScreen } from '@/roles/super-admin/risk-dashboard-screen'
import { SuperAdminCustomRolesScreen } from '@/roles/super-admin/custom-roles-screen'
import { SupervisorInfraScreen } from '@/roles/supervisor/infra-screen'

import { type CustomScreenComponent } from '@/module/custom-screens'

type ScreenRegistration = {
  /** Source file that owns the screen. */
  file: string
  /** Exported component name. */
  component: CustomScreenComponent
  /** Module keys this screen is registered under (`role:module`). */
  modules: string[]
}

export const ROLE_MANIFEST: Record<Role, ScreenRegistration[]> = {
  SUPER_ADMIN: [
    {
      file: 'roles/super-admin/map-screen.tsx',
      component: SuperAdminMapScreen,
      modules: ['map'],
    },
    {
      file: 'roles/super-admin/risk-dashboard-screen.tsx',
      component: SuperAdminRiskDashboardScreen,
      modules: ['risks'],
    },
    {
      file: 'roles/super-admin/custom-roles-screen.tsx',
      component: SuperAdminCustomRolesScreen,
      modules: ['custom-roles'],
    },
  ],
  ADMIN: [],
  SUPERVISOR: [
    {
      file: 'roles/supervisor/infra-screen.tsx',
      component: SupervisorInfraScreen,
      modules: ['infra'],
    },
  ],
  INTEGRATEUR: [
    {
      file: 'roles/integrateur/pda-screen.tsx',
      component: IntegrateurPdaScreen,
      modules: ['pda'],
    },
  ],
  AGENT: [
    {
      file: 'roles/agent/declarations-screen.tsx',
      component: AgentDeclarationsScreen,
      modules: ['declarations'],
    },
  ],
  MARKETEUR: [
    {
      file: 'roles/marketeur/supply-screen.tsx',
      component: MarketeurSupplyScreen,
      modules: ['supply'],
    },
    {
      file: 'roles/marketeur/delivery-tours-screen.tsx',
      component: MarketeurDeliveryToursScreen,
      modules: ['delivery-tours'],
    },
  ],
  LIVREUR: [
    {
      file: 'roles/livreur/missions-screen.tsx',
      component: LivreurMissionsScreen,
      modules: ['missions'],
    },
    {
      file: 'roles/livreur/scan-screen.tsx',
      component: LivreurScanScreen,
      modules: ['scan'],
    },
  ],
}

/** Flatten the manifest into the `role:module` → component registry. */
export function buildCustomScreenRegistry(): Record<string, CustomScreenComponent> {
  const registry: Record<string, CustomScreenComponent> = {}
  for (const [role, registrations] of Object.entries(ROLE_MANIFEST)) {
    for (const reg of registrations) {
      for (const module of reg.modules) {
        registry[`${role}:${module}`] = reg.component
      }
    }
  }
  return registry
}
