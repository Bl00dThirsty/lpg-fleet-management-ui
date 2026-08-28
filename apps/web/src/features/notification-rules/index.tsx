import { useMemo, useState } from 'react'
import { Plus, RouteOff, Workflow } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@lpg/ui'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { EntityFormSheet, useEntityCrud } from '@/components/entity-crud'
import type { NotificationRule } from '@lpg/types'
import { anomalyTypeLabels, severityLabels } from '@/features/anomalies/data/anomalies'
import {
  getNotifActiveRuleCount,
  getNotifRuleCount,
  getNotifRoutingGroups,
  type NotifRoutingGroup,
} from './data/notification-rules'
import {
  notificationRuleFields,
  notificationRuleFromForm,
  notificationRuleToForm,
} from './data/notification-rules-crud'

export function NotificationRulesPage() {
  const crud = useEntityCrud<NotificationRule>(
    'notificationRules',
    'notification-rules',
    ['notification-rules'],
  )
  const groups = useMemo(
    () => getNotifRoutingGroups(crud.list.data),
    [crud.list.data],
  )
  const total = useMemo(() => getNotifRuleCount(crud.list.data), [crud.list.data])
  const active = useMemo(() => getNotifActiveRuleCount(groups), [groups])
  const [expandedId, setExpandedId] = useState<string | null>(groups[0]?.targetGroupId ?? null)

  async function handleSubmit(values: Record<string, unknown>) {
    try {
      if (crud.editing) {
        await crud.updateMut.mutateAsync({
          id: crud.editing.id,
          patch: notificationRuleFromForm(values),
        })
        toast.success('Règle mise à jour.')
      } else {
        await crud.createMut.mutateAsync(
          notificationRuleFromForm(values) as Omit<NotificationRule, 'id'>,
        )
        toast.success('Règle créée.')
      }
      crud.close()
    } catch {
      toast.error('Échec de l’enregistrement.')
    }
  }

  return (
    <PageShell>
      <PageHeader
        title='Règles de notification'
        description='Routage anomalie vers groupe de notification par type et sévérité.'
        actions={
          crud.perm.canCreate ? (
            <Button onClick={crud.openCreate}>
              <Plus className='mr-1 h-4 w-4' /> Nouvelle règle
            </Button>
          ) : undefined
        }
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <KpiTile label='Règles' value={String(total)} />
        <KpiTile label='Règles actives' value={String(active)} />
        <KpiTile label='Groupes cibles' value={String(groups.length)} />
      </div>

      <SectionCard title='Routage par groupe' description='Une carte de routage groupée par groupe de notification cible.'>
        <div className='space-y-3'>
          {groups.length === 0 && (
            <p className='text-sm text-muted-foreground'>Aucune règle de notification.</p>
          )}
          {groups.map((group) => (
            <RoutingGroupCard
              key={group.targetGroupId}
              group={group}
              expanded={expandedId === group.targetGroupId}
              onToggle={() =>
                setExpandedId(expandedId === group.targetGroupId ? null : group.targetGroupId)
              }
              onEdit={(rule) => crud.openEdit(rule as unknown as NotificationRule)}
              onDelete={(rule) => crud.removeMut.mutateAsync(rule.id)}
            />
          ))}
        </div>
      </SectionCard>

      <EntityFormSheet
        open={crud.creating || crud.editing !== null}
        onOpenChange={(open) => {
          if (!open) crud.close()
        }}
        title={crud.editing ? 'Modifier la règle' : 'Nouvelle règle'}
        description={crud.editing ? 'Mettez à jour le routage de cette règle.' : 'Définissez le routage d’une anomalie vers un groupe de notification.'}
        fields={notificationRuleFields}
        initial={crud.editing ? notificationRuleToForm(crud.editing) : null}
        onSubmit={handleSubmit}
        onCancel={crud.close}
        submitting={crud.createMut.isPending || crud.updateMut.isPending}
      />
    </PageShell>
  )
}

function RoutingGroupCard({
  group,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  group: NotifRoutingGroup
  expanded: boolean
  onToggle: () => void
  onEdit?: (rule: NotifRoutingGroup['rules'][number]) => void
  onDelete?: (rule: NotifRoutingGroup['rules'][number]) => void
}) {
  return (
    <div className='rounded-lg border p-3'>
      <button
        type='button'
        onClick={onToggle}
        className='flex w-full items-center justify-between gap-2 text-left'
      >
        <div className='flex items-center gap-2'>
          <Workflow className='size-4 text-primary' />
          <span className='font-medium'>{group.targetGroupName}</span>
        </div>
        <Badge variant='secondary'>{group.rules.length} règles</Badge>
      </button>

      {expanded && (
        <div className='mt-3 space-y-1 border-t pt-3'>
          {group.rules.map((rule) => (
            <div
              key={rule.id}
              className='flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted/40'
            >
              <div className='flex min-w-0 items-center gap-1.5'>
                <span className='truncate font-medium'>{rule.name}</span>
                {rule.anomalyType && (
                  <Badge variant='outline' className='font-mono text-[10px]'>
                    {anomalyTypeLabels[rule.anomalyType] ?? rule.anomalyType}
                  </Badge>
                )}
                {rule.minSeverity && (
                  <Badge variant='secondary'>
                    {severityLabels[rule.minSeverity] ?? rule.minSeverity}
                  </Badge>
                )}
                <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                  {rule.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className='flex items-center gap-1'>
                {onEdit && (
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-7 px-2 text-xs'
                    onClick={() => onEdit(rule)}
                  >
                    Modifier
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-7 px-2 text-xs text-destructive hover:text-destructive'
                    onClick={() => onDelete(rule)}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className='mt-2 flex items-center gap-1 text-xs text-muted-foreground'>
        {group.activeRuleCount === 0 ? (
          <>
            <RouteOff className='size-3.5' /> Toutes inactives
          </>
        ) : (
          <span>{group.activeRuleCount} active(s) sur {group.ruleCount}</span>
        )}
      </div>
    </div>
  )
}