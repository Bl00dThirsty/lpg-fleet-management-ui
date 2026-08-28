import { describe, expect, it } from 'vitest'
import { PERMISSION_CATALOG } from '@lpg/permissions'
import { api } from '@lpg/api-client'
import { clientFields } from './clients/data/clients-crud'
import { organizationFields } from './organizations/data/organizations-crud'
import { depotFields } from './depots/data/depots-crud'
import { vehicleFields } from './vehicles/data/vehicles-crud'
import { driverFields } from './drivers/data/drivers-crud'
import { deviceFields } from './devices/data/devices-crud'
import { rfidTagFields } from './rfid-tags/data/rfid-tags-crud'
import { siteFields, clientSiteFields } from './sites/data/sites-crud'
import { transporterFields } from './transporters/data/transporters-crud'
import { marketerFields } from './marketers/data/marketers-crud'
import { customRoleFields } from './custom-roles/data/custom-roles-crud'

const CONFIGS = [
  { name: 'clients', fields: clientFields, resource: 'clients' },
  { name: 'organizations', fields: organizationFields, resource: 'orgs' },
  { name: 'depots', fields: depotFields, resource: 'orgs' },
  { name: 'vehicles', fields: vehicleFields, resource: 'trucks' },
  { name: 'drivers', fields: driverFields, resource: 'drivers' },
  { name: 'devices', fields: deviceFields, resource: 'devices' },
  { name: 'rfid-tags', fields: rfidTagFields, resource: 'rfid' },
  { name: 'sites', fields: siteFields, resource: 'sites' },
  { name: 'client-sites', fields: clientSiteFields, resource: 'sites' },
  { name: 'transporters', fields: transporterFields, resource: 'transporters' },
  { name: 'marketers', fields: marketerFields, resource: 'markets' },
  { name: 'custom-roles', fields: customRoleFields, resource: 'custom-roles' },
] as const

/** Every valid permission resource, derived from the catalog codes. */
const PERMISSION_RESOURCES = new Set(
  PERMISSION_CATALOG.map((p) => p.code.split('.')[0]),
)

describe('crud configs integrity', () => {
  it('every config declares at least one field', () => {
    for (const c of CONFIGS) expect(c.fields.length, c.name).toBeGreaterThan(0)
  })

  it('every config has a unique name', () => {
    const names = CONFIGS.map((c) => c.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('every config permission resource exists in @lpg/permissions', () => {
    for (const c of CONFIGS) {
      expect(PERMISSION_RESOURCES.has(c.resource), `${c.name} → ${c.resource}`).toBe(true)
    }
  })

  it('every config field name is unique within its config', () => {
    for (const c of CONFIGS) {
      const names = c.fields.map((f) => f.name)
      expect(new Set(names).size, `${c.name} fields`).toBe(names.length)
    }
  })
})

describe('useEntityCrud wiring integrity', () => {
  const CRUD_WIRINGS = [
    { page: 'clients', resource: 'clients' },
    { page: 'organizations', resource: 'organizations' },
    { page: 'depots', resource: 'organizations' },
    { page: 'trucks', resource: 'vehicles' },
    { page: 'vehicles', resource: 'vehicles' },
    { page: 'drivers', resource: 'drivers' },
    { page: 'devices', resource: 'devices' },
    { page: 'rfid-tags', resource: 'rfidTags' },
    { page: 'transporters', resource: 'organizations' },
    { page: 'marketers', resource: 'organizations' },
    { page: 'custom-roles', resource: 'customRoles' },
  ] as const

  it('every useEntityCrud resource key maps to an existing api.<resource>', () => {
    for (const w of CRUD_WIRINGS) {
      expect(w.resource in api, `${w.page} → api.${w.resource}`).toBe(true)
    }
  })
})
