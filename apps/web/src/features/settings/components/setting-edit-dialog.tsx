import { useState } from 'react'
import { X, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

import type { SettingView } from '../data/settings'

interface SettingEditDialogProps {
  setting: SettingView | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, value: string) => Promise<void>
  onReset: (id: string) => Promise<void>
  isLoading: boolean
}

export function SettingEditDialog({
  setting,
  open,
  onOpenChange,
  onSave,
  onReset,
  isLoading,
}: SettingEditDialogProps) {
  const [editValue, setEditValue] = useState(() => setting?.value ?? '')
  const [showEncrypted, setShowEncrypted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setting) return
    setError(null)
    try {
      await onSave(setting.id, editValue)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    }
  }

  const handleReset = async () => {
    if (!setting) return
    try {
      await onReset(setting.id)
      setEditValue(setting.defaultValue)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation')
    }
  }

  if (!setting) return null

  const isEncrypted = setting.isEncrypted && !showEncrypted
  const displayValue = isEncrypted ? '••••••••' : editValue
  const isNumber = setting.valueType === 'NUMBER'
  const isBoolean = setting.valueType === 'BOOLEAN'
  const isJson = setting.valueType === 'JSON'
  const isString = setting.valueType === 'STRING'

  const canEdit = !setting.isEncrypted || showEncrypted

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center justify-between'>
            <span>Modifier le paramètre</span>
            {setting.isEncrypted && (
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setShowEncrypted((v) => !v)}
                aria-label={showEncrypted ? 'Masquer la valeur' : 'Afficher la valeur'}
              >
                {showEncrypted ? <X className='h-4 w-4' /> : <Loader2 className='h-4 w-4' />}
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            <code className='font-mono text-xs'>{setting.key}</code>
            {setting.categoryLabel && (
              <span className='ml-2 px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground'>
                {setting.categoryLabel}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {setting.description && (
            <p className='text-sm text-muted-foreground'>{setting.description}</p>
          )}

          <div className='space-y-2'>
            <Label htmlFor='setting-value'>Valeur</Label>

            {isNumber && (
              <Input
                id='setting-value'
                type='number'
                value={displayValue}
                onChange={(e) => setEditValue(e.target.value)}
                min={setting.minValue ?? undefined}
                max={setting.maxValue ?? undefined}
                step={setting.minValue !== null && setting.maxValue !== null && setting.maxValue - setting.minValue < 10 ? 0.1 : 1}
                disabled={!canEdit || isLoading}
                aria-invalid={!!error}
              />
            )}

            {isBoolean && (
              <div className='flex items-center gap-2'>
                <Switch
                  id='setting-value'
                  checked={displayValue === 'true'}
                  onCheckedChange={(checked) => setEditValue(checked.toString())}
                  disabled={!canEdit || isLoading}
                />
                <span className='text-sm text-muted-foreground'>
                  {displayValue === 'true' ? 'Activé' : 'Désactivé'}
                </span>
              </div>
            )}

            {isJson && (
              <Textarea
                id='setting-value'
                value={displayValue}
                onChange={(e) => setEditValue(e.target.value)}
                disabled={!canEdit || isLoading}
                rows={6}
                className='font-mono text-sm'
                placeholder='["valeur1", "valeur2"]'
                aria-invalid={!!error}
              />
            )}

            {isString && !setting.isEncrypted && (
              <Input
                id='setting-value'
                type='text'
                value={displayValue}
                onChange={(e) => setEditValue(e.target.value)}
                disabled={!canEdit || isLoading}
                aria-invalid={!!error}
              />
            )}

            {setting.isEncrypted && !showEncrypted && (
              <div className='flex items-center gap-2'>
                <Input
                  id='setting-value'
                  type='password'
                  value={displayValue}
                  readOnly
                  className='bg-muted'
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() => setShowEncrypted(true)}
                >
                  <Loader2 className='h-4 w-4' />
                </Button>
              </div>
            )}

            {setting.minValue !== null || setting.maxValue !== null ? (
              <p className='text-xs text-muted-foreground'>
                {setting.minValue !== null && setting.maxValue !== null
                  ? `Entre ${setting.minValue} et ${setting.maxValue}`
                  : setting.minValue !== null
                  ? `Minimum : ${setting.minValue}`
                  : `Maximum : ${setting.maxValue}`}
              </p>
            ) : null}

            {error && (
              <Alert variant='destructive' className='text-sm'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {setting.requiresRestart && (
            <div className='rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200'>
              <span className='flex items-center gap-1.5'>
                <RotateCcw className='h-4 w-4' />
                Ce paramètre nécessite un redémarrage de l'application pour prendre effet.
              </span>
            </div>
          )}

          <Separator />

          <DialogFooter className='flex flex-col sm:flex-row gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleReset}
              disabled={isLoading}
            >
              <RotateCcw className='mr-2 h-4 w-4' /> Réinitialiser par défaut
            </Button>
            <div className='flex-1' />
            <Button type='button' variant='ghost' onClick={() => onOpenChange(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button type='submit' disabled={isLoading || !canEdit}>
              {isLoading ? 'Sauvegarde...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}