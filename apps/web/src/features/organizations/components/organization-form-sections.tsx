import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form'
import {
  ShieldCheck,
  User,
  MapPin,
  Plus,
  Trash2,
  Compass,
  KeyRound,
} from 'lucide-react'
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
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  CITY_COORDINATES,
  ORG_TYPE_OPTIONS,
  REGIONS,
  SECTORS,
  defaultRoleForOrgType,
  type OrganizationFormValues,
} from '../data/organization-form-schema'
import type { OrganizationType } from '@lpg/types'

interface LegalInfoSectionProps {
  form: UseFormReturn<OrganizationFormValues>
  fixedType?: OrganizationType
}

export function LegalInfoSection({ form, fixedType }: LegalInfoSectionProps) {
  const currentType = form.watch('type')

  return (
    <Card className='border-border'>
      <CardHeader className='pb-4'>
        <div className='flex items-center gap-2 text-primary font-semibold text-sm'>
          <ShieldCheck className='size-4' />
          Informations légales & administratives
        </div>
        <CardDescription>
          Identification officielle de l’entité sous régulation CSPH.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Raison sociale *</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Ex: Société des Brasseries du Cameroun (SABC)'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!fixedType ? (
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d’organisation *</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      // Auto-update account role when org type changes
                      if (form.watch('create_account')) {
                        form.setValue(
                          'account_system_role',
                          defaultRoleForOrgType(val as OrganizationType),
                        )
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Sélectionnez un type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ORG_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {ORG_TYPE_OPTIONS.find((o) => o.value === currentType)
                      ?.description ?? 'Rôle réglementaire dans le système.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormItem>
              <FormLabel>Type d’organisation</FormLabel>
              <div className='pt-2'>
                <Badge variant='secondary' className='text-xs font-semibold px-2.5 py-1'>
                  {ORG_TYPE_OPTIONS.find((o) => o.value === fixedType)?.label ?? fixedType}
                </Badge>
              </div>
            </FormItem>
          )}
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <FormField
            control={form.control}
            name='industry_sector'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secteur d’activité *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Sélectionnez un secteur' />
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

          <FormField
            control={form.control}
            name='registration_number'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro RCCM *</FormLabel>
                <FormControl>
                  <Input placeholder='Ex: RC/DLA/2018/B/0412' {...field} />
                </FormControl>
                <FormDescription>Registre du Commerce</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='tax_id'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro Identifiant Unique (NIU) *</FormLabel>
                <FormControl>
                  <Input placeholder='Ex: M0200156789A' {...field} />
                </FormControl>
                <FormDescription>Identifiant fiscal DGI</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='billing_address'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse de facturation / Siège social *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Ex: Boulevard de la Liberté, Akwa Nord, BP 1214, Douala'
                  className='resize-none'
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2'>
          <FormField
            control={form.control}
            name='payment_terms'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modalités de règlement (jours)</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    min={0}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Délai de paiement (ex: 30j)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='credit_limit'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plafond de crédit (FCFA)</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    min={0}
                    step={100000}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Limite d’encours autorisée</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='is_active'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-sm'>Statut d’activité</FormLabel>
                  <FormDescription className='text-xs'>
                    {field.value ? 'Opérationnelle' : 'En veille / suspendue'}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface ContactSectionProps {
  form: UseFormReturn<OrganizationFormValues>
}

export function ContactSection({ form }: ContactSectionProps) {
  return (
    <Card className='border-border'>
      <CardHeader className='pb-4'>
        <div className='flex items-center gap-2 text-primary font-semibold text-sm'>
          <User className='size-4' />
          Contact référent officiel
        </div>
        <CardDescription>
          Interlocuteur principal pour les correspondances, alertes et notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <FormField
            control={form.control}
            name='primary_contact_name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet du contact *</FormLabel>
                <FormControl>
                  <Input placeholder='Ex: Jean-Marc Ngassam' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='primary_contact_phone'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de téléphone *</FormLabel>
                <FormControl>
                  <Input placeholder='+237 699 00 11 22' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='primary_contact_email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse e-mail *</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='contact@entreprise.cm'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface DeliverySitesSectionProps {
  form: UseFormReturn<OrganizationFormValues>
  fieldArray: UseFieldArrayReturn<OrganizationFormValues, 'sites'>
  isClientMode?: boolean
}

export function DeliverySitesSection({
  form,
  fieldArray,
  isClientMode,
}: DeliverySitesSectionProps) {
  const { fields, append, remove } = fieldArray

  return (
    <Card className='border-border'>
      <CardHeader className='pb-4'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
          <div>
            <div className='flex items-center gap-2 text-primary font-semibold text-sm'>
              <MapPin className='size-4' />
              {isClientMode
                ? `Points et sites de livraison (${fields.length})`
                : `Sites opérationnels & dépôts (${fields.length})`}
            </div>
            <CardDescription>
              {isClientMode
                ? 'Localisation géographique et coordonnées GPS des cuves ou dépôts clients.'
                : 'Implantations opérationnelles, entrepôts ou bases logistiques de l’entité.'}
            </CardDescription>
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() =>
              append({
                name: isClientMode
                  ? `Point de livraison #${fields.length + 1}`
                  : `Site opérationnel #${fields.length + 1}`,
                region: 'LITTORAL',
                address: '',
                latitude: 4.0511,
                longitude: 9.7085,
                site_contact_name: '',
                site_contact_phone: '',
                capacity_info: isClientMode
                  ? 'Cuve VRAC 20 TM'
                  : 'Entrepôt & Parc camions',
              })
            }
            className='gap-1.5 self-start sm:self-auto'
          >
            <Plus className='size-3.5' />
            Ajouter un site
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-5'>
        {fields.map((siteField, index) => (
          <div
            key={siteField.id}
            className='relative rounded-lg border border-border/80 bg-card p-4 space-y-4 shadow-2xs'
          >
            <div className='flex items-center justify-between pb-2 border-b border-border/60'>
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='font-semibold text-xs'>
                  Site #{index + 1}
                </Badge>
                <span className='text-sm font-medium text-foreground'>
                  {form.watch(`sites.${index}.name`) || `Nouveau site`}
                </span>
              </div>
              {fields.length > 1 && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => remove(index)}
                  className='h-8 text-destructive hover:bg-destructive/10 gap-1 text-xs'
                >
                  <Trash2 className='size-3.5' />
                  Supprimer
                </Button>
              )}
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              <FormField
                control={form.control}
                name={`sites.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>Nom du site *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ex: Base Bonabéri ou Akwa Palace'
                        {...field}
                      />
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
                    <FormLabel className='text-xs'>Région administrative *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Région' />
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
                    <FormLabel className='text-xs'>Capacité / Équipement</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ex: Cuve VRAC 20 TM ou Parc 15 camions'
                        {...field}
                      />
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
                  <FormLabel className='text-xs'>Adresse géographique & repère *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Ex: Boulevard de la Liberté, face Hôtel de Ville'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Coordonnées GPS avec pré-remplissage rapide */}
            <div className='space-y-2 rounded-md bg-muted/40 p-3'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <span className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                  <Compass className='size-3.5 text-primary' />
                  Position GPS (Système WGS84)
                </span>
                <div className='flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground'>
                  <span>Pré-calibrer :</span>
                  {CITY_COORDINATES.map((city) => (
                    <button
                      key={city.city}
                      type='button'
                      onClick={() => {
                        form.setValue(`sites.${index}.latitude`, city.lat)
                        form.setValue(`sites.${index}.longitude`, city.lng)
                        form.setValue(`sites.${index}.region`, city.region)
                      }}
                      className='rounded px-1.5 py-0.5 bg-background border hover:bg-accent text-foreground text-[10px] font-medium transition-colors cursor-pointer'
                    >
                      {city.city}
                    </button>
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name={`sites.${index}.latitude`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-[11px]'>Latitude (° Nord)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.0001'
                          placeholder='4.0511'
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
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
                      <FormLabel className='text-[11px]'>Longitude (° Est)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.0001'
                          placeholder='9.7085'
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name={`sites.${index}.site_contact_name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>Responsable sur site</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ex: M. Jean Talla (Chef de Sécurité)'
                        {...field}
                      />
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
                    <FormLabel className='text-xs'>Téléphone sur site</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ex: +237 677 12 34 56'
                        {...field}
                      />
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
  )
}

interface AccountSectionProps {
  form: UseFormReturn<OrganizationFormValues>
}

export function AccountSection({ form }: AccountSectionProps) {
  const createAccount = form.watch('create_account')
  const orgType = form.watch('type')

  return (
    <Card className='border-border'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2 text-primary font-semibold text-sm'>
            <KeyRound className='size-4' />
            Compte d’accès et d’authentification (optionnel)
          </div>
          <FormField
            control={form.control}
            name='create_account'
            render={({ field }) => (
              <FormItem className='flex items-center gap-2'>
                <FormLabel className='text-xs text-muted-foreground cursor-pointer'>
                  Créer un compte
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked)
                      if (checked) {
                        const nameParts = (
                          form.getValues('primary_contact_name') || ''
                        ).split(' ')
                        if (nameParts[0] && !form.getValues('account_first_name')) {
                          form.setValue('account_first_name', nameParts[0])
                        }
                        if (
                          nameParts.slice(1).join(' ') &&
                          !form.getValues('account_last_name')
                        ) {
                          form.setValue(
                            'account_last_name',
                            nameParts.slice(1).join(' '),
                          )
                        }
                        if (
                          form.getValues('primary_contact_email') &&
                          !form.getValues('account_email')
                        ) {
                          form.setValue(
                            'account_email',
                            form.getValues('primary_contact_email'),
                          )
                        }
                        form.setValue(
                          'account_system_role',
                          defaultRoleForOrgType(orgType),
                        )
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <CardDescription>
          Génère immédiatement un identifiant et un mot de passe temporaire pour l’accès web/mobile.
        </CardDescription>
      </CardHeader>
      {createAccount && (
        <CardContent className='space-y-4 pt-2 border-t border-border/60'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <FormField
              control={form.control}
              name='account_first_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Prénom *</FormLabel>
                  <FormControl>
                    <Input placeholder='Prénom du titulaire' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='account_last_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Nom *</FormLabel>
                  <FormControl>
                    <Input placeholder='Nom de famille' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='account_email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Adresse e-mail de connexion *</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='identifiant@organisation.cm'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='account_system_role'
            render={({ field }) => (
              <FormItem className='max-w-xs'>
                <FormLabel className='text-xs'>Rôle attribué</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || defaultRoleForOrgType(orgType)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Sélectionnez un rôle' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='TRANSPORTEUR'>Transporteur</SelectItem>
                    <SelectItem value='MARKETEUR'>Marketeur</SelectItem>
                    <SelectItem value='AGENT'>Agent Dépôt</SelectItem>
                    <SelectItem value='SUPERVISOR'>Superviseur</SelectItem>
                    <SelectItem value='LIVREUR'>Livreur</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className='text-[11px]'>
                  Rôle déduit du type d’organisation ({orgType}).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      )}
    </Card>
  )
}
