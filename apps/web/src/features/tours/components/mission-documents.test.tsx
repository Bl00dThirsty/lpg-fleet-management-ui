import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { apiAdapter } from '@lpg/api-client'
import { MissionDocuments } from './mission-documents'

const setup = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MissionDocuments missionId="pickup-test" />
    </QueryClientProvider>,
  )
afterEach(() => vi.restoreAllMocks())
describe('mission documents', () => {
  it('explains when the driver has not sent any proof', async () => {
    vi.spyOn(apiAdapter, 'request').mockResolvedValue([])
    const screen = await setup()
    await expect
      .element(
        screen.getByText(
          'Aucun document transmis par le livreur pour le moment.',
        ),
      )
      .toBeInTheDocument()
  })
  it('opens the proof and refreshes its private URL', async () => {
    const request = vi
      .spyOn(apiAdapter, 'request')
      .mockResolvedValue([
        {
          id: 'loading',
          label: 'Bon d’enlèvement',
          captured_at: null,
          url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        },
      ])
    const screen = await setup()
    await userEvent.click(
      screen.getByRole('button', { name: /Bon d’enlèvement/ }),
    )
    await expect.element(screen.getByRole('dialog')).toBeVisible()
    await expect
      .element(screen.getByRole('img', { name: 'Bon d’enlèvement' }))
      .toBeVisible()
    await expect.poll(() => request.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(request).toHaveBeenCalledWith('/tours/pickup-test/documents')
  })
})
