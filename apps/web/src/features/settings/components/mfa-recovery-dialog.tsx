import { useState } from 'react'
import { AlertCircle, Key, Loader2, X, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface MFARecoveryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  backupCodes: string[]
  onRecover: (code: string) => Promise<boolean>
  onCancel: () => void
  isLoading?: boolean
}

export function MFARecoveryDialog({
  open,
  onOpenChange,
  backupCodes,
  onRecover,
  onCancel,
  isLoading = false,
}: MFARecoveryDialogProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isRecovering, setIsRecovering] = useState(false)
  const [usedCodes, setUsedCodes] = useState<Set<string>>(new Set())

  const handleRecover = async () => {
    if (!code || code.length < 8) {
      setError('Veuillez entrer un code de secours valide')
      return
    }

    setIsRecovering(true)
    setError(null)

    try {
      const isValid = await onRecover(code)

      if (isValid) {
        setUsedCodes((prev) => new Set([...prev, code]))
        toast.success('Récupération réussie ! Vous pouvez maintenant réinitialiser votre 2FA.')
        onOpenChange(false)
      } else {
        setError('Code de secours invalide ou déjà utilisé.')
      }
    } catch (err) {
      setError('Erreur lors de la récupération. Veuillez réessayer.')
      console.error(err)
    } finally {
      setIsRecovering(false)
    }
  }

  const handleCopyCode = (backupCode: string) => {
    navigator.clipboard.writeText(backupCode)
    toast.success('Code copié dans le presse-papiers')
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertCircle className='h-5 w-5 text-destructive' />
            Récupération d'accès 2FA
          </DialogTitle>
          <DialogDescription>
            Vous avez perdu l'accès à votre application d'authentification ? Utilisez l'un de vos codes de secours pour récupérer l'accès à votre compte.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <Alert className='border-destructive/20 bg-destructive/5'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription className='text-sm'>
              <strong>Attention :</strong> Chaque code de secours ne peut être utilisé qu'une seule fois.
              Après utilisation, il devient invalide.
            </AlertDescription>
          </Alert>

          <div className='space-y-2'>
            <Label htmlFor='recovery-code'>Entrez un code de secours :</Label>
            <Input
              id='recovery-code'
              type='text'
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder='ABCD1234'
              className='text-center text-lg tracking-wider font-mono'
              autoComplete='one-time-code'
              disabled={isRecovering || isLoading}
            />
            
            {error && (
              <Alert variant='destructive' className='text-sm'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className='space-y-3'>
            <p className='text-sm font-medium flex items-center gap-2'>
              <Key className='h-4 w-4' />
              Vos codes de secours ({backupCodes.filter((c) => !usedCodes.has(c)).length} restants)
            </p>
            <div className='grid grid-cols-2 gap-2 max-h-48 overflow-y-auto'>
              {backupCodes.map((backupCode, index) => {
                const isUsed = usedCodes.has(backupCode)
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2 rounded border ${
                      isUsed ? 'bg-muted/50 opacity-50' : 'bg-background'
                    }`}
                  >
                    <code className={`flex-1 font-mono text-sm ${isUsed ? 'line-through text-muted-foreground' : ''}`}>
                      {backupCode}
                    </code>
                    {!isUsed && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-8'
                        onClick={() => handleCopyCode(backupCode)}
                        disabled={isRecovering || isLoading}
                      >
                        <Copy className='h-4 w-4' />
                      </Button>
                    )}
                    {isUsed && (
                      <X className='h-4 w-4 text-muted-foreground/50' />
                    )}
                  </div>
                )
              })}
            </div>
            
            {backupCodes.every((c) => usedCodes.has(c)) && (
              <Alert variant='destructive' className='text-sm'>
                <AlertDescription>
                  Tous vos codes de secours ont été utilisés. Contactez le support pour récupérer l'accès.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <Button
            variant='ghost'
            onClick={onCancel}
            disabled={isRecovering || isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleRecover}
            disabled={isRecovering || isLoading || !code || code.length < 8 || backupCodes.every((c) => usedCodes.has(c))}
            className='flex-1'
          >
            {isRecovering ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Récupération...
              </>
            ) : (
              'Récupérer l\'accès'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}