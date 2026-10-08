import { useEffect, useRef, useState } from 'react'
import type Graphic from '@arcgis/core/Graphic.js'
import type MapView from '@arcgis/core/views/MapView.js'
import type { ClickEvent } from '@arcgis/core/views/input/types.js'
import { Crosshair, MapPin, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createRobustBasemap } from '../utils/robust-basemap'

export interface MapLocationPickerValue {
  latitude: number
  longitude: number
}

export interface MapLocationPickerProps {
  value?: MapLocationPickerValue | null
  onChange: (coords: MapLocationPickerValue) => void
  initialRegion?: string
  className?: string
}

// Repères urbains usuels au Cameroun pour centrage rapide
const CAMEROON_HUBS = [
  { name: 'Douala', lng: 9.7043, lat: 4.0511 },
  { name: 'Yaoundé', lng: 11.5021, lat: 3.848 },
  { name: 'Bafoussam', lng: 10.4179, lat: 5.4778 },
  { name: 'Garoua', lng: 13.3977, lat: 9.3014 },
  { name: 'Kribi', lng: 9.9077, lat: 2.9377 },
]

export function MapLocationPicker({
  value,
  onChange,
  initialRegion,
  className = '',
}: MapLocationPickerProps) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<MapView | null>(null)
  const markerGraphicRef = useRef<Graphic | null>(null)
  const [mapError, setMapError] = useState(false)
  const [latInput, setLatInput] = useState(
    value?.latitude ? String(value.latitude) : ''
  )
  const [lngInput, setLngInput] = useState(
    value?.longitude ? String(value.longitude) : ''
  )

  // Track previous value to adjust inputs without setState in effect
  const [prevValue, setPrevValue] = useState<{ lat?: number; lng?: number }>({
    lat: value?.latitude,
    lng: value?.longitude,
  })

  if (value?.latitude !== prevValue.lat || value?.longitude !== prevValue.lng) {
    setPrevValue({ lat: value?.latitude, lng: value?.longitude })
    setLatInput(value?.latitude !== undefined ? String(value.latitude) : '')
    setLngInput(value?.longitude !== undefined ? String(value.longitude) : '')
  }

  // Initialisation ArcGIS MapView
  useEffect(() => {
    let isCancelled = false

    async function initMap() {
      if (!mapDivRef.current) return

      try {
        const [
          { default: ArcGISMap },
          { default: MapView },
          { default: Graphic },
          { default: Point },
          { default: GraphicsLayer },
        ] = await Promise.all([
          import('@arcgis/core/Map.js'),
          import('@arcgis/core/views/MapView.js'),
          import('@arcgis/core/Graphic.js'),
          import('@arcgis/core/geometry/Point.js'),
          import('@arcgis/core/layers/GraphicsLayer.js'),
        ])

        if (isCancelled) return

        const graphicsLayer = new GraphicsLayer()
        const map = new ArcGISMap({
          basemap: createRobustBasemap('light'),
          layers: [graphicsLayer],
        })

        const defaultCenter: [number, number] =
          initialRegion?.toUpperCase() === 'CENTRE'
            ? [11.5021, 3.848]
            : [9.7043, 4.0511]

        const centerCoords: [number, number] =
          value && value.latitude !== undefined && value.longitude !== undefined
            ? [value.longitude, value.latitude]
            : defaultCenter

        const view = new MapView({
          container: mapDivRef.current,
          map,
          center: centerCoords,
          zoom: value ? 14 : 12,
          ui: { components: ['zoom'] },
        })

        viewRef.current = view

        // Marqueur de repère
        const updateGraphic = (lng: number, lat: number) => {
          graphicsLayer.removeAll()
          const point = new Point({ longitude: lng, latitude: lat })
          const markerSymbol = {
            type: 'simple-marker' as const,
            style: 'circle' as const,
            color: [16, 185, 129, 0.95] as [number, number, number, number], // Vert émeraude
            size: '14px',
            outline: {
              color: [255, 255, 255, 1] as [number, number, number, number],
              width: 2.5,
            },
          }
          const graphic = new Graphic({
            geometry: point,
            symbol: markerSymbol as unknown as Graphic['symbol'],
          })
          graphicsLayer.add(graphic)
          markerGraphicRef.current = graphic
        }

        if (value?.latitude && value?.longitude) {
          updateGraphic(value.longitude, value.latitude)
        }

        // Clic sur la carte pour piquer la position
        view.on('click', (event: ClickEvent) => {
          if (
            event.mapPoint.latitude == null ||
            event.mapPoint.longitude == null
          )
            return
          const lat = Number(event.mapPoint.latitude.toFixed(5))
          const lng = Number(event.mapPoint.longitude.toFixed(5))
          updateGraphic(lng, lat)
          setLatInput(String(lat))
          setLngInput(String(lng))
          onChange({ latitude: lat, longitude: lng })
        })

        await view.when()
      } catch {
        if (!isCancelled) {
          setMapError(true)
        }
      }
    }

    void initMap()

    return () => {
      isCancelled = true
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recentrer la vue quand les coordonnées changent
  const panToCoords = (lat: number, lng: number) => {
    if (viewRef.current) {
      viewRef.current.goTo({ center: [lng, lat], zoom: 14 })
    }
  }

  // Traiter la saisie manuelle des inputs
  const handleManualInputCommit = () => {
    const parsedLat = parseFloat(latInput.replace(',', '.'))
    const parsedLng = parseFloat(lngInput.replace(',', '.'))
    if (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)) {
      onChange({ latitude: parsedLat, longitude: parsedLng })
      panToCoords(parsedLat, parsedLng)
    }
  }

  // Géolocalisation navigateur
  const handleGeolocate = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5))
        const lng = Number(pos.coords.longitude.toFixed(5))
        setLatInput(String(lat))
        setLngInput(String(lng))
        onChange({ latitude: lat, longitude: lng })
        panToCoords(lat, lng)
      },
      () => {
        // En cas de refus ou indisponibilité, silencieux
      }
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Barre d'outils et raccourcis de centrage */}
      <div className='flex flex-wrap items-center justify-between gap-2 text-xs'>
        <div className='flex items-center gap-1.5'>
          <MapPin className='size-3.5 text-emerald-600' />
          <span className='font-medium text-foreground'>
            {value?.latitude && value?.longitude
              ? `Position sélectionnée : ${value.latitude.toFixed(4)}, ${value.longitude.toFixed(4)}`
              : 'Cliquez sur la carte pour piquer la position'}
          </span>
        </div>

        <div className='flex items-center gap-1.5'>
          <span className='text-muted-foreground mr-1'>Centrer sur :</span>
          {CAMEROON_HUBS.map((hub) => (
            <Button
              key={hub.name}
              type='button'
              variant='outline'
              size='sm'
              className='h-6 px-2 text-[11px]'
              onClick={() => {
                setLatInput(String(hub.lat))
                setLngInput(String(hub.lng))
                onChange({ latitude: hub.lat, longitude: hub.lng })
                panToCoords(hub.lat, hub.lng)
              }}
            >
              {hub.name}
            </Button>
          ))}
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-6 px-2 text-[11px] text-primary'
            onClick={handleGeolocate}
            title='Utiliser ma position GPS actuelle'
          >
            <Navigation className='mr-1 size-3' />
            Position actuelle
          </Button>
        </div>
      </div>

      {/* Conteneur de carte */}
      <div className='relative h-[260px] w-full overflow-hidden rounded-lg border border-border shadow-inner bg-muted/20'>
        {!mapError ? (
          <div ref={mapDivRef} className='h-full w-full' />
        ) : (
          /* Fallback interactif 2D SVG pour environnement de test ou sans WebGL */
          <div
            className='relative h-full w-full bg-slate-900 cursor-crosshair flex items-center justify-center select-none'
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = (e.clientX - rect.left) / rect.width
              const y = (e.clientY - rect.top) / rect.height
              // Approximer les coordonnées Cameroun (lng: 8.5 - 15.5, lat: 2.0 - 13.0)
              const lng = Number((8.5 + x * 7.0).toFixed(5))
              const lat = Number((13.0 - y * 11.0).toFixed(5))
              setLatInput(String(lat))
              setLngInput(String(lng))
              onChange({ latitude: lat, longitude: lng })
            }}
          >
            <div className='text-center text-xs text-slate-400 p-4'>
              <Crosshair className='size-8 text-emerald-500 mx-auto mb-2 opacity-80' />
              <p className='font-medium text-slate-200'>
                Carte interactive SIG
              </p>
              <p className='text-[11px] mt-1'>
                Cliquez pour déposer le repère GPS du point de livraison.
              </p>
              {value?.latitude && value?.longitude ? (
                <Badge className='mt-3 bg-emerald-600 text-white'>
                  {value.latitude}, {value.longitude}
                </Badge>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Saisie manuelle des coordonnées pour ajustement précis */}
      <div className='grid grid-cols-2 gap-3 pt-1'>
        <div className='space-y-1.5'>
          <Label
            htmlFor='map-picker-lat'
            className='text-xs font-medium text-muted-foreground'
          >
            Latitude (° N)
          </Label>
          <Input
            id='map-picker-lat'
            value={latInput}
            placeholder='Ex: 4.0511'
            onChange={(e) => setLatInput(e.target.value)}
            onBlur={handleManualInputCommit}
            className='h-8 font-mono text-xs'
          />
        </div>
        <div className='space-y-1.5'>
          <Label
            htmlFor='map-picker-lng'
            className='text-xs font-medium text-muted-foreground'
          >
            Longitude (° E)
          </Label>
          <Input
            id='map-picker-lng'
            value={lngInput}
            placeholder='Ex: 9.7043'
            onChange={(e) => setLngInput(e.target.value)}
            onBlur={handleManualInputCommit}
            className='h-8 font-mono text-xs'
          />
        </div>
      </div>
    </div>
  )
}
