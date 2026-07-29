import { useMemo } from 'react'
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@lpg/ui'
import { declarationsHooks } from '@/lib/api/use-resources'

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  submitted: 'Soumise',
  validated: 'Validée',
  rejected: 'Rejetée',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  submitted: 'secondary',
  validated: 'default',
  rejected: 'destructive',
}

export function RecentActivity() {
  const { data: declarationsResult, isPending } = declarationsHooks.useList({ page: 1, limite: 100 })

  const declarations = useMemo(() => {
    const items = (declarationsResult?.data ?? []) as unknown as Array<{
      reference: string
      status: string
      declaredAt: string
    }>
    return [...items]
      .sort((a, b) => new Date(b.declaredAt).getTime() - new Date(a.declaredAt).getTime())
      .slice(0, 3)
  }, [declarationsResult])

  if (isPending) {
    return (
      <Card className='rounded-2xl border-border/60 shadow-none'>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className='h-[66px] w-full rounded-xl' />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {declarations.map((declaration) => (
          <div
            key={declaration.reference}
            className='flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3'
          >
            <div className='min-w-0'>
              <p className='text-sm font-medium'>{declaration.reference}</p>
              <p className='text-xs text-muted-foreground'>
                {new Intl.DateTimeFormat('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date(declaration.declaredAt))}
              </p>
            </div>
            <Badge variant={statusVariants[declaration.status] ?? 'outline'}>
              {statusLabels[declaration.status] ?? declaration.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
