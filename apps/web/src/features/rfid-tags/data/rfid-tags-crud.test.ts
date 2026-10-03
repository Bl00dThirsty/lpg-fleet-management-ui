import { describe, expect, it } from 'vitest'
import { rfidTagFields, rfidTagFromForm } from './rfid-tags-crud'

describe('rfid-tags-crud config', () => {
  it('requires tag_id and status', () => {
    expect(rfidTagFields.find((f) => f.name === 'tag_id')?.required).toBe(true)
    expect(rfidTagFields.find((f) => f.name === 'status')?.required).toBe(true)
  })
  it('maps status and current_site_id', () => {
    const out = rfidTagFromForm({ tag_id: 'EPC-ABC-123', status: 'AVAILABLE', current_site_id: 'site-1' })
    expect(out.tag_id).toBe('EPC-ABC-123')
    expect(out.status).toBe('AVAILABLE')
    expect(out.current_site_id).toBe('site-1')
  })
})