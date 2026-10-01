import { describe, it, expect } from 'vitest'
import { createFakeAdapter } from './fake-adapter'
import { createApi } from './api'

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

  it('soft-deletes by setting deleted_at and hides the row from list', async () => {
    const created = await api.clients.create({ name: 'Soft' } as any)
    await api.clients.remove(created.id)
    // The row must remain in the collection with deleted_at set (soft delete),
    // and be excluded from default list reads.
    const all = await api.clients.list({ include_deleted: 'true' })
    const row = all.data.find((c: any) => c.id === created.id)
    expect(row?.deleted_at).toBeTruthy()
    const visible = await api.clients.list()
    expect(visible.data.some((c: any) => c.id === created.id)).toBe(false)
  })
})

describe('fake-adapter login', () => {
  it('includes org_type and site_ids on the logged-in user', async () => {
    const result = await api.auth.login({ email: 'b.ndoumbetane@csph.cm', password: 'password' })
    expect(result.user.org_type).toBeDefined()
    expect(Array.isArray(result.user.site_ids)).toBe(true)
  })
})
