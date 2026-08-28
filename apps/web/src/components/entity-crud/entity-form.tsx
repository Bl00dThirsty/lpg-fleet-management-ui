/**
 * Generic, config-driven entity form. Renders fields from a `FieldConfig[]`
 * and reports a validated value map on submit. No per-entity sheet duplication.
 *
 * Convention (matches `features/users/components/user-edit-sheet.tsx`):
 * react-hook-form + zod (schema built by `zodSchemaFromFields`), `@lpg/ui`
 * primitives wrapped in `Controller`s, inline per-field errors. Success/error
 * toasts live in the callers, not here.
 */

import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UploadCloud, X } from 'lucide-react'
import {
  Button,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
  Textarea,
} from '@lpg/ui'
import { getScope } from '@/features/scope/scope'
import { useAuthStore } from '@/store/auth-store'
import { zodSchemaFromFields } from './field-schema'
import type { FieldConfig } from './field-config'
import { FormSection, SubmitButton } from './form-ui'

export type FormValues = Record<string, unknown>

export interface EntityFormProps {
  fields: FieldConfig[]
  /** Existing entity for edit mode; null/undefined for create. */
  initial?: FormValues | null
  onSubmit: (values: FormValues) => void | Promise<void>
  onCancel: () => void
  title: string
  description?: string
  submitting?: boolean
  submitLabel?: string
}

function buildInitial(
  fields: FieldConfig[],
  initial?: FormValues | null,
  autoDefaults: FormValues = {},
): FormValues {
  const out: FormValues = {}
  for (const f of fields) {
    const v = initial?.[f.name]
    out[f.name] = v !== undefined ? v : (autoDefaults[f.name] ?? (f.defaultValue ?? (f.type === 'switch' ? false : '')))
  }
  return out
}

/** Apply per-field `transform` and merge the entity `id` in edit mode. */
// eslint-disable-next-line react-refresh/only-export-components
export function applyTransforms(
  fields: FieldConfig[],
  values: FormValues,
  isEdit: boolean,
  initial?: FormValues | null,
): FormValues {
  const out: FormValues = {}
  for (const f of fields) {
    const raw = values[f.name]
    out[f.name] = f.transform ? f.transform(raw) : raw
  }
  if (isEdit && initial?.id) out.id = initial.id
  return out
}

export function EntityForm({
  fields,
  initial,
  onSubmit,
  onCancel,
  title,
  description,
  submitting,
  submitLabel = 'Enregistrer',
}: EntityFormProps) {
  const isEdit = Boolean(initial && initial.id)
  const user = useAuthStore((s) => s.user)
  const scope = useMemo(() => getScope(user), [user])
  const isRegulateur = scope.view === 'org'
  const autoDefaults = useMemo(() => {
    const defaults: FormValues = {}
    if (isRegulateur || !scope.orgId) return defaults
    for (const f of fields) {
      if (f.autoOrg) defaults[f.name] = scope.orgId
    }
    return defaults
  }, [fields, isRegulateur, scope.orgId])
  const resetKey = useMemo(
    () =>
      JSON.stringify({
        initial,
        autoDefaults,
        fields: fields.map(({ transform: _transform, ...fieldConfig }) => fieldConfig),
      }),
    [fields, initial, autoDefaults],
  )
  const form = useForm<FormValues>({
    resolver: zodResolver(zodSchemaFromFields(fields)),
    defaultValues: buildInitial(fields, initial, autoDefaults),
  })

  useEffect(() => {
    form.reset(buildInitial(fields, initial, autoDefaults))
    // resetKey captures the serializable inputs while these values provide the current reset data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, resetKey])

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(applyTransforms(fields, values, isEdit, initial))
  })

  const sections = useMemo(() => {
    const map = new Map<string, FieldConfig[]>()
    for (const f of fields) {
      const key = f.section ?? 'Informations'
      const group = map.get(key) ?? []
      group.push(f)
      map.set(key, group)
    }
    return Array.from(map.entries())
  }, [fields])

  return (
    <SheetContent className='flex w-full flex-col sm:max-w-xl'>
      <SheetHeader className='pb-2'>
        <SheetTitle>{title}</SheetTitle>
        {description ? <SheetDescription>{description}</SheetDescription> : null}
      </SheetHeader>

      <div className='flex-1 space-y-4 overflow-y-auto px-4 pb-2'>
        {sections.map(([title, sectionFields]) => (
          <FormSection key={title} title={title}>
            {sectionFields.filter((f) => !(f.autoOrg && !isRegulateur) && !f.hidden).map((f) => (
              <Controller
                key={f.name}
                control={form.control}
                name={f.name}
                render={({ field: rf, fieldState }) => (
                  <Field
                    config={f}
                    value={rf.value}
                    onChange={rf.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            ))}
          </FormSection>
        ))}
      </div>

      <SheetFooter className='gap-2 border-t pt-4'>
        <Button variant='outline' onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <SubmitButton pending={submitting} onClick={submit}>
          {submitLabel}
        </SubmitButton>
      </SheetFooter>
    </SheetContent>
  )
}

function Field({
  config,
  value,
  onChange,
  error,
}: {
  config: FieldConfig
  value: unknown
  onChange: (v: unknown) => void
  error?: string
}) {
  const id = `field-${config.name}`
  const [fileError, setFileError] = useState<string>()

  if (config.type === 'switch') {
    return (
      <div>
        <div className='flex items-center justify-between rounded-md border p-3'>
          <div>
            <Label htmlFor={id} className='cursor-pointer'>
              {config.label}
            </Label>
            {config.help ? (
              <p className='text-xs text-muted-foreground'>{config.help}</p>
            ) : null}
          </div>
          <Switch
            id={id}
            checked={Boolean(value)}
            onCheckedChange={(v) => onChange(v)}
          />
        </div>
        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
      </div>
    )
  }

  if (config.type === 'select') {
    return (
      <div className='space-y-1.5'>
        <Label htmlFor={id}>{config.label}</Label>
        <Select value={value ? String(value) : undefined} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id={id}>
            <SelectValue placeholder={config.placeholder ?? 'Choisir…'} />
          </SelectTrigger>
          <SelectContent>
            {(config.options ?? []).map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {config.help ? <p className='text-xs text-muted-foreground'>{config.help}</p> : null}
        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
      </div>
    )
  }

  if (config.type === 'checklist') {
    const selected = Array.isArray(value) ? (value as string[]) : []
    return (
      <div className='space-y-1.5'>
        <Label>{config.label}</Label>
        <div className='max-h-64 space-y-1 overflow-y-auto rounded-md border p-2'>
          {(config.options ?? []).map((o) => (
            <div key={o.value} className='flex items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/50'>
              <Checkbox
                id={`${id}-${o.value}`}
                checked={selected.includes(o.value)}
                onCheckedChange={(checked) => {
                  if (checked) onChange([...selected, o.value])
                  else onChange(selected.filter((c) => c !== o.value))
                }}
              />
                <Label htmlFor={`${id}-${o.value}`} className='cursor-pointer font-mono text-xs'>
                  {o.label}
                </Label>
            </div>
          ))}
        </div>
        {config.help ? <p className='text-xs text-muted-foreground'>{config.help}</p> : null}
        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
      </div>
    )
  }

  if (config.type === 'file') {
    const fileErrorId = `${id}-error`
    const hasFileError = Boolean(fileError || error)
    return (
      <div className='space-y-1.5'>
        <Label htmlFor={id}>{config.label}</Label>
        {value ? (
          <div className='flex items-center justify-between gap-2 rounded-md border p-3'>
            <span className='flex min-w-0 items-center gap-2 text-sm'>
              <UploadCloud className='size-4 shrink-0 text-emerald-500' />
              <span className='truncate font-medium'>Preuve PDF jointe</span>
            </span>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => {
                setFileError(undefined)
                onChange('')
              }}
            >
              <X className='size-3.5' />
              <span className='sr-only'>Retirer</span>
            </Button>
          </div>
        ) : (
          <label
            htmlFor={id}
            className='flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-6 text-sm text-muted-foreground hover:bg-muted/40'
          >
            <UploadCloud className='size-4' />
            Déposer le PDF ou cliquer
            <input
              id={id}
              type='file'
              accept={config.accept ?? 'application/pdf'}
              className='sr-only'
              aria-invalid={hasFileError}
              aria-describedby={hasFileError ? fileErrorId : undefined}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const maxBytes = (config.maxFileSizeMb ?? 5) * 1024 * 1024
                if (file.type !== 'application/pdf') {
                  setFileError('Seul un fichier PDF est accepté')
                  e.currentTarget.value = ''
                  return
                }
                if (file.size > maxBytes) {
                  setFileError(`Le fichier doit faire au maximum ${config.maxFileSizeMb ?? 5} Mo`)
                  onChange('')
                  e.currentTarget.value = ''
                  return
                }
                setFileError(undefined)
                const reader = new FileReader()
                reader.onload = () => onChange(String(reader.result))
                reader.onerror = () => setFileError('Impossible de lire le fichier')
                reader.readAsDataURL(file)
              }}
            />
          </label>
        )}
        {config.help ? <p className='text-xs text-muted-foreground'>{config.help}</p> : null}
        {hasFileError ? (
          <p id={fileErrorId} className='text-sm text-destructive'>
            {fileError ?? error}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className='space-y-1.5'>
      <Label htmlFor={id}>{config.label}</Label>
      {config.type === 'textarea' ? (
        <Textarea
          id={id}
          value={value ? String(value) : ''}
          placeholder={config.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          type={config.type === 'number' ? 'number' : config.type === 'date' ? 'date' : 'text'}
          value={value === null || value === undefined ? '' : String(value)}
          placeholder={config.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {config.help ? <p className='text-xs text-muted-foreground'>{config.help}</p> : null}
      {error ? <p className='text-sm text-destructive'>{error}</p> : null}
    </div>
  )
}

export function EntityFormSheet(props: EntityFormProps & { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { open, onOpenChange, ...rest } = props
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityForm {...rest} />
    </Sheet>
  )
}
