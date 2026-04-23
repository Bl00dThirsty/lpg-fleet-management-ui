import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Clipboard, Eye, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Truck } from '../data/trucks'

type DataTableRowActionsProps = {
  truck: Truck
  onViewDetails: (truck: Truck) => void
}

export function DataTableRowActions({
  truck,
  onViewDetails,
}: DataTableRowActionsProps) {
  const copyTruckId = () => {
    void navigator.clipboard?.writeText(truck.id)
    toast.success(`${truck.id} copie`)
  }

  const requestMaintenance = () => {
    toast.info(`Maintenance planifiee pour ${truck.id}`)
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Ouvrir le menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuItem onClick={() => onViewDetails(truck)}>
          Voir les details
          <DropdownMenuShortcut>
            <Eye size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyTruckId}>
          Copier l'identifiant
          <DropdownMenuShortcut>
            <Clipboard size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={requestMaintenance}>
          Planifier maintenance
          <DropdownMenuShortcut>
            <Wrench size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
