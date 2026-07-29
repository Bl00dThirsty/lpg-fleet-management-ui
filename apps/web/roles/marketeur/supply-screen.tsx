import { useState } from 'react'
import { PackageCheck, ChevronLeft, ChevronRight, Camera, Check } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@lpg/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lpg/ui'

const STEPS = [
  { id: 'qty', label: 'Quantité' },
  { id: 'source', label: 'Source' },
  { id: 'destination', label: 'Destination' },
  { id: 'transport', label: 'Transporteur & véhicule' },
  { id: 'proof', label: 'Preuve de chargement' },
]

const SOURCES = ['SNH', 'SCDP', 'Centre emplisseur Douala']
const DESTINATIONS = ['Centre emplisseur Yaoundé', 'Dépôt Bafoussam', 'Dépôt Garoua']
const TRANSPORTERS = ['Trans SA', 'Logistique Golfe', 'Bene Transports']

export function MarketeurSupplyScreen() {
  const [step, setStep] = useState(0)
  const [qty, setQty] = useState('')
  const [source, setSource] = useState('')
  const [destination, setDestination] = useState('')
  const [transporter, setTransporter] = useState('')
  const [vehicle, setVehicle] = useState('')

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const prev = () => setStep((s) => Math.max(s - 1, 0))
  const canNext =
    (step === 0 && qty) ||
    (step === 1 && source) ||
    (step === 2 && destination) ||
    (step === 3 && transporter && vehicle) ||
    step === 4

  return (
    <PageShell>
      <PageHeader
        title='Requête d’enlèvement (Gaz Vrac)'
        description='Assistant multi-étapes — calcul automatique du nombre de véhicules.'
        actions={
          <Badge variant='outline'>
            {Math.ceil((Number(qty) || 0) / 18000)} véhicule(s) estimé(s)
          </Badge>
        }
      />

      <ol className='flex flex-wrap gap-2'>
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              onClick={() => setStep(i)}
              className={
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ' +
                (i === step
                  ? 'border-primary bg-primary/10 font-medium'
                  : 'border-border text-muted-foreground')
              }
            >
              <span
                className={
                  'grid size-5 place-items-center rounded-full text-xs ' +
                  (i < step ? 'bg-emerald-600 text-white' : 'bg-muted')
                }
              >
                {i < step ? <Check className='size-3' /> : i + 1}
              </span>
              {s.label}
            </button>
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>{STEPS[step].label}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {step === 0 && (
            <div className='space-y-2'>
              <Label htmlFor='qty'>Quantité demandée (kg)</Label>
              <Input
                id='qty'
                type='number'
                placeholder='Ex : 36000'
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
          )}
          {step === 1 && (
            <div className='space-y-2'>
              <Label>Organisation source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder='Choisir la source' />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {step === 2 && (
            <div className='space-y-2'>
              <Label>Centre emplisseur de destination</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger>
                  <SelectValue placeholder='Choisir la destination' />
                </SelectTrigger>
                <SelectContent>
                  {DESTINATIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {step === 3 && (
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Transporteur</Label>
                <Select value={transporter} onValueChange={setTransporter}>
                  <SelectTrigger>
                    <SelectValue placeholder='Choisir le transporteur' />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSPORTERS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Véhicule (capacité 18 000 kg)</Label>
                <Input
                  placeholder='Immatriculation'
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                />
              </div>
            </div>
          )}
          {step === 4 && (
            <div className='space-y-3'>
              <p className='text-sm text-muted-foreground'>
                La signature numérique n’ayant pas de valeur légale au Cameroun, le système
                enregistre la preuve photographique ou vidéo du document physique.
              </p>
              <Button variant='outline' className='gap-2'>
                <Camera className='size-4' /> Filmer / scanner le bon d’enlèvement
              </Button>
              <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
                Aperçu de la preuve (à capturer sur le PDA)
              </div>
            </div>
          )}

          <div className='flex items-center justify-between pt-2'>
            <Button variant='ghost' onClick={prev} disabled={step === 0} className='gap-2'>
              <ChevronLeft className='size-4' /> Précédent
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} disabled={!canNext} className='gap-2'>
                Suivant <ChevronRight className='size-4' />
              </Button>
            ) : (
              <Button className='gap-2' disabled={!canNext}>
                <PackageCheck className='size-4' /> Valider la requête
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}

