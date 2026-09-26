import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle, Button, Input, Switch, Textarea } from '@lpg/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { validateSettingValue, type SettingView } from '../data/settings'

interface SettingEditDialogProps {
  setting: SettingView | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, value: string) => Promise<boolean>
  isLoading: boolean
}

type SettingFormValues = {
  value: string
}

export function SettingEditDialog({
  setting,
  open,
  onOpenChange,
  onSave,
  isLoading,
}: SettingEditDialogProps) {
  const { t } = useTranslation('common')
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)
  const [mutationError, setMutationError] = useState(false)
  const schema = useMemo(
    () =>
      z.object({
        value: z.string().superRefine((value, context) => {
          if (!setting) return
          const validationError = validateSettingValue(setting, value)
          if (!validationError) return
          const message = t(`settings.validation.${validationError.code}`, {
            min: setting.minValue,
            max: setting.maxValue,
          })
          context.addIssue({ code: 'custom', message, path: ['value'] })
        }),
      }),
    [setting, t],
  )
  const form = useForm<SettingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { value: setting && !setting.isEncrypted ? setting.value : '' },
    mode: 'onChange',
  })
  const { control, formState, handleSubmit, reset } = form
  const dirty = formState.isDirty

  if (!setting) return null

  const requestClose = () => {
    if (isLoading) return
    if (dirty) {
      setDiscardConfirmOpen(true)
      return
    }
    onOpenChange(false)
  }

  const discard = () => {
    setDiscardConfirmOpen(false)
    reset({ value: setting.isEncrypted ? '' : setting.value })
    onOpenChange(false)
  }

  const submit = handleSubmit(async ({ value: nextValue }) => {
    setMutationError(false)
    try {
      const saved = await onSave(setting.id, nextValue)
      if (saved) onOpenChange(false)
      else setMutationError(true)
    } catch {
      setMutationError(true)
    }
  })

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) requestClose()
        }}
      >
        <DialogContent showCloseButton={!isLoading}>
          <DialogHeader>
            <DialogTitle>{t('settings.dialog.title')}</DialogTitle>
            <DialogDescription>
              {t(setting.titleKey, { defaultValue: setting.key })} ·{' '}
              <code>{setting.key}</code>
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={submit} noValidate>
              <div className='flex flex-col gap-4'>
                <p className='text-sm text-muted-foreground'>
                  {t(setting.descriptionKey, { defaultValue: setting.description })}
                </p>

                {setting.isEncrypted && (
                  <Alert>
                    <AlertTitle>{t('settings.dialog.encryptedTitle')}</AlertTitle>
                    <AlertDescription>{t('settings.dialog.encryptedDescription')}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={control}
                  name='value'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.dialog.value')}</FormLabel>
                      <FormControl>
                        {setting.valueType === 'NUMBER' ? (
                          <Input
                            type='number'
                            min={setting.minValue ?? undefined}
                            max={setting.maxValue ?? undefined}
                            step='any'
                            disabled={isLoading}
                            {...field}
                          />
                        ) : setting.valueType === 'BOOLEAN' ? (
                          <div className='flex items-center gap-3 rounded-md border p-3'>
                            <Switch
                              checked={field.value === 'true'}
                              onCheckedChange={(checked) => field.onChange(String(checked))}
                              disabled={isLoading}
                            />
                            <span className='text-sm text-muted-foreground'>
                              {field.value === 'true' ? t('settings.boolean.enabled') : t('settings.boolean.disabled')}
                            </span>
                          </div>
                        ) : setting.valueType === 'JSON' ? (
                          <Textarea
                            rows={7}
                            className='resize-y font-mono text-sm'
                            disabled={isLoading}
                            {...field}
                          />
                        ) : (
                          <Input
                            type={setting.isEncrypted ? 'password' : 'text'}
                            autoComplete={setting.isEncrypted ? 'new-password' : 'off'}
                            disabled={isLoading}
                            {...field}
                          />
                        )}
                      </FormControl>
                      {(setting.minValue !== null || setting.maxValue !== null) && (
                        <FormDescription>
                          {t('settings.dialog.range', {
                            min: setting.minValue ?? t('settings.info.none'),
                            max: setting.maxValue ?? t('settings.info.none'),
                          })}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {setting.requiresRestart && (
                  <Alert>
                    <AlertTitle>{t('settings.restart.title')}</AlertTitle>
                    <AlertDescription>{t('settings.restart.dialogDescription')}</AlertDescription>
                  </Alert>
                )}

                {mutationError && (
                  <Alert variant='destructive'>
                    <AlertTitle>{t('settings.errors.title')}</AlertTitle>
                    <AlertDescription>{t('settings.errors.save')}</AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter className='mt-6'>
                <Button type='button' variant='outline' onClick={requestClose} disabled={isLoading}>
                  {t('action.cancel')}
                </Button>
                <Button type='submit' disabled={!dirty || isLoading} aria-busy={isLoading || undefined}>
                  {isLoading ? t('settings.dialog.saving') : t('settings.dialog.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={discardConfirmOpen}
        onOpenChange={(nextOpen) => {
          if (!isLoading) setDiscardConfirmOpen(nextOpen)
        }}
        title={t('settings.dialog.discardTitle')}
        desc={t('settings.dialog.discardDescription')}
        confirmText={t('settings.dialog.discard')}
        cancelBtnText={t('action.cancel')}
        destructive
        isLoading={isLoading}
        handleConfirm={discard}
      />
    </>
  )
}
