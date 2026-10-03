import * as React from 'react'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { DateRange } from 'react-day-picker'

export type DateRangeValue = DateRange | undefined

type PresetKey = '7d' | '30d' | 'thisMonth' | 'lastMonth' | 'quarter' | 'custom'

const PRESETS: Array<{ key: PresetKey; label: string; getRange: () => DateRange }> = [
  {
    key: '7d',
    label: '7 derniers jours',
    getRange: () => ({ from: subDays(new Date(), 6), to: new Date() }),
  },
  {
    key: '30d',
    label: '30 derniers jours',
    getRange: () => ({ from: subDays(new Date(), 29), to: new Date() }),
  },
  {
    key: 'thisMonth',
    label: 'Ce mois',
    getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }),
  },
  {
    key: 'lastMonth',
    label: 'Mois dernier',
    getRange: () => {
      const d = subMonths(new Date(), 1)
      return { from: startOfMonth(d), to: endOfMonth(d) }
    },
  },
  {
    key: 'quarter',
    label: 'Trimestre',
    getRange: () => ({ from: subDays(new Date(), 90), to: new Date() }),
  },
]

type DateRangePickerProps = {
  value?: DateRangeValue
  onValueChange?: (value: DateRangeValue) => void
  placeholder?: string
  className?: string
  align?: 'start' | 'center' | 'end'
  presets?: boolean
}

function formatRange(value: DateRangeValue): string | null {
  if (!value?.from) return null
  if (!value.to) return format(value.from, 'dd MMM yyyy', { locale: fr })
  return `${format(value.from, 'dd MMM yyyy', { locale: fr })} – ${format(value.to, 'dd MMM yyyy', { locale: fr })}`
}

export function DateRangePicker({
  value,
  onValueChange,
  placeholder = 'Choisir une période',
  className,
  align = 'end',
  presets = true,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<DateRangeValue>(value)
  const [activePreset, setActivePreset] = React.useState<PresetKey | 'custom' | null>(null)

  // Keep draft in sync when controlled value changes externally
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(value)
  }, [value])

  const label = formatRange(value) ?? placeholder

  const handlePreset = (key: PresetKey) => {
    const entry = PRESETS.find((p) => p.key === key)
    if (!entry) return
    const range = entry.getRange()
    setDraft(range)
    setActivePreset(key)
  }

  const handleApply = () => {
    onValueChange?.(draft)
    setOpen(false)
  }

  const handleClear = () => {
    setDraft(undefined)
    onValueChange?.(undefined)
    setActivePreset(null)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className={cn(
            'h-10 justify-start rounded-xl bg-background text-left font-normal shadow-none',
            !value?.from && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className='mr-2 size-4 shrink-0 opacity-60' />
          <span className='truncate'>{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align={align}>
        <div className='flex flex-col sm:flex-row'>
          {presets ? (
            <div className='flex flex-col gap-1 border-b p-3 sm:border-b-0 sm:border-r sm:w-[160px]'>
              <p className='mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase'>Raccourcis</p>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.key}
                  type='button'
                  variant={activePreset === preset.key ? 'secondary' : 'ghost'}
                  size='sm'
                  className='justify-start text-xs'
                  onClick={() => handlePreset(preset.key)}
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                type='button'
                variant={activePreset === 'custom' ? 'secondary' : 'ghost'}
                size='sm'
                className='justify-start text-xs'
                onClick={() => setActivePreset('custom')}
              >
                Personnalisé
              </Button>
            </div>
          ) : null}
          <div className='p-3'>
            <Calendar
              mode='range'
              selected={draft}
              onSelect={(next) => {
                setDraft(next)
                setActivePreset('custom')
              }}
              numberOfMonths={2}
              captionLayout='dropdown'
              disabled={{ after: new Date() }}
            />
            <div className='mt-3 flex items-center justify-between gap-2'>
              <Button type='button' variant='ghost' size='sm' onClick={handleClear}>
                Réinitialiser
              </Button>
              <div className='flex gap-2'>
                <Button type='button' variant='outline' size='sm' onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button type='button' size='sm' onClick={handleApply}>
                  Appliquer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
