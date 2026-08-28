import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { organizations } from '@lpg/mock-data'
import { hasPermission } from '@lpg/permissions'
import {
  Button, Command, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input,
  Popover, PopoverContent, PopoverTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Switch, cn,
} from '@lpg/ui'
import { getScope, isRegulateurView } from '@/features/scope/scope'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'
import { useAuthStore } from '@/store/auth-store'
import { useContractsStore } from '@/store/contracts-store'
import type { TransporterContract } from '@lpg/types'
import { useRoleStore } from '@/store/role-store'

const schema = z.object({
  marketeur_org_id: z.string().min(1, 'Marketeur requis'),
  transporter_org_id: z.string().min(1, 'Transporteur requis'),
  contract_reference: z.string().trim().min(1, 'Référence requise'),
  started_at: z.string().min(1, 'Date de début requise'),
  ended_at: z.string().min(1, 'Date de fin requise'),
  is_primary: z.boolean(),
  proof: z.string().optional(),
}).refine((value) => value.ended_at >= value.started_at, {
  message: 'La date de fin doit être postérieure ou égale à la date de début',
  path: ['ended_at'],
})

type Values = z.infer<typeof schema>
const marketeurOptions = organizations.filter((org) => org.type === 'MARKETEUR' && org.is_active)
const transporterOptions = organizations.filter((org) => org.type === 'TRANSPORTEUR' && org.is_active)

interface ContractFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract?: TransporterContract | null
}

function dateValue(value?: string | null): string {
  return value?.slice(0, 10) ?? ''
}

export function ContractFormDialog({ open, onOpenChange, contract }: ContractFormDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const role = useRoleStore((state) => state.activeRole)
  const user = useAuthStore((s) => s.user)
  const scope = useMemo(() => getScope(user), [user])
  const regulated = isRegulateurView(scope)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { marketeur_org_id: regulated ? '' : scope.orgId ?? '', transporter_org_id: '', contract_reference: '', started_at: '', ended_at: '', is_primary: false, proof: '' },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      marketeur_org_id: contract?.marketeur_org_id ?? (regulated ? '' : scope.orgId ?? ''),
      transporter_org_id: contract?.transporter_org_id ?? '',
      contract_reference: contract?.contract_reference ?? '',
      started_at: dateValue(contract?.started_at),
      ended_at: dateValue(contract?.ended_at),
      is_primary: contract?.is_primary ?? false,
      proof: '',
    })
  }, [contract, form, open, regulated, scope.orgId])

  function chooseFile(file: File | undefined, onChange: (value: string) => void) {
    if (!file) return
    if (file.type !== 'application/pdf') {
      form.setError('proof', { message: 'Le fichier doit être un PDF' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      form.setError('proof', { message: 'Le fichier PDF ne doit pas dépasser 5 Mo' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result))
    reader.onerror = () => {
      form.setError('proof', { message: 'Impossible de lire le fichier PDF' })
      toast.error('Impossible de lire le fichier PDF')
    }
    reader.readAsDataURL(file)
  }

  function submit(values: Values) {
    setSubmitting(true)
    try {
      const patch = {
        marketeur_org_id: values.marketeur_org_id,
        transporter_org_id: values.transporter_org_id,
        is_primary: values.is_primary && hasPermission(role, 'contracts.manage'),
        contract_reference: values.contract_reference,
        started_at: `${values.started_at}T00:00:00Z`,
        ended_at: `${values.ended_at}T23:59:59Z`,
        ...(values.proof ? { contract_document_url: values.proof } : {}),
      }
      if (contract) {
        useContractsStore.getState().updateContract(contract.id, patch)
        toast.success('Contrat modifié')
      } else {
        useContractsStore.getState().createContract({ ...patch, contract_document_url: values.proof || undefined })
        toast.success('Contrat créé')
      }
      form.reset({ marketeur_org_id: regulated ? '' : scope.orgId ?? '', transporter_org_id: '', contract_reference: '', started_at: '', ended_at: '', is_primary: false, proof: '' })
      onOpenChange(false)
    } catch (error) {
      toast.error(extractErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{contract ? 'Modifier le contrat transporteur' : 'Nouveau contrat transporteur'}</DialogTitle>
          <DialogDescription>Le transporteur devra accepter le contrat avant son utilisation pour une tournée externe.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className='space-y-4'>
            {regulated ? (
              <FormField control={form.control} name='marketeur_org_id' render={({ field }) => (
                <FormItem><FormLabel>Marketeur</FormLabel><Select value={field.value || undefined} onValueChange={field.onChange}><FormControl><SelectTrigger className='w-full'><SelectValue placeholder='Sélectionner un marketeur' /></SelectTrigger></FormControl><SelectContent>{marketeurOptions.map((org) => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
            ) : null}
            <FormField control={form.control} name='transporter_org_id' render={({ field }) => (
              <FormItem><FormLabel>Transporteur</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button type='button' variant='outline' role='combobox' className={cn('w-full justify-between font-normal', !field.value && 'text-muted-foreground')}>{field.value ? transporterOptions.find((org) => org.id === field.value)?.name : 'Rechercher un transporteur'}<ChevronsUpDown className='size-4 opacity-50' /></Button></FormControl></PopoverTrigger><PopoverContent className='w-[--radix-popover-trigger-width] p-0'><Command><CommandInput placeholder='Rechercher...' /><CommandEmpty>Aucun transporteur.</CommandEmpty><CommandGroup>{transporterOptions.map((org) => <CommandItem key={org.id} value={org.name} onSelect={() => field.onChange(org.id)}><Check className={cn('mr-2 size-4', field.value === org.id ? 'opacity-100' : 'opacity-0')} />{org.name}</CommandItem>)}</CommandGroup></Command></PopoverContent></Popover><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name='contract_reference' render={({ field }) => <FormItem><FormLabel>Référence du contrat</FormLabel><FormControl><Input {...field} placeholder='CTR-SCTM-TL-2026-001' /></FormControl><FormMessage /></FormItem>} />
            <div className='grid grid-cols-2 gap-3'><FormField control={form.control} name='started_at' render={({ field }) => <FormItem><FormLabel>Date de début</FormLabel><FormControl><Input type='date' {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name='ended_at' render={({ field }) => <FormItem><FormLabel>Date de fin</FormLabel><FormControl><Input type='date' {...field} /></FormControl><FormMessage /></FormItem>} /></div>
            <FormField control={form.control} name='proof' render={({ field }) => <FormItem><FormLabel>Preuve PDF (5 Mo maximum)</FormLabel><FormControl><div className='space-y-2'><Input type='file' accept='application/pdf' onChange={(event) => chooseFile(event.target.files?.[0], field.onChange)} />{field.value ? <p className='text-xs text-emerald-700'>PDF prêt à être enregistré.</p> : null}</div></FormControl><FormMessage /></FormItem>} />
            {hasPermission(role, 'contracts.manage') ? <FormField control={form.control} name='is_primary' render={({ field }) => <FormItem className='flex items-center justify-between rounded-md border p-3'><FormLabel>Contrat principal</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} /> : null}
            <DialogFooter><Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Annuler</Button><Button type='submit' disabled={submitting}>{submitting ? 'Enregistrement...' : contract ? 'Enregistrer' : 'Créer le contrat'}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
