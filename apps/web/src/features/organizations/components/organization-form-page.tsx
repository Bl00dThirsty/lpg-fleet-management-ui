import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Loader2,
  Check,
} from 'lucide-react'
import { PageShell } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useQueryClient } from '@tanstack/react-query'
import type { OrganizationType } from '@lpg/types'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'
import {
  organizationFormSchema,
  defaultRoleForOrgType,
  type OrganizationFormValues,
} from '../data/organization-form-schema'
import {
  LegalInfoSection,
  ContactSection,
  DeliverySitesSection,
  AccountSection,
} from './organization-form-sections'
import { submitOrganizationForm } from '../data/organization-submit'

export interface OrganizationFormPageProps {
  initialType?: OrganizationType
  fixedType?: OrganizationType
  backTo?: string
  title?: string
  subtitle?: string
}

export function OrganizationFormPage({
  initialType = 'MARKETEUR',
  fixedType,
  backTo = '/organizations',
  title = 'Nouvelle organisation',
  subtitle = 'Déclaration officielle d’une organisation partenaire et configuration de ses implantations.',
}: OrganizationFormPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string
    password?: string
    role: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const effectiveType = fixedType ?? initialType

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: '',
      type: effectiveType,
      registration_number: '',
      tax_id: '',
      industry_sector:
        effectiveType === 'CLIENT'
          ? 'Hôtellerie & Restauration (CHR)'
          : effectiveType === 'TRANSPORTEUR'
            ? 'Transport & Logistique'
            : 'Commerce & Distribution GPL',
      billing_address: '',
      payment_terms: effectiveType === 'TRANSPORTEUR' ? 45 : 30,
      credit_limit: effectiveType === 'CLIENT' ? 5000000 : 0,
      is_active: true,
      primary_contact_name: '',
      primary_contact_phone: '',
      primary_contact_email: '',
      sites: [
        {
          name:
            effectiveType === 'CLIENT'
              ? 'Site Principal'
              : 'Base d’exploitation principale',
          region: 'LITTORAL',
          address: '',
          latitude: 4.0511,
          longitude: 9.7085,
          site_contact_name: '',
          site_contact_phone: '',
          capacity_info:
            effectiveType === 'CLIENT'
              ? 'Cuve VRAC 20 TM'
              : 'Entrepôt & Base logistique',
        },
      ],
      create_account: false,
      account_first_name: '',
      account_last_name: '',
      account_email: '',
      account_system_role: defaultRoleForOrgType(effectiveType),
    },
  })

  const fieldArray = useFieldArray({
    control: form.control,
    name: 'sites',
  })

  async function onSubmit(values: OrganizationFormValues) {
    setSubmitting(true)
    try {
      const result = await submitOrganizationForm(values)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['organizations'] }),
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['client-sites'] }),
        queryClient.invalidateQueries({ queryKey: ['sites'] }),
        queryClient.invalidateQueries({ queryKey: ['users'] }),
      ])

      toast.success(
        `Organisation "${values.name}" enregistrée avec succès (${values.sites.length} site(s)).`,
      )

      if (result.createdUser?.password) {
        setCreatedCredentials({
          email: result.createdUser.email,
          password: result.createdUser.password,
          role: result.createdUser.system_role,
        })
      } else {
        navigate({ to: backTo })
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  function handleCopyPassword() {
    if (!createdCredentials?.password) return
    navigator.clipboard.writeText(createdCredentials.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <PageShell>
      <div className='space-y-4'>
        {/* Navigation & Header */}
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <Link to={backTo}>
              <Button variant='outline' size='sm' className='gap-2'>
                <ArrowLeft className='size-4' />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                {title}
              </h1>
              <p className='text-xs text-muted-foreground'>{subtitle}</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <LegalInfoSection form={form} fixedType={fixedType} />
            <ContactSection form={form} />
            <DeliverySitesSection
              form={form}
              fieldArray={fieldArray}
              isClientMode={effectiveType === 'CLIENT'}
            />
            <AccountSection form={form} />

            {/* Actions */}
            <div className='flex items-center justify-end gap-3 pt-2'>
              <Link to={backTo}>
                <Button type='button' variant='outline' disabled={submitting}>
                  Annuler
                </Button>
              </Link>
              <Button type='submit' disabled={submitting} className='gap-2'>
                {submitting ? (
                  <>
                    <Loader2 className='size-4 animate-spin' />
                    Enregistrement en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className='size-4' />
                    Enregistrer l’organisation
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Modal affichant les identifiants provisoires */}
      <Dialog
        open={createdCredentials !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreatedCredentials(null)
            navigate({ to: backTo })
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-emerald-600'>
              <CheckCircle2 className='size-5' />
              Compte utilisateur provisionné
            </DialogTitle>
            <DialogDescription>
              Un compte de connexion a été créé avec succès pour cette organisation.
              Transmettez ces informations au titulaire de manière sécurisée.
            </DialogDescription>
          </DialogHeader>

          {createdCredentials && (
            <div className='space-y-3 py-2'>
              <div className='rounded-md bg-muted p-3 space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Identifiant / E-mail :</span>
                  <span className='font-mono font-semibold'>{createdCredentials.email}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Rôle système :</span>
                  <span className='font-semibold'>{createdCredentials.role}</span>
                </div>
                <div className='flex items-center justify-between pt-1 border-t border-border/80'>
                  <span className='text-muted-foreground'>Mot de passe temporaire :</span>
                  <div className='flex items-center gap-2'>
                    <code className='bg-background px-2 py-0.5 rounded font-mono font-bold text-primary'>
                      {createdCredentials.password}
                    </code>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-7 w-7'
                      onClick={handleCopyPassword}
                    >
                      {copied ? (
                        <Check className='size-3.5 text-emerald-600' />
                      ) : (
                        <Copy className='size-3.5' />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <p className='text-[11px] text-muted-foreground italic'>
                Ce mot de passe n’est affiché qu’une seule fois. L’utilisateur sera invité à le changer lors de son premier accès.
              </p>
            </div>
          )}

          <div className='flex justify-end'>
            <Button
              onClick={() => {
                setCreatedCredentials(null)
                navigate({ to: backTo })
              }}
            >
              Terminer & Continuer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
