import { describe, it, expect } from 'vitest'
import { createFakeAdapter } from '@lpg/api-client/src/fake-adapter'
import { createApi } from '@lpg/api-client/src/api'

const api = createApi(createFakeAdapter())

describe('fake-adapter write support (CRUD integration seam)', () => {
  it('creates, lists, patches and removes an entity', async () => {
    const created = (await api.clients.create({
      org_id: 'org-1',
      is_active: true,
    } as never)) as { id: string }

    expect(created.id).toBeTruthy()

    const listed = await api.clients.list({})
    expect(listed.data.find((c: { id: string }) => c.id === created.id)).toBeTruthy()

    const patched = (await api.clients.patch(created.id, {
      primary_contact_name: 'Jean',
    } as never)) as { primary_contact_name: string }
    expect(patched.primary_contact_name).toBe('Jean')

    await api.clients.remove(created.id)
    const after = await api.clients.list({})
    expect(after.data.find((c: { id: string }) => c.id === created.id)).toBeFalsy()
  })

  it('throws on missing id for patch/remove', async () => {
    await expect(api.clients.patch('does-not-exist', {} as never)).rejects.toThrow()
    await expect(api.clients.remove('does-not-exist')).rejects.toThrow()
  })
})
