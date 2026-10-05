import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { apiAdapter } from '@lpg/api-client'
import { useAuthStore } from '@/store/auth-store'
import { useToursStore } from '@/store/tours-store'
import { PickupsCreateWizard } from './pickups-create-wizard'

const options = {
  sources: [{ id: 'snh', name: 'SNH — Dépôt', org_id: 'snh-org' }],
  destinations: [{ id: 'site', name: 'SCTM Bonabéri', org_id: 'sctm' }],
  organizations: [{ id: 'sctm', name: 'SCTM' }],
  vehicles: [
    { id: 'truck', license_plate: 'LT-TEST', org_id: 'sctm', type: 'VRAC' },
  ],
  drivers: [
    {
      id: 'driver',
      first_name: 'Chauffeur',
      last_name: 'SCTM',
      org_id: 'sctm',
    },
  ],
  users: [
    { id: 'livreur', first_name: 'Livreur', last_name: 'SCTM', org_id: 'sctm' },
  ],
}
describe('pickup planning wizard', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'planner',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'Test',
        system_role: 'MARKETEUR',
        org_id: 'sctm',
      },
    })
    vi.spyOn(apiAdapter, 'request').mockResolvedValue(options)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    useAuthStore.setState({ user: null })
  })
  it('shows inline errors and submits a complete plan with the selected crew', async () => {
    const created = vi.fn()
    const save = vi
      .spyOn(useToursStore.getState(), 'createPickupAsync')
      .mockResolvedValue({ id: 'saved' } as Awaited<
        ReturnType<
          ReturnType<typeof useToursStore.getState>['createPickupAsync']
        >
      >)
    const screen = await render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <PickupsCreateWizard open onOpenChange={vi.fn()} onCreated={created} />
      </QueryClientProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }))
    await expect
      .element(screen.getByText('Sélectionnez un dépôt SNH ou SCDP'))
      .toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
    await userEvent.selectOptions(
      screen.getByLabelText('Dépôt d’enlèvement'),
      'snh',
    )
    await userEvent.selectOptions(
      screen.getByLabelText('Site destinataire'),
      'site',
    )
    await userEvent.fill(
      screen.getByLabelText('Date et heure prévues'),
      '2026-10-06T10:00',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }))
    await userEvent.fill(screen.getByLabelText('Quantité (TM)'), '20')
    await userEvent.selectOptions(screen.getByLabelText('Véhicule'), 'truck')
    await userEvent.selectOptions(
      screen.getByLabelText('Chauffeur', { exact: true }),
      'driver',
    )
    await userEvent.selectOptions(
      screen.getByLabelText('Livreur', { exact: true }),
      'livreur',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }))
    await expect
      .element(screen.getByText('SNH — Dépôt → SCTM Bonabéri'))
      .toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
    await userEvent.click(
      screen.getByRole('button', { name: 'Planifier l’enlèvement' }),
    )
    await expect.poll(() => save.mock.calls.length).toBe(1)
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        source_site_id: 'snh',
        destination_site_id: 'site',
        requested_quantity: 20,
        vehicle_id: 'truck',
        driver_id: 'driver',
        livreur_user_id: 'livreur',
        marketeur_org_id: 'sctm',
      }),
    )
    expect(created).toHaveBeenCalledWith('saved')
  })
})
