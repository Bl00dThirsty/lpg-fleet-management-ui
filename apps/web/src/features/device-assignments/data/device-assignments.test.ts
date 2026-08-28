import { describe, expect, it } from 'vitest'
import { getDeviceAssignments, deviceTypeLabel } from './device-assignments'

describe('device-assignments view-model', () => {
  it('only includes devices that are assigned', () => {
    const assignments = getDeviceAssignments()
    expect(assignments.length).toBe(13)
  })

  it('classifies each assignment by target type', () => {
    const assignments = getDeviceAssignments()
    const targets = new Set(assignments.map((a) => a.assignedType))
    expect([...targets].sort()).toEqual(['USER', 'VEHICLE'])
    for (const assignment of assignments) {
      expect(assignment.assigneeName).toBeTruthy()
      expect(assignment.orgName).toBeTruthy()
    }
  })

  it('labels device types in French', () => {
    expect(deviceTypeLabel('GPS')).toBeTruthy()
  })
})