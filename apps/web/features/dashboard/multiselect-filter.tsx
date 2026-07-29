import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button, cn } from '@lpg/ui'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@lpg/ui'
import { Popover, PopoverContent, PopoverTrigger } from '@lpg/ui'
import { Badge } from '@lpg/ui'

interface MultiselectFilterProps {
  title: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (values: string[]) => void
}

export function MultiselectFilter({ title, options, selected, onChange }: MultiselectFilterProps) {
  const [open, setOpen] = React.useState(false)

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    )
  }

  const clearAll = () => onChange([])
  const selectAll = () => onChange(options.map((o) => o.value))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-9 justify-between gap-2 border-border bg-background',
            selected.length > 0 && 'border-primary bg-primary/10'
          )}
        >
          <span className="truncate">
            {selected.length === 0
              ? title
              : `${title} (${selected.length})`}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Rechercher...`} />
          <CommandList>
            <CommandEmpty>Aucun resultat</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} onSelect={() => toggle(option.value)}>
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      selected.includes(option.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground/40'
                    )}
                  >
                    {selected.includes(option.value) && <Check className="size-3" />}
                  </div>
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="flex items-center gap-2 border-t p-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>
            Tout selectionner
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>
            Effacer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function MultiselectBadges({ values, options, onRemove }: {
  values: string[]
  options: { value: string; label: string }[]
  onRemove: (value: string) => void
}) {
  if (!values.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => {
        const option = options.find((o) => o.value === v)
        return (
          <Badge key={v} variant="secondary" className="gap-1 pr-1">
            {option?.label ?? v}
            <button
              onClick={() => onRemove(v)}
              className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </Badge>
        )
      })}
    </div>
  )
}
