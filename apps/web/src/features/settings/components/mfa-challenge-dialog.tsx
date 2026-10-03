import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, Key, Eye, EyeOff } from 'lucide-react'
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
import { verifySync } from 'otplib'

interface MFAChallengeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  secret: string
  onVerify: (code: string) => Promise<boolean>
  onCancel: () => void
  isLoading?: boolean
  rememberDevice?: boolean
  onRememberDeviceChange?: (value: boolean) => void
}

export function MFAChallengeDialog({
  open,
  onOpenChange,
  secret,
  onVerify,
  onCancel,
  isLoading = false,
  rememberDevice = false,
  onRememberDeviceChange,
}: MFAChallengeDialogProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (open) {
      setCode('')
      setError(null)
    }
  }, [open])

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Veuillez entrer le code à 6 chiffres')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      // First verify locally with the secret (for demo)
      const isValidLocal = verifySync({ token: code, secret })
      
      // Then call the server verification
      const isValid = await onVerify(code)
      
      if (isValid && isValidLocal.valid) {
        onOpenChange(false)
        toast.success('Authentification réussie')
      } else {
        setError('Code invalide ou expiré. Veuillez réessayer.')
      }
    } catch (err) {
      setError('Erreur lors de la vérification. Veuillez réessayer.')
      console.error(err)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isVerifying) {
      handleVerify()
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Key className='h-5 w-5 text-primary' />
            Authentification à deux facteurs
          </DialogTitle>
          <DialogDescription>
            Entrez le code à 6 chiffres affiché dans votre application d'authentification.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {rememberDevice && onRememberDeviceChange && (
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='remember-device'
                checked={rememberDevice}
                onChange={(e) => onRememberDeviceChange(e.target.checked)}
                className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
              />
              <Label htmlFor='remember-device' className='text-sm cursor-pointer'>
                Se souvenir de cet appareil pendant 30 jours
              </Label>
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='mfa-code'>Code à 6 chiffres :</Label>
            <div className='relative'>
              <Input
                id='mfa-code'
                type={showCode ? 'text' : 'text'}
                inputMode='numeric'
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                onKeyDown={handleKeyDown}
                placeholder='123456'
                className='text-center text-2xl tracking-widest font-mono py-3'
                autoComplete='one-time-code'
                disabled={isVerifying || isLoading}
                autoFocus
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-3 top-[38px] h-8 w-8'
                onClick={() => setShowCode(!showCode)}
                disabled={isVerifying || isLoading}
                aria-label={showCode ? 'Masquer le code' : 'Afficher le code'}
              >
                {showCode ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </Button>
            </div>

            {error && (
              <Alert variant='destructive' className='text-sm'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='text-center text-xs text-muted-foreground'>
              Le code se renouvelle toutes les 30 secondes
            </div>
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <Button
            variant='ghost'
            onClick={onCancel}
            disabled={isVerifying || isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isVerifying || isLoading || !code || code.length !== 6}
            className='flex-1'
          >
            {isVerifying ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Vérification...
              </>
            ) : (
              'Vérifier'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}