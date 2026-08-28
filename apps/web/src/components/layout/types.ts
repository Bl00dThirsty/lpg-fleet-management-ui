import { type LinkProps } from '@tanstack/react-router'

type BaseItem = {
  title: string
  badge?: string
  icon?: React.ElementType
}

type Item = BaseItem & {
  url: string
  items?: never
}

type CollapsibleItem = BaseItem & {
  url?: never
  items: (BaseItem & { url: string })[]
}

type NavLink = BaseItem & {
  url: LinkProps['to'] | (string & {})
  items?: never
}

type NavCollapsible = BaseItem & {
  items: (BaseItem & { url: LinkProps['to'] | (string & {}) })[]
  url?: never
}

type NavItem = NavCollapsible | NavLink

type NavGroup = {
  title: string
  items: NavItem[]
}

type SidebarData = {
  navGroups: NavGroup[]
}

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink, BaseItem, Item, CollapsibleItem }
