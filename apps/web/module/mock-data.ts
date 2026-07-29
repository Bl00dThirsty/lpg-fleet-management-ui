import { faker } from '@faker-js/faker'
import { type ModuleDefinition, type ModuleField } from '@/config/modules/types'

faker.seed(20260714)

function mockValue(field: ModuleField, idx: number): unknown {
  switch (field.type) {
    case 'number':
      return faker.number.int({ min: 1, max: 5000 })
    case 'currency':
      return faker.number.int({ min: 50, max: 250000 })
    case 'date':
      return faker.date
        .between({ from: '2026-01-01', to: '2026-07-14' })
        .toISOString()
    case 'badge':
    case 'status':
      return field.options?.[faker.number.int({ min: 0, max: (field.options?.length ?? 1) - 1 })].value
    case 'text':
    default:
      return faker.helpers.arrayElement([
        faker.company.name(),
        faker.location.city(),
        faker.person.fullName(),
        `TRK-${1000 + idx}`,
        `CMD-${5000 + idx}`,
      ])
  }
}

export function generateMockRows(def: ModuleDefinition): Record<string, unknown>[] {
  const count = def.mockCount ?? 25
  return Array.from({ length: count }, (_, idx) => {
    const row: Record<string, unknown> = { id: faker.string.uuid() }
    for (const field of def.fields) {
      if (field.key === 'id') continue
      row[field.key] = mockValue(field, idx)
    }
    return row
  })
}
