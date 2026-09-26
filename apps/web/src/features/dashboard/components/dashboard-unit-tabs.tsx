import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  dashboardUnits,
  type DashboardUnit,
} from '../data/dashboard-quantity'

export function DashboardUnitTabs({
  unit,
  onUnitChange,
}: {
  unit: DashboardUnit
  onUnitChange: (unit: DashboardUnit) => void
}) {
  const { t } = useTranslation('dashboard')

  return (
    <Tabs
      aria-label={t('units.selector')}
      value={unit}
      onValueChange={(value) => onUnitChange(value as DashboardUnit)}
    >
      <TabsList>
        {dashboardUnits.map((candidate) => (
          <TabsTrigger key={candidate} value={candidate}>
            {t(`units.${candidate}`)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
