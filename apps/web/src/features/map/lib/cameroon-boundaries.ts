/**
 * Cameroon Administrative Boundaries — 2025
 * Country: 604eed29f4d22b9d006f79aad8843
 * Regions: f1cb015538fe441e9b3a3b40b184b1a2
 * Deleted old item: 7d12b29c650b421e8f7423df943ab543
 *
 * Native ArcGIS: FeatureLayer from portalItem (FeatureServer) per level.
 * GroupLayer groups Country + Region so they render independently.
 * Levels: Country (outline only) + Region (filled, selectable by definitionExpression).
 * Readonly: popupEnabled false, not clickable.
 */

export const CAMEROON_COUNTRY_PORTAL_ITEM_ID = '604eed29f4d22b9d006f79aad8843'
export const CAMEROON_REGION_PORTAL_ITEM_ID = 'f1cb015538fe441e9b3a3b40b184b1a2'

export const CAMEROON_CENTER = [8.7, 12.3] as const

export type CameroonBoundaryLevel = 'country' | 'region'

export type CameroonBoundaryProps = {
  visible?: boolean
  opacity?: number
  level?: CameroonBoundaryLevel
}
