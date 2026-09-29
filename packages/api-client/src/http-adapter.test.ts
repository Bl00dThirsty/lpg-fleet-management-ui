import { describe, it, expect } from 'vitest'
import {
  rewritePath,
  mapBackendSiteToSite,
  mapBackendVehicleToVehicle,
  mapBackendDeviceToDevice,
  mapBackendTelemetryToPoint,
  mapBackendScanToScanEvent,
  mapBackendCheckpointToCheckpoint,
  mapBackendTourToDeliveryTour,
} from './http-adapter'

describe('rewritePath contract', () => {
  it('routes PDA evidence to tour-service, never cylinder', () => {
    expect(rewritePath('/scan-events').path).toBe('/scan-events')
    expect(rewritePath('/scan-events/bulk').path).toBe('/scan-events/bulk')
  })

  it('rewrites legacy domain paths to Spring paths', () => {
    expect(rewritePath('/delivery-tours').path).toBe('/tours')
    expect(rewritePath('/delivery-tours/abc/start').path).toBe('/tours/abc/start')
    expect(rewritePath('/pickup-requests?page=0&size=50').path).toBe('/pickups?page=0&size=50')
    expect(rewritePath('/rfid-tags').path).toBe('/rfid')
    expect(rewritePath('/users').path).toBe('/users/')
  })

  it('short-circuits unexposed collections to an empty page', () => {
    const r = rewritePath('/risk-scores')
    expect(r.unimplemented).toBe(true)
  })

  it('leaves live backend paths untouched', () => {
    expect(rewritePath('/sites/nearby?lat=4&lon=9').path).toBe('/sites/nearby?lat=4&lon=9')
    expect(rewritePath('/telemetry/vehicles/VEH-1/latest').path).toBe('/telemetry/vehicles/VEH-1/latest')
    expect(rewritePath('/scans').path).toBe('/scans')
  })
})

describe('backend mappers', () => {
  it('maps a site summary with geo_point [lng,lat]', () => {
    const site = mapBackendSiteToSite({
      id: 's1', code: 'SITE-DEP-DLA-PRINCIPAL', siteId: 'DLA-DEP-001',
      name: 'Dépôt Principal Douala', region: 'Littoral', city: 'Douala',
      latitude: 4.0511, longitude: 9.7679, isOperational: true,
    })
    expect(site.geo_point).toEqual([9.7679, 4.0511])
    expect(site.region).toBe('LITTORAL')
    expect(site.status).toBe('ACTIVE')
  })

  it('drops null-island coordinates', () => {
    expect(mapBackendSiteToSite({ id: 's', latitude: 0, longitude: 0 }).geo_point).toBeNull()
    expect(mapBackendSiteToSite({ id: 's' }).geo_point).toBeNull()
  })

  it('maps vehicle, device and telemetry rows', () => {
    const vehicle = mapBackendVehicleToVehicle({
      id: 'VEH-MKT-GPL-001', licensePlate: 'CE-1234-AB', type: 'VRAC',
      organizationId: 'MKT-GPL', maxVolume: 20, active: true,
    })
    expect(vehicle.license_plate).toBe('CE-1234-AB')
    expect(vehicle.org_id).toBe('MKT-GPL')

    const device = mapBackendDeviceToDevice({
      id: 'd1', serialNumber: 'GPS-001', deviceType: 'GPS_TRACKER',
      batteryLevel: 87, batteryCritical: false,
      lastLatitude: 4.062, lastLongitude: 9.762,
      assignedToVehicleId: 'VEH-MKT-GPL-001',
    })
    expect(device.device_type).toBe('GPS')
    expect(device.last_known_position).toEqual([9.762, 4.062])

    const point = mapBackendTelemetryToPoint({
      vehicleId: 'VEH-MKT-GPL-001', latitude: 4.062, longitude: 9.762,
      speed: 45, heading: 320, batteryLevel: 87, timestamp: '2026-09-28T10:00:00Z',
    })
    expect(point).toMatchObject({ vehicle_id: 'VEH-MKT-GPL-001', lat: 4.062, lng: 9.762 })
  })

  it('maps scans from either service shape', () => {
    const tourScan = mapBackendScanToScanEvent({
      id: 'e1', checkpointId: 'cp1', direction: 'IN', geoLat: 4.09, geoLng: 9.74,
      timestamp: '2026-09-28T10:00:00Z',
    })
    expect(tourScan.checkpoint_id).toBe('cp1')
    expect(tourScan.geo_point).toEqual([9.74, 4.09])

    const cylinderScan = mapBackendScanToScanEvent({
      id: 'e2', checkpointId: 'cp2', direction: 'OUT', latitude: 3.82, longitude: 11.55,
      timestamp: '2026-09-28T11:00:00Z',
    })
    expect(cylinderScan.geo_point).toEqual([11.55, 3.82])
  })

  it('maps checkpoint and tour lifecycles', () => {
    const cp = mapBackendCheckpointToCheckpoint({ id: 'c', tourId: 't', sequence: 1, status: 'REACHED' })
    expect(cp.tournee_id).toBe('t')
    expect(cp.status).toBe('REACHED')

    const tour = mapBackendTourToDeliveryTour({
      id: 't', tourCode: 'T-VRAC-2026-001', marketerOrganizationId: 'MKT-GPL',
      executionMode: 'EXTERNAL', vehicleId: 'VEH-TRP-ABC-001', type: 'VRAC',
      status: 'INPROGRESS', requestedQuantity: 18,
    })
    expect(tour.vehicle_id).toBe('VEH-TRP-ABC-001')
    expect(tour.marketeur_org_id).toBe('MKT-GPL')
  })
})
