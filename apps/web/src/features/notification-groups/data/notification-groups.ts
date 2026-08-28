import { curated, notification_group_members, notification_groups } from '@lpg/mock-data'
import type { NotificationGroup, NotificationGroupMember, NotificationGroupType } from '@lpg/types'

export type { NotificationGroupType }

export interface NotificationGroupView {
  id: string
  name: string
  type: NotificationGroupType
  typeLabel: string
  isActive: boolean
  memberCount: number
  members: { userId: string; fullName: string }[]
}

export const notificationGroupTypeLabels: Record<NotificationGroupType, string> = {
  TECHNICAL: 'Support technique',
  INVESTIGATION: 'Investigation & fraude',
  ADMIN: 'Administration',
  MARKETING: 'Commercial / marketeur',
  TRANSPORT: 'Transport / dispatch',
}

const USER_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  curated.users.map((u) => [u.id, `${u.first_name} ${u.last_name}`.trim()]),
)

export function getNotificationGroups(): NotificationGroupView[] {
  const assignments = notification_group_members as NotificationGroupMember[]
  return (notification_groups as NotificationGroup[]).map((group) => {
    const members = assignments
      .filter((m) => m.group_id === group.id)
      .map((m) => ({ userId: m.user_id, fullName: USER_NAME_BY_ID[m.user_id] ?? m.user_id }))
    return {
      id: group.id,
      name: group.name,
      type: group.type,
      typeLabel: notificationGroupTypeLabels[group.type] ?? group.type,
      isActive: group.is_active,
      memberCount: members.length,
      members,
    }
  })
}

export function getActiveNotificationGroupCount(): number {
  return getNotificationGroups().filter((g) => g.isActive).length
}

export function getTotalGroupMembers(): number {
  return getNotificationGroups().reduce((acc, g) => acc + g.memberCount, 0)
}