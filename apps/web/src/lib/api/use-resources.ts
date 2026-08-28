/**
 * Permission-driven React Query hooks for the api-client resources.
 *
 * Every hook is typed against its schema entity (`@lpg/types`). The bridge
 * between the loose api-client signatures and the strict schema types lives
 * here, at the single place where the cast is unavoidable.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { api } from '@lpg/api-client'
import type {
  Anomaly,
  AppUser as User,
  ClientSite,
  Declaration,
  DeliveryTour,
  Device,
  Notification,
  Organization,
  PickupRequest,
  Reconciliation,
  Redressement,
  RiskScore,
  ScanEvent,
  Site,
  Vehicle,
} from '@lpg/types'

export type ListParams = Record<string, string | number | boolean | undefined>

/** The api-client returns `any[]` payloads today; this is the single,
 *  documented boundary between untyped transport and typed consumers.
 *  Inlining the `Promise<X>` projection here lets every consumer stay strict. */
function project<T>(data: unknown): T {
  return data as T
}


type ResultList<T> = UseQueryResult<T[], Error>
type ResultOne<T> = UseQueryResult<T, Error>

export const organizationsHooks = {
  useList(params?: ListParams): ResultList<Organization> {
    return useQuery<Organization[], Error>({
      queryKey: ['organizations', params],
      queryFn: () =>
        api.organizations.list(params as never).then((r) => project<Organization[]>(r.data)),
    })
  },
  useOne(id: string): ResultOne<Organization> {
    return useQuery<Organization, Error>({
      queryKey: ['organizations', id],
      queryFn: () =>
        api.organizations.getById(id).then((r) => project<Organization>(r)),
    })
  },
}

export const vehiclesHooks = {
  useList(params?: ListParams): ResultList<Vehicle> {
    return useQuery<Vehicle[], Error>({
      queryKey: ['vehicles', params],
      queryFn: () =>
        api.vehicles.list(params as never).then((r) => project<Vehicle[]>(r.data)),
    })
  },
  useOne(id: string): ResultOne<Vehicle> {
    return useQuery<Vehicle, Error>({
      queryKey: ['vehicles', id],
      queryFn: () =>
        api.vehicles.getById(id).then((r) => project<Vehicle>(r)),
    })
  },
}

/** Alias kept for legacy `trucksHooks` consumers in the trucks feature. */
export const trucksHooks = vehiclesHooks

export const deliveryToursHooks = {
  useList(params?: ListParams): ResultList<DeliveryTour> {
    return useQuery<DeliveryTour[], Error>({
      queryKey: ['delivery_tours', params],
      queryFn: () =>
        api.deliveryTours.list(params as never).then((r) => project<DeliveryTour[]>(r.data)),
    })
  },
  useOne(id: string): ResultOne<DeliveryTour> {
    return useQuery<DeliveryTour, Error>({
      queryKey: ['delivery_tours', id],
      queryFn: () =>
        api.deliveryTours.getById(id).then((r) => project<DeliveryTour>(r)),
    })
  },
}

export const sitesHooks = {
  useList(params?: ListParams): ResultList<Site> {
    return useQuery<Site[], Error>({
      queryKey: ['sites', params],
      queryFn: () =>
        api.sites.list(params as never).then((r) => project<Site[]>(r.data)),
    })
  },
  useOne(id: string): ResultOne<Site> {
    return useQuery<Site, Error>({
      queryKey: ['sites', id],
      queryFn: () =>
        api.sites.getById(id).then((r) => project<Site>(r)),
    })
  },
}

export const clientSitesHooks = {
  useList(params?: ListParams): ResultList<ClientSite> {
    return useQuery<ClientSite[], Error>({
      queryKey: ['client_sites', params],
      queryFn: () =>
        api.clientSites.list(params as never).then((r) => project<ClientSite[]>(r.data)),
    })
  },
  useOne(id: string): ResultOne<ClientSite> {
    return useQuery<ClientSite, Error>({
      queryKey: ['client_sites', id],
      queryFn: () =>
        api.clientSites.getById(id).then((r) => project<ClientSite>(r)),
    })
  },
}

export const declarationsHooks = {
  useList(params?: ListParams): ResultList<Declaration> {
    return useQuery<Declaration[], Error>({
      queryKey: ['declarations', params],
      queryFn: () =>
        api.declarations.list(params as never).then((r) => project<Declaration[]>(r.data)),
    })
  },
  useOne(id: string): ResultOne<Declaration> {
    return useQuery<Declaration, Error>({
      queryKey: ['declarations', id],
      queryFn: () =>
        api.declarations.getById(id).then((r) => project<Declaration>(r)),
    })
  },
}

export const anomaliesHooks = {
  useList(params?: ListParams): ResultList<Anomaly> {
    return useQuery<Anomaly[], Error>({
      queryKey: ['anomalies', params],
      queryFn: () =>
        api.anomalies.list(params as never).then((r) => project<Anomaly[]>(r.data)),
    })
  },
}

export const usersHooks = {
  useList(params?: ListParams): ResultList<User> {
    return useQuery<User[], Error>({
      queryKey: ['users', params],
      queryFn: () =>
        api.users.list(params as never).then((r) => project<User[]>(r.data)),
    })
  },
}

export const devicesHooks = {
  useList(params?: ListParams): ResultList<Device> {
    return useQuery<Device[], Error>({
      queryKey: ['devices', params],
      queryFn: () =>
        api.devices.list(params as never).then((r) => project<Device[]>(r.data)),
    })
  },
}

export const reconciliationsHooks = {
  useList(params?: ListParams): ResultList<Reconciliation> {
    return useQuery<Reconciliation[], Error>({
      queryKey: ['reconciliations', params],
      queryFn: () =>
        api.reconciliations.list(params as never).then((r) => project<Reconciliation[]>(r.data)),
    })
  },
}

export const redressementsHooks = {
  useList(params?: ListParams): ResultList<Redressement> {
    return useQuery<Redressement[], Error>({
      queryKey: ['redressements', params],
      queryFn: () =>
        api.redressements.list(params as never).then((r) => project<Redressement[]>(r.data)),
    })
  },
}

export const riskScoresHooks = {
  useList(params?: ListParams): ResultList<RiskScore> {
    return useQuery<RiskScore[], Error>({
      queryKey: ['risk_scores', params],
      queryFn: () =>
        api.riskScores.list(params as never).then((r) => project<RiskScore[]>(r.data)),
    })
  },
}

export const pickupRequestsHooks = {
  useList(params?: ListParams): ResultList<PickupRequest> {
    return useQuery<PickupRequest[], Error>({
      queryKey: ['pickup_requests', params],
      queryFn: () =>
        api.pickupRequests.list(params as never).then((r) => project<PickupRequest[]>(r.data)),
    })
  },
}

export const scanEventsHooks = {
  useList(params?: ListParams): ResultList<ScanEvent> {
    return useQuery<ScanEvent[], Error>({
      queryKey: ['scan_events', params],
      queryFn: () =>
        api.scanEvents.list(params as never).then((r) => project<ScanEvent[]>(r.data)),
    })
  },
}

export const notificationsHooks = {
  useList(params?: ListParams): ResultList<Notification> {
    return useQuery<Notification[], Error>({
      queryKey: ['notifications', params],
      queryFn: () =>
        api.notifications.list(params as never).then((r) => project<Notification[]>(r.data)),
    })
  },
}