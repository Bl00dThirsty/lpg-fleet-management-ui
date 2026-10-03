import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  User,
  Compass,
} from 'lucide-react'
import { PageShell } from '@/components/layout/page'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { api } from '@lpg/api-client'
import { useQueryClient } from '@tanstack/react-query'
import type { Region } from '@lpg/types'

const REGIONS: { value: Region; label: string }[] = [
  { value: 'LITTORAL', label: 'Littoral (Douala)' },
  { value: 'CENTRE', label: 'Centre (Yaoundé)' },
  { value: 'OUEST', label: 'Ouest (Bafoussam)' },
  { value: 'SUDOUEST', label: 'Sud-Ouest (Limbé / Buéa)' },
  { value: 'NORD', label: 'Nord (Garoua)' },
  { value: 'EXTREMENORD', label: 'Extrême-Nord (Maroua)' },
  { value: 'ADAMAOUA', label: 'Adamaoua (Ngaoundéré)' },
  { value: 'SUD', label: 'Sud (Kribi / Ebolowa)' },
  { value: 'EST', label: 'Est (Bertoua)' },
  { value: 'NORDOUEST', label: 'Nord-Ouest (Bamenda)' },
]

const SECTORS = [
  'Hôtellerie & Restauration (CHR)',
  'Industrie Agroalimentaire',
  'Industrie Lourde & Métallurgie',
  'Commerce & Distribution GPL',
  'Bâtiment & Travaux Publics',
  'Santé & Établissements Publics',
  'Autre',
]

const CITY_COORDINATES = [
  { city: 'Douala', lat: 4.0511, lng: 9.7085, region: 'LITTORAL' as Region },
  { city: 'Yaoundé', lat: 3.8667, lng: 11.5167, region: 'CENTRE' as Region },
  { city: 'Bafoussam', lat: 5.4778, lng: 10.4176, region: 'OUEST' as Region },
  { city: 'Limbé', lat: 4.0242, lng: 9.2140, region: 'SUDOUEST' as Region },
]

const clientSiteSchema = z.object({
  name: z.string().min(2, 'Le nom du site est requis'),
  region: z.string().min(1, 'La région est requise'),
  address: z.string().min(3, 'L’adresse physique est requise'),
  latitude: z.number().min(1.5, 'Latitude invalide au Cameroun').max(13.5, 'Latitude hors Cameroun'),
  longitude: z.number().min(8.0, 'Longitude invalide au Cameroun').max(16.5, 'Longitude hors Cameroun'),
  site_contact_name: z.string().optional(),
  site_contact_phone: z.string().optional(),
  capacity_info: z.string().optional(),
})

const clientFormSchema = z.object({
  name: z.string().min(2, 'La raison sociale est requise'),
  registration_number: z.string().min(3, 'Le numéro RCCM est requis'),
  tax_id: z.string().min(3, 'Le NIU fiscal est requis'),
  industry_sector: z.string().min(2, 'Le secteur d’activité est requis'),
  billing_address: z.string().min(3, 'L’adresse de facturation est requise'),
  payment_terms: z.number().min(0, 'Délai positif requis'),
  credit_limit: z.number().min(0, 'Plafond positif requis'),
  is_active: z.boolean(),
  primary_contact_name: z.string().min(2, 'Le nom du contact est requis'),
  primary_contact_phone: z.string().min(6, 'Numéro de téléphone requis'),
  primary_contact_email: z.string().email('Adresse e-mail valide requise'),
  sites: z.array(clientSiteSchema).min(1, 'Veuillez configurer au moins un site de livraison'),
})

type ClientFormValues = z.infer<typeof clientFormSchema>

export function ClientFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      registration_number: '',
      tax_id: '',
      industry_sector: 'Hôtellerie & Restauration (CHR)',
      billing_address: '',
      payment_terms: 30,
      credit_limit: 5000000,
      is_active: true,
      primary_contact_name: '',
      primary_contact_phone: '',
      primary_contact_email: '',
      sites: [
        {
          name: 'Site Principal',
          region: 'LITTORAL',
          address: '',
          latitude: 4.0511,
          longitude: 9.7085,
          site_contact_name: '',
          site_contact_phone: '',
          capacity_info: 'Cuve VRAC 20 TM',
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'sites',
  })

  async function onSubmit(values: ClientFormValues) {
    setSubmitting(true)
    try {
      // 1. Créer l'organisation de type CLIENT
      const orgRes = await api.organizations.create({
        name: values.name,
        type: 'CLIENT',
        registration_number: values.registration_number,
        tax_id: values.tax_id,
        is_active: values.is_active,
      })

      const orgId = orgRes?.id ?? `org-client-${Date.now()}`

      // 2. Créer l'entité Client associée
      await api.clients.create({
        org_id: orgId,
        primary_contact_name: values.primary_contact_name,
        primary_contact_phone: values.primary_contact_phone,
        primary_contact_email: values.primary_contact_email,
        billing_address: values.billing_address,
        payment_terms: values.payment_terms,
        credit_limit: values.credit_limit,
        tax_id: values.tax_id,
        industry_sector: values.industry_sector,
        is_active: values.is_active,
      })

      // 3. Créer chaque site de livraison déclaré
      for (const site of values.sites) {
        await api.clientSites.create({
          client_org_id: orgId,
          name: site.name,
          region: site.region,
          address: site.address,
          geo_point: [site.longitude, site.latitude],
          site_contact_name: site.site_contact_name || values.primary_contact_name,
          site_contact_phone: site.site_contact_phone || values.primary_contact_phone,
          is_active: true,
          is_verified: false,
        })
      }

      await queryClient.invalidateQueries({ queryKey: ['clients'] })
      await queryClient.invalidateQueries({ queryKey: ['client-sites'] })

      toast.success(
        `Client "${values.name}" enregistré avec succès avec ${values.sites.length} site(s) de livraison.`,
      )
      navigate({ to: '/clients' })
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Échec de l’enregistrement du client et de ses sites.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link to="/clients">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="size-4" />
                Retour aux clients
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Nouveau client distributeur
              </h1>
              <p className="text-xs text-muted-foreground">
                Déclaration des données légales de l’entreprise et intégration de ses points de livraison.
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* ── Section 1 : Informations Légales ──────────────────── */}
            <Card className="border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <ShieldCheck className="size-4" />
                  Informations légales & administratives
                </div>
                <CardDescription>
                  Identification officielle de la société sous contrôle réglementaire CSPH.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Raison sociale *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Société des Brasseries du Cameroun (SABC)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industry_sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secteur d’activité *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un secteur" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SECTORS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="registration_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro RCCM *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: RC/DLA/2018/B/0412" {...field} />
                        </FormControl>
                        <FormDescription>Registre du Commerce et du Crédit Mobilier</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tax_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro d’Identifiant Unique (NIU) *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: M0200156789A" {...field} />
                        </FormControl>
                        <FormDescription>Identifiant fiscal officiel de la DGI</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="billing_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse de facturation / Siège social *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Boulevard de la Liberté, Akwa Nord, BP 1214, Douala"
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
                  <FormField
                    control={form.control}
                    name="payment_terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modalités de règlement (jours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Délai de paiement accordé (ex: 30j)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="credit_limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plafond de crédit (FCFA)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={100000}
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Limite d'encours autorisée</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Statut du client</FormLabel>
                          <FormDescription className="text-xs">
                            {field.value ? 'Actif pour les tournées' : 'Compte suspendu'}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Section 2 : Contact Principal ────────────────────────── */}
            <Card className="border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <User className="size-4" />
                  Contact référent entreprise
                </div>
                <CardDescription>
                  Interlocuteur principal pour les notifications et la validation des bons de livraison.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="primary_contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet du contact *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Jean-Marc Ngassam" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primary_contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de téléphone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+237 699 00 11 22" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primary_contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse e-mail *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@entreprise.cm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Section 3 : Sites & Points de livraison ──────────────── */}
            <Card className="border-border">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <MapPin className="size-4" />
                      Points et sites de livraison ({fields.length})
                    </div>
                    <CardDescription>
                      Localisation géographique et coordonnées GPS des cuves ou dépôts à approvisionner.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        name: `Site de livraison #${fields.length + 1}`,
                        region: 'LITTORAL',
                        address: '',
                        latitude: 4.0511,
                        longitude: 9.7085,
                        site_contact_name: '',
                        site_contact_phone: '',
                        capacity_info: 'Cuve VRAC 20 TM',
                      })
                    }
                    className="gap-1.5 self-start sm:self-auto"
                  >
                    <Plus className="size-3.5" />
                    Ajouter un site
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {fields.map((siteField, index) => (
                  <div
                    key={siteField.id}
                    className="relative rounded-lg border border-border/80 bg-card p-4 space-y-4 shadow-2xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-semibold text-xs">
                          Site #{index + 1}
                        </Badge>
                        <span className="text-sm font-medium text-foreground">
                          {form.watch(`sites.${index}.name`) || `Nouveau site`}
                        </span>
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="h-8 text-destructive hover:bg-destructive/10 gap-1 text-xs"
                        >
                          <Trash2 className="size-3.5" />
                          Supprimer
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name={`sites.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Nom du point de livraison *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Akwa Palace - Cuve Principale" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`sites.${index}.region`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Région administrative *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Région" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {REGIONS.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>
                                    {r.label}
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
                        name={`sites.${index}.capacity_info`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Capacité / Type d’équipement</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Cuve VRAC 20 TM ou 50 btl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`sites.${index}.address`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Adresse géographique & repère *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Boulevard de la Liberté, face Hôtel de Ville" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Coordonnées GPS avec pré-remplissage rapide */}
                    <div className="space-y-2 rounded-md bg-muted/40 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Compass className="size-3.5 text-primary" />
                          Position GPS (Système WGS84)
                        </span>
                        <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                          <span>Pré-calibrer :</span>
                          {CITY_COORDINATES.map((city) => (
                            <button
                              key={city.city}
                              type="button"
                              onClick={() => {
                                form.setValue(`sites.${index}.latitude`, city.lat)
                                form.setValue(`sites.${index}.longitude`, city.lng)
                                form.setValue(`sites.${index}.region`, city.region)
                              }}
                              className="rounded px-1.5 py-0.5 bg-background border hover:bg-accent text-foreground text-[10px] font-medium transition-colors cursor-pointer"
                            >
                              {city.city}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`sites.${index}.latitude`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[11px]">Latitude (° Nord)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.0001"
                                  placeholder="4.0511"
                                  value={field.value}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`sites.${index}.longitude`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[11px]">Longitude (° Est)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.0001"
                                  placeholder="9.7085"
                                  value={field.value}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`sites.${index}.site_contact_name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Responsable sur site</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: M. Jean Talla (Chef de Sécurité)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`sites.${index}.site_contact_phone`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Téléphone sur site</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: +237 677 12 34 56" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Submit & Cancel Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link to="/clients">
                <Button type="button" variant="outline" disabled={submitting}>
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enregistrement en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Enregistrer le client et ses sites
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageShell>
  )
}
