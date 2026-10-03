import { useMemo, useState } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  cn,
} from '@lpg/ui'
import { ROLE_LABELS } from '@lpg/permissions'
import { Check, ChevronsUpDown, Building2 } from 'lucide-react'

export interface SelectableUser {
  id: string
  email: string
  first_name: string
  last_name: string
  system_role: string
  org_id: string
  org_name: string
  org_type?: string
}

interface UserPickerProps {
  users: SelectableUser[]
  value: string | null
  onChange: (userId: string) => void
  placeholder?: string
}

function initials(first: string, last: string) {
  return ((first?.charAt(0) ?? '') + (last?.charAt(0) ?? '')).toUpperCase() || '?'
}

const ORG_TYPE_LABELS: Record<string, string> = {
  REGULATEUR: 'Régulateur',
  MARKETEUR: 'Marketeur',
  TRANSPORTEUR: 'Transporteur',
  DEPOT: 'Dépôt',
  CLIENT: 'Client',
}

export function UserPicker({
  users,
  value,
  onChange,
  placeholder = 'Sélectionner un utilisateur…',
}: UserPickerProps) {
  const [open, setOpen] = useState(false)

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; users: SelectableUser[] }>()
    for (const u of users) {
      const orgType = u.org_type || 'AUTRE'
      const key = orgType
      if (!map.has(key)) {
        map.set(key, {
          label: ORG_TYPE_LABELS[orgType] ?? orgType,
          users: [],
        })
      }
      map.get(key)!.users.push(u)
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[1].label < b[1].label ? -1 : 1))
      .map(([key, group]) => {
        const users = [...group.users].sort((a, b) =>
          (a.org_name ?? '').localeCompare(b.org_name ?? '') ||
          `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        )
        return { key, label: group.label, users }
      })
  }, [users])

  const selected = users.find((u) => u.id === value) ?? null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between font-normal'
        >
          {selected ? (
            <span className='flex items-center gap-2 truncate'>
              <Avatar className='h-6 w-6 rounded-full'>
                <AvatarFallback className='bg-primary/10 text-[10px] font-semibold text-primary'>
                  {initials(selected.first_name, selected.last_name)}
                </AvatarFallback>
              </Avatar>
              <span className='truncate'>
                {selected.first_name} {selected.last_name}
              </span>
              <Badge variant='secondary' className='ml-1 text-[10px]'>
                {ROLE_LABELS[selected.system_role as keyof typeof ROLE_LABELS] ??
                  selected.system_role}
              </Badge>
            </span>
          ) : (
            <span className='text-muted-foreground'>{placeholder}</span>
          )}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[var(--radix-popover-trigger-width)] p-0'
        align='start'
      >
        <Command>
          <CommandInput placeholder='Rechercher un utilisateur ou une organisation…' />
          <CommandList>
            <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>
            {grouped.map((group) => (
              <CommandGroup
                key={group.key}
                heading={
                  <span className='flex items-center gap-1.5 text-xs font-semibold text-muted-foreground'>
                    <Building2 className='h-3 w-3' />
                    <Badge variant='secondary' className='text-[10px]'>
                      {group.label}
                    </Badge>
                    <span>{group.users.length}</span>
                  </span>
                }
              >
                {group.users.map((u) => {
                  const isSelected = u.id === value
                  return (
                    <CommandItem
                      key={u.id}
                      value={`${u.first_name} ${u.last_name} ${u.email} ${u.org_name} ${u.system_role} ${group.label}`}
                      onSelect={() => {
                        onChange(u.id)
                        setOpen(false)
                      }}
                      className='flex items-center gap-2 py-2'
                    >
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isSelected ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <Avatar className='h-7 w-7 rounded-full'>
                        <AvatarFallback className='bg-primary/10 text-[10px] font-semibold text-primary'>
                          {initials(u.first_name, u.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex flex-1 flex-col truncate'>
                        <span className='truncate text-sm font-medium'>
                          {u.first_name} {u.last_name}
                        </span>
                        <span className='truncate text-xs text-muted-foreground'>
                          {u.email}
                        </span>
                        <span className='flex items-center gap-1 truncate text-xs text-muted-foreground/80'>
                          <Building2 className='h-3 w-3 shrink-0' />
                          {u.org_name || '—'}
                        </span>
                      </div>
                      <Badge variant='outline' className='ml-auto text-[10px]'>
                        {ROLE_LABELS[u.system_role as keyof typeof ROLE_LABELS] ??
                          u.system_role}
                      </Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}