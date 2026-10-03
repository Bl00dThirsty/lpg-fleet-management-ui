import { CalendarRange } from 'lucide-react'
import { Button } from '../ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover'
import { DatePicker } from '../date-picker'

export type DateRangeValue = {
  from?: Date
  to?: Date
}

type DateRangeFilterProps = {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  placeholder?: string
}

export function DateRangeFilter({
  value,
  onChange,
  placeholder = 'Plage de dates',
}: DateRangeFilterProps) {
  const hasValue = !!value.from || !!value.to
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className='h-8 border-dashed'
          aria-label='Filtrer par date'
        >
          <CalendarRange className='size-3.5' />
          <span className='max-w-40 truncate'>
            {value.from
              ? value.to
                ? `${value.from.toLocaleDateString()} → ${value.to.toLocaleDateString()}`
                : value.from.toLocaleDateString()
              : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='flex w-auto flex-col gap-3 p-3'>
        <div className='space-y-1'>
          <p className='text-xs font-medium text-muted-foreground'>Du</p>
          <DatePicker
            selected={value.from}
            onSelect={(d) => onChange({ ...value, from: d })}
          />
        </div>
        <div className='space-y-1'>
          <p className='text-xs font-medium text-muted-foreground'>Au</p>
          <DatePicker
            selected={value.to}
            onSelect={(d) => onChange({ ...value, to: d })}
          />
        </div>
        {hasValue && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onChange({ from: undefined, to: undefined })}
          >
            Effacer
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
