import { describe, expect, it } from 'vitest'
import { mapWsEventToInvalidation } from './use-ws-client'

describe('mapWsEventToInvalidation', () => {
  it('maps tour:update to tours', () => {
    expect(mapWsEventToInvalidation('tour:update')).toEqual(['tours'])
  })
  it('maps anomaly:new to anomalies', () => {
    expect(mapWsEventToInvalidation('anomaly:new')).toEqual(['anomalies'])
  })
  it('maps device:telemetry to devices', () => {
    expect(mapWsEventToInvalidation('device:telemetry')).toEqual(['devices'])
  })
  it('maps pickup:update to pickups', () => {
    expect(mapWsEventToInvalidation('pickup:update')).toEqual(['pickups'])
  })
  it('maps contract:update to transporter-contracts', () => {
    expect(mapWsEventToInvalidation('contract:update')).toEqual(['transporter-contracts'])
  })
  it('unknown events return []', () => {
    expect(mapWsEventToInvalidation('position:update')).toEqual([])
  })
})
