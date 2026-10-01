import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { ToursTable } from './tours-table'
import type { TourActivity } from '../data/tour-activity'

function row(
  reference: string,
  tourneeStatus: TourActivity['tourneeStatus'],
  execution_mode: TourActivity['execution_mode'],
): TourActivity {
  return {
    id: reference,
    reference,
    tourneeStatus,
    tourneeType: 'BOUTEILLES50KG',
    execution_mode,
    marketeur_name: 'TotalEnergies Mvan',
    transporter_name: null,
    vehicle_plate: null,
    driver_name: 'ESSOMBA Pierre',
    livreur_name: 'ESSOMBA Pierre',
    requested_quantity: 120,
    loaded_quantity: null,
    delivered_quantity: null,
    checkpoint_count: 1,
    completed_checkpoints: 0,
    created_at: '2026-09-28T00:00:00Z',
    transport_assigned_at: null,
    sla_transporter_no_ack: false,
    sla_unassigned_too_long: false,
    anomaly_ids: [],
  } as unknown as TourActivity
}

const ROWS = [
  row('TOT-MVAN-001', 'PLANNED', 'INTERNAL'),
  row('TOT-MVAN-002', 'INPROGRESS', 'INTERNAL'),
  row('TRP-EXT-009', 'PLANNED', 'EXTERNAL'),
]

describe('ToursTable filters and group-by', () => {
  it('search narrows rows by reference', async () => {
    const { getByPlaceholder, getByText, queryByText } = (await render(
      <ToursTable rows={ROWS} onOpenDetails={vi.fn()} />,
    )) as any
    await userEvent.fill(getByPlaceholder('Rechercher une reference, marketeur...'), 'TRP-EXT')
    await expect.element(getByText('TRP-EXT-009')).toBeInTheDocument()
    expect(queryByText('TOT-MVAN-001')).toBeNull()
  })

  it('status facet keeps only matching rows', async () => {
    const { getByRole, getByText, queryByText } = (await render(
      <ToursTable rows={ROWS} onOpenDetails={vi.fn()} />,
    )) as any
    await userEvent.click(getByRole('button', { name: /Statut/ }))
    await userEvent.click(getByRole('option', { name: 'En transit' }))
    await expect.element(getByText('TOT-MVAN-002')).toBeInTheDocument()
    expect(queryByText('TOT-MVAN-001')).toBeNull()
    expect(queryByText('TRP-EXT-009')).toBeNull()
  })

  it('group-by mode renders one group header per mode', async () => {
    const screen = await render(<ToursTable rows={ROWS} onOpenDetails={vi.fn()} />)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'execution_mode')
    await expect.element(screen.getByText(/INTERNAL \(2\)/)).toBeInTheDocument()
    await expect.element(screen.getByText(/EXTERNAL \(1\)/)).toBeInTheDocument()
  })
})
