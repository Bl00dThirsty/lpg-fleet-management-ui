import { useEffect, useState } from 'react'
import { api } from '@lpg/api-client'
import { curated, deviceStats } from '@lpg/mock-data'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'
import { AttentionList } from './components/attention-list'
import { DevicesTable } from './components/devices-table'
import { KpiTiles } from './components/kpi-tiles'
import { StatusBreakdown } from './components/status-breakdown'
import { TypeBreakdown } from './components/type-breakdown'
import { toIntegrateurDashboardData } from './data/integrateur-dashboard'
import { pickRecentlySynced } from './lib/integrateur-dashboard'
import type { IntegrateurDashboardData } from './data/integrateur-dashboard'

function seedData(): IntegrateurDashboardData {
  return toIntegrateurDashboardData(deviceStats())
}

const RECENT_DEVICES_LIMIT = 5

export function IntegrateurDashboardPage() {
  // Seed (05_devices.json) renders immediately; the planned backend aggregate
  // (GET /api/v1/devices/stats — a frontend-only contract, not yet in
  // lpg-backend) replaces it once wired. Until then the API call fails, so we
  // keep the seed rather than blanking the page.
  const [data, setData] = useState<IntegrateurDashboardData>(() => seedData())
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .deviceStats()
      .then((stats) => {
        if (cancelled) return
        setData(toIntegrateurDashboardData(stats))
        setLive(true)
      })
      .catch(() => {
        // Endpoint not available yet — keep the seed data.
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageShell fluid className='space-y-6 bg-muted/20 pb-10'>
      <PageHeader
        title='Tableau de bord Intégrateur'
        description="Supervision du parc d'appareils IoT : enregistrement, affectation véhicule, installations, suivi des états et signalements. Aucune donnée commerciale."
      />

      <section className='flex items-center gap-2 text-xs text-muted-foreground'>
        <span className={`size-2 rounded-full ${live ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        {live ? 'Données temps réel' : 'Données de démonstration (seed) — endpoint /api/v1/devices/stats à implémenter côté backend'}
      </section>

      <section>
        <KpiTiles kpis={data.kpis} />
      </section>

      <section className='grid gap-6 lg:grid-cols-2'>
        <StatusBreakdown slices={data.statusSlices} />
        <TypeBreakdown slices={data.typeSlices} />
      </section>

      <section className='grid gap-6 lg:grid-cols-2'>
        <SectionCard
          title='Appareils hors ligne'
          description='Appareils sans signal — à diagnostiquer ou signaler.'
        >
          <AttentionList rows={data.attention} />
        </SectionCard>
        <SectionCard
          title='Parc des appareils'
          description={`${RECENT_DEVICES_LIMIT} derniers appareils synchronisés — table devices (seed 05_devices.json).`}
        >
          <DevicesTable devices={pickRecentlySynced(curated.devices, RECENT_DEVICES_LIMIT)} />
        </SectionCard>
      </section>
    </PageShell>
  )
}
