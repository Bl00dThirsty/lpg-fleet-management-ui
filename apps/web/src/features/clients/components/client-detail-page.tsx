import { useMemo } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  CreditCard,
  User,
  Compass,
  CheckCircle2,
  Clock,
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'
import { PageShell } from '@/components/layout/page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@lpg/api-client'
import { getClientById, clientStatusLabel } from '../data/clients'
import type { Client as CuratedClient } from '@lpg/mock-data'

interface ClientDetailPageProps {
  clientId: string
}

export function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  const navigate = useNavigate()

  // Interroger la liste des clients pour synchronisation avec le fake-adapter / API
  const { data: clientList, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await api.clients.list()
      return (res.data ?? []) as CuratedClient[]
    },
  })

  const clientData = useMemo(() => {
    return getClientById(clientId, clientList)
  }, [clientId, clientList])

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Chargement des détails du client…</p>
          </div>
        </div>
      </PageShell>
    )
  }

  if (!clientData) {
    return (
      <PageShell>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Link to="/clients">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="size-4" />
                Retour aux clients
              </Button>
            </Link>
          </div>

          <Card className="border-destructive/40">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive font-semibold">
                <AlertCircle className="size-5" />
                Client introuvable
              </div>
              <CardDescription>
                Aucune fiche client ne correspond à l’identifiant &ldquo;{clientId}&rdquo;.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate({ to: '/clients' })}>
                Voir la liste des clients
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    )
  }

  const { client, sites } = clientData

  const totalDeliveries = sites.reduce(
    (acc, s) => acc + (s.delivery_count ?? 0),
    0,
  )

  const formatCurrency = (val?: number) => {
    if (!val) return '0 FCFA'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <Link to="/clients">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="size-4" />
                  Retour aux clients
                </Button>
              </Link>
              <Badge
                variant={client.status === 'ACTIVE' ? 'default' : 'secondary'}
                className={
                  client.status === 'ACTIVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-medium'
                    : ''
                }
              >
                {clientStatusLabel(client.status)}
              </Badge>
              <Badge variant="outline">{client.region}</Badge>
            </div>
            {/* Titre sobre, sans icônes superflues sur l'entête */}
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {client.name}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              RCCM : <span className="font-mono font-medium text-foreground">{client.registrationNumber || '—'}</span>
              {' · '}
              NIU : <span className="font-mono font-medium text-foreground">{client.taxId || '—'}</span>
              {' · '}
              Secteur : <span className="font-medium text-foreground">{client.industrySector || 'Distribution GPL'}</span>
            </p>
          </div>
        </div>

        {/* Cartes Métriques KPI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Sites de livraison
              </CardTitle>
              <MapPin className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sites.length}</div>
              <p className="text-xs text-muted-foreground">
                Points de dépôt déclarés
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Plafond de crédit
              </CardTitle>
              <CreditCard className="size-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(client.creditLimit)}
              </div>
              <p className="text-xs text-muted-foreground">
                Encours maximal autorisé
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Délai de règlement
              </CardTitle>
              <Clock className="size-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {client.paymentTerms ?? 30} jours
              </div>
              <p className="text-xs text-muted-foreground">
                Conditions contractuelles
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Livraisons cumulées
              </CardTitle>
              <TrendingUp className="size-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDeliveries}</div>
              <p className="text-xs text-muted-foreground">
                Total des réceptions vérifiées
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Détails légaux & Contact */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Bloc 1 : Informations légales & administratives */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <ShieldCheck className="size-4" />
                Informations légales & identification
              </div>
              <CardDescription>
                Données d’immatriculation et profil réglementaire CSPH.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 divide-y divide-border text-sm">
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Raison sociale</span>
                <span className="font-medium text-foreground">{client.name}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Registre du Commerce (RCCM)</span>
                <span className="font-mono font-medium text-foreground">
                  {client.registrationNumber || '—'}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Numéro Identifiant Unique (NIU)</span>
                <span className="font-mono font-medium text-foreground">
                  {client.taxId || '—'}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Secteur d’activité</span>
                <span className="font-medium text-foreground">
                  {client.industrySector || '—'}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Adresse de facturation</span>
                <span className="text-right font-medium text-foreground">
                  {client.billingAddress || '—'}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Date de création</span>
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  {client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Bloc 2 : Contact principal & Conditions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <User className="size-4" />
                Contact principal & Facturation
              </div>
              <CardDescription>
                Responsable habilité pour les réceptions et la conformité financière.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 divide-y divide-border text-sm">
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Nom complet</span>
                <span className="font-medium text-foreground">{client.contactName}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Téléphone direct</span>
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" />
                  <a
                    href={`tel:${client.contactPhone}`}
                    className="hover:underline text-primary"
                  >
                    {client.contactPhone}
                  </a>
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Adresse e-mail</span>
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5 text-muted-foreground" />
                  <a
                    href={`mailto:${client.contactEmail}`}
                    className="hover:underline text-primary"
                  >
                    {client.contactEmail}
                  </a>
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Délai contractuel de paiement</span>
                <span className="font-medium text-foreground">
                  {client.paymentTerms ?? 30} jours nets
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Plafond financier de crédit</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(client.creditLimit)}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Région principale</span>
                <span className="font-medium text-foreground">{client.region}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bloc 3 : Sites de livraison & Positionnement GPS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Compass className="size-4" />
                  Sites de livraison & Coordonnées SIG ({sites.length})
                </div>
                <CardDescription>
                  Emplacements géoréférencés enregistrés pour ce client distributeur.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <MapPin className="size-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">Aucun site de livraison configuré</p>
                <p className="text-xs">Ce client n’a pas encore de points de livraison rattachés.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom du site</TableHead>
                      <TableHead>Région</TableHead>
                      <TableHead>Adresse physique</TableHead>
                      <TableHead>Coordonnées GPS</TableHead>
                      <TableHead>Vérification SIG</TableHead>
                      <TableHead className="text-right">Livraisons</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sites.map((site) => {
                      const lat = site.latitude
                      const lng = site.longitude
                      const hasGps = lat !== undefined && lng !== undefined

                      return (
                        <TableRow key={site.id}>
                          <TableCell className="font-medium">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-foreground">{site.name}</span>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Badge
                                  variant="outline"
                                  className={
                                    site.status === 'ACTIVE'
                                      ? 'text-emerald-700 dark:text-emerald-400 border-emerald-300'
                                      : ''
                                  }
                                >
                                  {clientStatusLabel(site.status)}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{site.region}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {site.address || '—'}
                          </TableCell>
                          <TableCell>
                            {hasGps ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-foreground bg-muted px-2 py-1 rounded">
                                  {lat.toFixed(4)}, {lng.toFixed(4)}
                                </span>
                                <a
                                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80 transition-colors"
                                  title="Voir sur Google Maps"
                                >
                                  <ExternalLink className="size-3.5" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Non localisé</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {site.verified ? (
                                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs">
                                  <CheckCircle2 className="size-3" />
                                  Vérifié ({site.geo_confidence_score ?? 100}%)
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1 text-xs">
                                  <Clock className="size-3" />
                                  À vérifier ({site.geo_confidence_score ?? 50}%)
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {site.delivery_count ?? 0}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
