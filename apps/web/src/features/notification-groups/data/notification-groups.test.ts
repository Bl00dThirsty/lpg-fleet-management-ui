import { describe, expect, it } from 'vitest'
import {
  getActiveNotificationGroupCount,
  getNotificationGroups,
  getTotalGroupMembers,
  notificationGroupTypeLabels,
} from './notification-groups'

describe('notification-groups view-model', () => {
  it('maps groups with member counts and type labels', () => {
    const groups = getNotificationGroups()
    expect(groups.length).toBeGreaterThanOrEqual(5)
    for (const group of groups) {
      expect(group.name).toBeTruthy()
      expect(group.typeLabel).toBeTruthy()
      expect(group.memberCount).toBe(group.members.length)
    }
  })

  it('resolves member counts from assignments', () => {
    const total = getTotalGroupMembers()
    expect(total).toBe(getNotificationGroups().reduce((acc, g) => acc + g.memberCount, 0))
  })

  it('maps all group types', () => {
    expect(notificationGroupTypeLabels.TECHNICAL).toBe('Support technique')
    expect(notificationGroupTypeLabels.INVESTIGATION).toBe('Investigation & fraude')
  })

  it('tracks active groups', () => {
    expect(getActiveNotificationGroupCount()).toBeGreaterThanOrEqual(1)
  })
})