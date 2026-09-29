import { createApiAdapter } from './http-adapter.ts'
import { createApi } from './api.ts'

export type { ApiAdapter, AuthResult, AuthUser, Credentials, ListResult, ApiPagination, RequestOptions } from './adapter.ts'
export { createHttpAdapter, createApiAdapter, rewritePath } from './http-adapter.ts'
export {
  mapBackendSiteToSite,
  mapBackendVehicleToVehicle,
  mapBackendDeviceToDevice,
  mapBackendTelemetryToPoint,
  mapBackendScanToScanEvent,
  mapBackendCheckpointToCheckpoint,
  mapBackendTourToDeliveryTour,
  mapBackendPickupToPickupRequest,
  mapBackendPersonToUser,
  type TelemetryPoint,
} from './http-adapter.ts'
export { createApi } from './api.ts'

export const apiAdapter = createApiAdapter()
export const api = createApi(apiAdapter)