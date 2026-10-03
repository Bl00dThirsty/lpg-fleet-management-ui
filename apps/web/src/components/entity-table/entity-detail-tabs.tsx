import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export type EntityDetailTab = {
  value: string
  label: ReactNode
  /** Optional icon rendered inside the trigger. */
  icon?: React.ComponentType<{ className?: string }>
  /** Tab body. */
  content: ReactNode
  /** Set to true to disable the trigger. */
  disabled?: boolean
}

type EntityDetailTabsProps = {
  defaultValue: string
  tabs: ReadonlyArray<EntityDetailTab>
  /** Optional className for the wrapping `<Tabs>`. */
  className?: string
  /** Optional className applied to each `<TabsContent>` (e.g. for vertical spacing). */
  contentClassName?: string
  /** Layout for the trigger list. */
  variant?: 'line' | 'pill'
}

/**
 * Canonical wrapper for sheet/detail tabbed sections.
 *
 * Replaces the duplicated `<Tabs>` / `<TabsList>` / `<TabsTrigger>` /
 * `<TabsContent>` chain that every detail-sheet in the app carried in
 * line-by-line. Caller passes `tabs=[{ value, label, content, ... }]`
 * — keeping the content where it lives (CardHeader + CardContent for
 * each tab) without copying the chrome.
 */
export function EntityDetailTabs({
  defaultValue,
  tabs,
  className,
  contentClassName,
  variant = 'pill',
}: EntityDetailTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className={cn('flex flex-col gap-4', className)}>
      <TabsList
        {...(variant === 'line'
          ? {
              className: cn(
                'h-auto w-full justify-start rounded-none border-b bg-transparent p-0',
              ),
            }
          : {})}
      >
        {tabs.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            disabled={t.disabled}
            {...(variant === 'line'
              ? {
                  className: cn(
                    'rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none',
                  ),
                }
              : {})}
          >
            {t.icon ? <t.icon className='size-4' /> : null}
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value} className={contentClassName}>
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
