import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@lpg/api-client'
import type {
  AppUser,
  ClientSite,
  Driver,
  Organization,
  ScanEvent,
  Site,
  Vehicle,
} from '@lpg/types'
import { useToursStore } from '@/store/tours-store'
import { getSites } from '@/features/sites/data/sites'
import { toTourActivities } from '@/features/tours/data/tour-activity'
import { selectMarketerBulkTours } from '../lib/marketer-bulk-tours'

export function useMarketerBulkTours(marketerId: string) {
  const tours = useToursStore((state) => state.tours)
  const checkpoints = useToursStore((state) => state.checkpoints)
  const loading = useToursStore((state) => state.loading)
  const references = useQuery({
    queryKey: ['marketer-bulk-tour-references', marketerId],
    queryFn: async () => {
      const [
        organizations,
        vehicles,
        drivers,
        users,
        sites,
        clientSites,
        scanEvents,
      ] = await Promise.all([
        api.organizations.list({ size: 200 }),
        api.vehicles.list({ size: 200 }),
        api.drivers.list({ size: 200 }),
        api.users.list({ size: 200 }),
        api.sites.list({ size: 200 }),
        api.clientSites.list({ size: 200 }),
        api.scanEvents.list({ size: 200 }),
      ])
      const orgs = organizations.data as Organization[]
      return {
        organizations: orgs,
        vehicles: vehicles.data as Vehicle[],
        drivers: drivers.data as Driver[],
        users: users.data as AppUser[],
        sites: getSites(
          [...(sites.data as Site[]), ...(clientSites.data as ClientSite[])],
          Object.fromEntries(orgs.map((org) => [org.id, org.name]))
        ),
        clientSites: clientSites.data as ClientSite[],
        scanEvents: scanEvents.data as ScanEvent[],
      }
    },
    staleTime: 60_000,
  })
  const rows = useMemo(
    () => selectMarketerBulkTours(tours, marketerId),
    [tours, marketerId]
  )
  useEffect(() => {
    void useToursStore.getState().fetchTours()
  }, [])
  useEffect(() => {
    for (const tour of rows)
      void useToursStore.getState().fetchCheckpoints(tour.id)
  }, [rows])
  const activities = useMemo(
    () =>
      references.data
        ? toTourActivities(rows, { ...references.data, checkpoints })
        : [],
    [rows, references.data, checkpoints]
  )
  return {
    activities,
    loading: loading || references.isPending,
    error: references.isError,
    retry: references.refetch,
  }
}
