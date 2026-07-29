import { getRouteApi } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { MarketersTable } from './components/marketers-table'
import { marketers } from './marketers'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'

const route = getRouteApi('/_authenticated/marketers/')

export function MarketersPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const handleViewDetails = (marketer: { id: string }) => {
    navigate({ to: `/marketers/${marketer.id}` })
  }

  return (
    <PageShell>
      <PageHeader
        title='Marketers'
        icon={Building2}
        description='Réseau de marketeurs partenaires et leur activité.'
      />

      <SectionCard>
        <MarketersTable
          data={marketers}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
        />
      </SectionCard>
    </PageShell>
  )
}
