import { useState, useEffect } from 'react'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { Copy, CheckCircle2, Loader2, AlertCircle, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
import { verifySync, generateURI, generateSecret } from 'otplib'

interface MFASetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSetupComplete: (secret: string) => void
}

export function MFASetupDialog({ open, onOpenChange, onSetupComplete }: MFASetupDialogProps) {
  const [secret, setSecret] = useState<string>('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [step, setStep] = useState<'generate' | 'verify' | 'complete'>('generate')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && step === 'generate') {
      generateNewSecret()
    }
  }, [open])

  const generateNewSecret = () => {
    try {
      const newSecret = generateSecret()
      setSecret(newSecret)
      
      // Generate backup codes
      const codes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 10).toUpperCase()
      )
      setBackupCodes(codes)
      
      // Generate QR code URL
      const issuer = 'CSPH GPL Fleet'
      const accountName = 'user@csph-gpl.com' // Would be dynamic in real app
      const otpauth = generateURI({ issuer, label: accountName, secret: newSecret })
      setQrCodeDataUrl(otpauth)
      setStep('verify')
      setError(null)
    } catch (err) {
      setError('Erreur lors de la génération du secret')
      console.error(err)
    }
  }

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Veuillez entrer le code à 6 chiffres')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const isValid = verifySync({ token: verificationCode, secret })
      
      if (isValid.valid) {
        setStep('complete')
        onSetupComplete(secret as string)
        toast.success('2FA configurée avec succès !')
        onOpenChange(false)
      } else {
        setError('Code invalide. Veuillez réessayer.')
      }
    } catch (err) {
      setError('Erreur lors de la vérification')
      console.error(err)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    toast.success('Codes de secours copiés dans le presse-papiers')
  }

  const handleCopySingleCode = (index: number) => {
    const code = backupCodes[index]
    if (code) {
      navigator.clipboard.writeText(code)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep('generate')
      setSecret('')
      setQrCodeDataUrl('')
      setVerificationCode('')
      setBackupCodes([])
      setError(null)
    }
    onOpenChange(newOpen)
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Key className='h-5 w-5 text-primary' />
            Configuration de l'authentification à deux facteurs (2FA)
          </DialogTitle>
          <DialogDescription>
            Sécurisez votre compte avec une application d'authentification (Google Authenticator, Authy, Microsoft Authenticator, etc.)
          </DialogDescription>
        </DialogHeader>

        {step === 'generate' && (
          <div className='space-y-4'>
            <div className='text-center py-4'>
              <Loader2 className='h-12 w-12 mx-auto animate-spin text-primary' />
              <p className='mt-2 text-sm text-muted-foreground'>
                Génération de votre secret 2FA...
              </p>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className='space-y-4'>
            <Alert className='border-primary/20 bg-primary/5'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription className='text-sm'>
                Scannez ce QR code avec votre application d'authentification, puis entrez le code à 6 chiffres affiché.
              </AlertDescription>
            </Alert>

            <div className='text-center space-y-4'>
              <div className='inline-block p-4 bg-white rounded-lg border'>
                <QRCode
                  value={qrCodeDataUrl}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              
              <div className='p-3 bg-muted rounded-lg font-mono text-sm text-center'>
                <p className='text-xs text-muted-foreground mb-1'>Secret manuel (si le scan échoue) :</p>
                <code className='text-base'>{secret.match(/.{1,4}/g)?.join(' ') || secret}</code>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='verification-code'>Code à 6 chiffres de votre application :</Label>
                <Input
                  id='verification-code'
                  type='text'
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder='123456'
                  className='text-center text-2xl tracking-widest font-mono'
                  autoComplete='one-time-code'
                  disabled={isVerifying}
                />
                
                {error && (
                  <Alert variant='destructive' className='text-sm'>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  className='w-full'
                  onClick={handleVerify}
                  disabled={isVerifying || !verificationCode}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Vérification...
                    </>
                  ) : (
                    'Vérifier et activer la 2FA'
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            <div className='space-y-3'>
              <p className='text-sm font-medium flex items-center gap-2'>
                <Key className='h-4 w-4' />
                Codes de secours (à conserver en lieu sûr)
              </p>
              <p className='text-xs text-muted-foreground'>
                Ces codes ne peuvent être utilisés qu'une seule fois chacun. Conservez-les précieusement.
              </p>
              
              <div className='grid grid-cols-2 gap-2'>
                {backupCodes.map((code, index) => (
                  <div key={index} className='flex items-center gap-2 p-2 bg-muted rounded'>
                    <code className='flex-1 font-mono text-sm text-center'>{code}</code>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-8'
                      onClick={() => handleCopySingleCode(index)}
                      disabled={copiedIndex === index}
                    >
                      {copiedIndex === index ? (
                        <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                      ) : (
                        <Copy className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button variant='outline' onClick={handleCopyBackupCodes} className='w-full'>
                <Copy className='mr-2 h-4 w-4' />
                Copier tous les codes
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className='text-center space-y-4 py-8'>
            <div className='mx-auto size-16 rounded-full bg-emerald-100 flex items-center justify-center'>
              <CheckCircle2 className='h-8 w-8 text-emerald-600' />
            </div>
            <h3 className='text-lg font-semibold'>2FA activée avec succès !</h3>
            <p className='text-sm text-muted-foreground'>
              Votre compte est maintenant protégé par l'authentification à deux facteurs.
              Conservez vos codes de secours en lieu sûr.
            </p>
            <Button onClick={() => onOpenChange(false)} className='w-full max-w-xs mx-auto'>
              Terminer
            </Button>
          </div>
        )}

        <DialogFooter>
          {step !== 'complete' && (
            <Button variant='ghost' onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}