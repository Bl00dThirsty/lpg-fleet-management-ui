import { useMemo, useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { drivers, users, vehicles } from '@lpg/mock-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@lpg/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { getToursForTransporter } from '../data/transporter-tours'
import type { TransporterTourWithDetails } from '../data/transporter-tours'
import { useAuthStore } from '@/store/auth-store'
import { useToursStore } from '@/store/tours-store'

const crewAssignmentSchema = z.object({
  vehicle_id: z.string().min(1, 'Véhicule requis'),
  driver_id: z.string().min(1, 'Chauffeur requis'),
  livreur_user_id: z.string().min(1, 'Livreur requis'),
})

type CrewAssignmentValues = z.infer<typeof crewAssignmentSchema>

const CREW_DEFAULTS: CrewAssignmentValues = {
  vehicle_id: '',
  driver_id: '',
  livreur_user_id: '',
}

function getDriverName(tour: TransporterTourWithDetails): string {
  if (!tour.driver) return '—'
  const firstName = tour.driver.first_name?.trim() ?? ''
  const lastName = tour.driver.last_name?.trim() ?? ''
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || '—'
}

function PendingToursColumns(
  onAcknowledge: (tour: TransporterTourWithDetails) => void
): ColumnDef<TransporterTourWithDetails>[] {
  return [
    {
      accessorKey: 'id',
      header: 'ID Tournée',
      cell: ({ row }) => (
        <span className='font-mono text-xs'>{row.original.id}</span>
      ),
    },
    {
      accessorKey: 'marketeur',
      header: 'Marketeur',
      cell: ({ row }) => (
        <div className='font-medium text-sm'>{row.original.marketeur?.name ?? '—'}</div>
      ),
    },
    {
      accessorKey: 'driver',
      header: 'Chauffeur',
      cell: ({ row }) => (
        <div className='font-medium text-sm'>{getDriverName(row.original)}</div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span className='text-sm'>{row.original.type === 'VRAC' ? 'Vrac' : 'Bouteilles 50 kg'}</span>
      ),
    },
    {
      accessorKey: 'execution_mode',
      header: 'Mode',
      cell: ({ row }) => (
        <span className='text-sm capitalize'>{row.original.execution_mode === 'INTERNAL' ? 'Interne' : 'Externe'}</span>
      ),
    },
    {
      accessorKey: 'requested_quantity',
      header: 'Volume',
      cell: ({ row }) => (
        <span className='font-mono text-sm'>{row.original.requested_quantity} {row.original.type === 'VRAC' ? 'TM' : 'btl'}</span>
      ),
    },
    {
      accessorKey: 'vehicle',
      header: 'Camion',
      cell: ({ row }) => (
        <span className='font-mono text-sm'>{row.original.vehicle?.license_plate ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <span className='inline-flex items-center gap-1'>
            <span className={cn(
              'size-1.5 rounded-full',
              status === 'CLOSED' ? 'bg-emerald-500' :
              status === 'INPROGRESS' || status === 'CHECKPOINTACTIVE' ? 'bg-blue-500' :
              status === 'PENDINGTRANSPORTERACK' ? 'bg-amber-500' :
              status === 'CANCELLED' ? 'bg-rose-500' : 'bg-slate-400'
            )} />
            <span className='text-xs font-medium'>{row.original.statusLabel}</span>
          </span>
        )
      },
    },
    {
      accessorKey: 'started_at',
      header: 'Démarré le',
      cell: ({ row }) => (
        <span className='text-sm'>
          {row.original.started_at ? format(new Date(row.original.started_at), 'dd/MM/yyyy HH:mm') : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant='link'
          className='h-auto p-0 text-sm'
          onClick={() => onAcknowledge(row.original)}
        >
          Accuser réception
        </Button>
      ),
    },
  ]
}

export function TransporterPendingTours({ transporter }: { transporter: { id: string; name: string } }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('PENDINGTRANSPORTERACK')
  const [ackTour, setAckTour] = useState<TransporterTourWithDetails | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<CrewAssignmentValues>({
    resolver: zodResolver(crewAssignmentSchema),
    defaultValues: CREW_DEFAULTS,
  })

  const orgVehicles = useMemo(
    () => vehicles.filter((v) => v.org_id === transporter.id && v.is_active),
    [transporter.id],
  )

  const orgDrivers = useMemo(
    () => drivers.filter((d) => d.org_id === transporter.id && d.is_active),
    [transporter.id],
  )

  const orgLivreurs = useMemo(() => {
    const candidates = users.filter((u) => u.org_id === transporter.id && u.is_active)
    const livreurs = candidates.filter((u) => u.system_role === 'LIVREUR')
    return livreurs.length > 0 ? livreurs : candidates
  }, [transporter.id])

  const allTours = useMemo(() => getToursForTransporter(transporter.id), [transporter.id])
  // Filter only pending acknowledgment tours
  const pendingTours = useMemo(() => {
    return allTours.filter((tour) => tour.status === 'PENDINGTRANSPORTERACK')
  }, [allTours])

  const filteredTours = useMemo(() => {
    let result = pendingTours

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((tour) =>
        tour.id.toLowerCase().includes(q) ||
        tour.marketeur?.name?.toLowerCase().includes(q) ||
        tour.vehicle?.license_plate?.toLowerCase().includes(q) ||
        tour.driver?.first_name?.toLowerCase().includes(q) ||
        tour.driver?.last_name?.toLowerCase().includes(q)
      )
    }

    return result
  }, [pendingTours, search])

  const handleAcknowledge = (tour: TransporterTourWithDetails) => {
    form.reset(CREW_DEFAULTS)
    setAckTour(tour)
  }

  function submitAcknowledge(values: CrewAssignmentValues) {
    if (!ackTour) return
    const user = useAuthStore.getState().user
    if (!user?.id) {
      toast.error('Aucun utilisateur connecté')
      return
    }
    setSubmitting(true)
    try {
      useToursStore.getState().performAction(ackTour.id, 'acknowledge', {
        vehicle_id: values.vehicle_id,
        driver_id: values.driver_id,
        livreur_user_id: values.livreur_user_id,
        assigned_by_transporter_user_id: user.id,
      })
      toast.success(`Tournée ${ackTour.id} acceptée`)
      setAckTour(null)
      form.reset(CREW_DEFAULTS)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible d'accuser réception de la tournée"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = pendingTours.length

  return (
    <div className='space-y-4'>
      {/* Header with title and search */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg'>
            <span className='text-amber-600 dark:text-amber-400 text-lg'>⏳</span>
          </div>
          <div>
            <h2 className='text-xl font-bold'>En attente d'accusé</h2>
            <p className='text-sm text-muted-foreground'>{pendingCount} tournée{pendingCount > 1 ? 's' : ''} en attente d'accusé de réception</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto'>
          <div className='relative flex-1 min-w-0'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Rechercher ID, marketeur, chauffeur, camion...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20'
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                aria-label='Effacer la recherche'
              >
                <X className='size-4' />
              </button>
            )}
          </div>

          <div className='flex items-center gap-2'>
            <Filter className='size-4 text-muted-foreground' />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='px-3 py-2 text-sm bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20'
            >
              <option value='PENDINGTRANSPORTERACK'>En attente d'accusé</option>
              <option value='all'>Tous les statuts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className='p-0'>
          <DataTable
            data={filteredTours}
            columns={PendingToursColumns(handleAcknowledge)}
            search={{ placeholder: '', searchKey: 'q' }}
          />
        </CardContent>
      </Card>

        {filteredTours.length === 0 && (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='text-4xl mb-3'>📋</div>
            <h3 className='text-lg font-medium'>Aucune tournée trouvée</h3>
            <p className='text-muted-foreground'>
              {search ? 'Aucun résultat pour votre recherche' : 'Aucune tournée en attente d\'accusé pour ce transporteur'}
            </p>
            {search && (
              <Button variant='outline' onClick={() => setSearch('')} className='mt-3'>
                <X className='mr-2 size-4' />
                Effacer la recherche
              </Button>
            )}
          </div>
        )}

        <Dialog
          open={ackTour !== null}
          onOpenChange={(open) => {
            if (!open) setAckTour(null)
          }}
        >
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Accuser réception — {ackTour?.id}</DialogTitle>
              <DialogDescription>
                Affectez le véhicule, le chauffeur et le livreur de {transporter.name} à la tournée
                {ackTour ? ` ${ackTour.id}` : ''}.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submitAcknowledge)} className='space-y-4'>
                <FormField
                  control={form.control}
                  name='vehicle_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Véhicule</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='— Sélectionner —' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orgVehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.license_plate}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='driver_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chauffeur</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='— Sélectionner —' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orgDrivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {`${driver.first_name} ${driver.last_name}`.trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='livreur_user_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Livreur</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='— Sélectionner —' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orgLivreurs.map((livreur) => (
                            <SelectItem key={livreur.id} value={livreur.id}>
                              {`${livreur.first_name} ${livreur.last_name}`.trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className='gap-2'>
                  <Button type='button' variant='outline' onClick={() => setAckTour(null)}>
                    Annuler
                  </Button>
                  <Button type='submit' disabled={submitting}>
                    {submitting ? "Envoi de l'accusé…" : "Confirmer l'accusé"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
  )
}