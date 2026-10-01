import { useState } from 'react'
import { Radio } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatTm } from '../utils/format'
import type { NationalMapView } from '../data/national-map'
import type { VracTourRoute } from '../data/itineraries'
import type { MapLayerKey } from '../lib/layers'

export interface GisCanvasFallbackProps {
  data: NationalMapView
  layers: Record<MapLayerKey, boolean>
  focusedRoute?: VracTourRoute | null
  onFocusRoute?: (route: VracTourRoute) => void
  className?: string
}

export function GisCanvasFallback({
  data,
  layers,
  focusedRoute,
  onFocusRoute: _onFocusRoute,
  className = '',
}: GisCanvasFallbackProps) {
  const [selectedEntity, setSelectedEntity] = useState<{
    title: string
    subtitle: string
    details: Record<string, string>
  } | null>(null)

  const activeRoute = focusedRoute ?? data.routes[0]

  return (
    <div
      className={`relative min-h-[620px] w-full overflow-hidden rounded-xl border border-border/60 bg-slate-950 text-slate-100 shadow-inner ${className}`}
    >
      {/* Grid Background Effect */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Cameroon / Douala Stylized GIS SVG Canvas */}
      <svg
        viewBox="0 0 1000 650"
        className="absolute inset-0 h-full w-full select-none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="routeGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Estuaire du Wouri / Baie de Bonabéri (Douala Waterway) */}
        <path
          d="M 120 400 Q 250 360 380 410 T 600 480 Q 750 560 900 650 L 0 650 L 0 400 Z"
          fill="url(#waterGrad)"
          opacity="0.3"
        />

        {/* Tracé Pont du Wouri (Infrastructure Douala) */}
        <line
          x1="320"
          y1="375"
          x2="520"
          y2="345"
          stroke="#475569"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.6"
        />
        <line
          x1="320"
          y1="375"
          x2="520"
          y2="345"
          stroke="#94a3b8"
          strokeWidth="3"
          strokeDasharray="6,4"
        />
        <text x="380" y="340" fill="#94a3b8" fontSize="11" fontWeight="600" opacity="0.8">
          Pont sur le Wouri (RN3)
        </text>

        {/* ITINÉRAIRE VRAC (Total Bonabéri -> Akwa Palace Hotel) */}
        {(layers.routes ?? true) && activeRoute && (
          <g>
            {/* Glow outer casing */}
            <path
              d="M 180 395 C 240 390 280 380 330 375 L 510 345 C 570 340 640 370 700 375"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="8"
              strokeOpacity="0.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Core route path */}
            <path
              d="M 180 395 C 240 390 280 380 330 375 L 510 345 C 570 340 640 370 700 375"
              fill="none"
              stroke="url(#routeGlow)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
            {/* Moving pulse indicator */}
            <circle cx="420" cy="358" r="8" fill="#f59e0b" fillOpacity="0.4">
              <animate attributeName="r" values="6;16;6" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Truck Position on Wouri Bridge */}
            <g
              transform="translate(420, 358)"
              className="cursor-pointer transition-transform hover:scale-125"
              onClick={() =>
                setSelectedEntity({
                  title: `Camion Citerne : ${activeRoute.vehiclePlate}`,
                  subtitle: activeRoute.title,
                  details: {
                    Chauffeur: activeRoute.driverName,
                    Position: 'Traversée du Pont sur le Wouri (RN3)',
                    Volume: formatTm(activeRoute.loadedQuantityTM),
                    Pression: `${activeRoute.pressureBars} bars`,
                    'Statut GPS': 'En ligne • 38 km/h',
                  },
                })
              }
            >
              <rect x="-14" y="-14" width="28" height="28" rx="8" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
              <circle cx="0" cy="0" r="4" fill="#ffffff" />
            </g>
          </g>
        )}

        {/* SITES MARCHANDS & DÉPÔTS */}
        {(layers.sites ?? true) && (
          <g>
            {/* Total Bonabéri (Départ) */}
            <g
              transform="translate(180, 395)"
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() =>
                setSelectedEntity({
                  title: 'Total Bonabéri (Centre Emplisseur & Vrac)',
                  subtitle: 'Zone Industrielle de Bonabéri, Douala',
                  details: {
                    Type: 'Centre Emplisseur & Stockage Vrac',
                    Opérateur: 'TotalEnergies Marketing Cameroun',
                    Région: 'Littoral',
                    Statut: 'Opérationnel certifié CSPH',
                  },
                })
              }
            >
              <circle cx="0" cy="0" r="16" fill="#10b981" fillOpacity="0.25" />
              <circle cx="0" cy="0" r="10" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              <text x="-4" y="4" fill="#ffffff" fontSize="10" fontWeight="bold">T</text>
              <text x="-40" y="-18" fill="#10b981" fontSize="12" fontWeight="700">
                Total Bonabéri (Départ)
              </text>
            </g>

            {/* Dépôt SCDP Bonabéri */}
            <g
              transform="translate(240, 320)"
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() =>
                setSelectedEntity({
                  title: 'Dépôt SCDP Bonabéri',
                  subtitle: 'Société Camerounaise des Dépôts Pétroliers',
                  details: {
                    Type: 'Dépôt Pétrolier Stratégique',
                    Capacité: 'Stockage national de sécurité',
                    Région: 'Littoral',
                    Statut: 'Actif',
                  },
                })
              }
            >
              <circle cx="0" cy="0" r="14" fill="#059669" fillOpacity="0.2" />
              <circle cx="0" cy="0" r="9" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />
              <text x="-45" y="-14" fill="#34d399" fontSize="11" fontWeight="600">
                Dépôt SCDP Bonabéri
              </text>
            </g>

            {/* SCDP Nsam Yaoundé */}
            <g
              transform="translate(850, 220)"
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() =>
                setSelectedEntity({
                  title: 'Dépôt SCDP Nsam Yaoundé',
                  subtitle: 'Région du Centre, Yaoundé',
                  details: {
                    Type: 'Dépôt & Centre Relais',
                    Opérateur: 'SCDP Yaoundé',
                    Région: 'Centre',
                    Statut: 'Actif',
                  },
                })
              }
            >
              <circle cx="0" cy="0" r="12" fill="#059669" fillOpacity="0.2" />
              <circle cx="0" cy="0" r="8" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />
              <text x="-40" y="-12" fill="#34d399" fontSize="11" fontWeight="600">
                SCDP Nsam (Yaoundé)
              </text>
            </g>
          </g>
        )}

        {/* SITES CLIENTS */}
        {(layers.clientSites ?? true) && (
          <g>
            {/* Akwa Palace Hotel (Arrivée) */}
            <g
              transform="translate(700, 375)"
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() =>
                setSelectedEntity({
                  title: 'Akwa Palace Hotel (Cuves GPL Vrac)',
                  subtitle: 'Boulevard de la Liberté, Akwa, Douala',
                  details: {
                    Client: 'Groupe Hôtelier Akwa Palace',
                    'Capacité Cuve': '20 TM GPL Vrac',
                    Marketeur: 'TotalEnergies Marketing Cameroun',
                    Statut: 'Point de livraison certifié',
                  },
                })
              }
            >
              <circle cx="0" cy="0" r="16" fill="#3b82f6" fillOpacity="0.25" />
              <circle cx="0" cy="0" r="10" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              <text x="-4" y="4" fill="#ffffff" fontSize="10" fontWeight="bold">A</text>
              <text x="-50" y="-18" fill="#60a5fa" fontSize="12" fontWeight="700">
                Akwa Palace Hotel (Arrivée)
              </text>
            </g>

            {/* Hôtel Sawa */}
            <g
              transform="translate(670, 440)"
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() =>
                setSelectedEntity({
                  title: 'Hôtel Sawa Douala',
                  subtitle: 'Avenue des Cocotiers, Bonanjo, Douala',
                  details: {
                    Client: 'Société Hôtelière du Sawa',
                    Usage: 'Cuisines & Chaudières',
                    Région: 'Littoral',
                  },
                })
              }
            >
              <circle cx="0" cy="0" r="10" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
              <text x="14" y="4" fill="#93c5fd" fontSize="11" fontWeight="500">
                Hôtel Sawa
              </text>
            </g>
          </g>
        )}

        {/* ANOMALIES GÉOGRAPHIQUES */}
        {(layers.anomalies ?? false) && (
          <g
            transform="translate(200, 420)"
            className="cursor-pointer transition-transform hover:scale-110"
            onClick={() =>
              setSelectedEntity({
                title: 'Alerte : Écart de pesée VRAC (-0.8 TM)',
                subtitle: 'Site Total Bonabéri (Sortie Pont-Bascule)',
                details: {
                  Catégorie: 'INVESTIGATION',
                  Gravité: 'ÉLEVÉ (Action requise)',
                  'Écart constaté': '-0,8 TM entre bon de chargement et pesée',
                  Statut: 'Nouveau / Sous contrôle inspecteur CSPH',
                },
              })
            }
          >
            <circle cx="0" cy="0" r="14" fill="#ef4444" fillOpacity="0.3" className="animate-ping" />
            <circle cx="0" cy="0" r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            <text x="-4" y="4" fill="#ffffff" fontSize="11" fontWeight="bold">!</text>
            <text x="-30" y="24" fill="#f87171" fontSize="11" fontWeight="600">
              Écart pesée (-0.8 TM)
            </text>
          </g>
        )}
      </svg>

      {/* Top Overlay Badges */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className="gap-1.5 border-transparent bg-slate-900/90 text-white shadow-md backdrop-blur">
            <Radio className="size-3 text-emerald-400 animate-pulse" />
            Supervision SIG Douala & Réseau National
          </Badge>
          <Badge variant="outline" className="border-border/40 bg-slate-900/80 text-slate-300 backdrop-blur">
            Itinéraire VRAC RN3 actif
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-border/40 bg-slate-900/80 text-emerald-400 backdrop-blur">
            {data.sites.length} sites actifs
          </Badge>
          <Badge variant="outline" className="border-border/40 bg-slate-900/80 text-blue-400 backdrop-blur">
            {data.clientSites.length} clients
          </Badge>
          <Badge variant="outline" className="border-border/40 bg-slate-900/80 text-amber-400 backdrop-blur">
            {formatTm(data.vrac.totalTM)}
          </Badge>
        </div>
      </div>

      {/* Entity Popup / Details Card */}
      {selectedEntity && (
        <div className="pointer-events-auto absolute bottom-6 right-6 max-w-sm rounded-2xl border border-border/80 bg-slate-900/95 p-4 text-xs shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <h4 className="font-bold text-sm text-white">{selectedEntity.title}</h4>
              <p className="text-[11px] text-slate-400">{selectedEntity.subtitle}</p>
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-white"
              onClick={() => setSelectedEntity(null)}
            >
              ✕
            </button>
          </div>

          <div className="mt-2.5 space-y-1.5">
            {Object.entries(selectedEntity.details).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-slate-400">{key} :</span>
                <span className="font-semibold text-slate-200">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="pointer-events-none absolute bottom-4 left-4 text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg backdrop-blur">
        💡 Cliquez sur les repères ou le camion pour inspecter les données de traçabilité en temps réel.
      </div>
    </div>
  )
}
