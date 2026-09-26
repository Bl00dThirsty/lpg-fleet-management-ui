import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('common')
  const copyTruckId = () => {
    void navigator.clipboard?.writeText(truck.id)
    toast.success(t('trucks.copied', { id: truck.id }))
  }

  const requestMaintenance = () => {
    toast.info(t('trucks.maintenancePlanned', { id: truck.id }))
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
           <span className='sr-only'>{t('trucks.openMenu')}</span>

        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuItem onClick={() => onViewDetails(truck)}>
           {t('trucks.viewDetails')}

          <DropdownMenuShortcut>
            <Eye size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyTruckId}>
           {t('trucks.copyId')}

          <DropdownMenuShortcut>
            <Clipboard size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={requestMaintenance}>
           {t('trucks.planMaintenance')}

          <DropdownMenuShortcut>
            <Wrench size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
