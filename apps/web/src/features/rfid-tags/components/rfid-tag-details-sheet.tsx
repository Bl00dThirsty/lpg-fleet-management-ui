import { ScanBarcode } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  rfidTagStatusClasses,
  rfidTagStatusLabels,
  type RfidTagView,
} from '../data/rfid-tags'

type RfidTagDetailsSheetProps = {
  tag: RfidTagView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RfidTagDetailsSheet({
  tag,
  open,
  onOpenChange,
}: RfidTagDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {tag ? (
        <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
          <SheetHeader className='pb-4'>
            <div className='flex items-start justify-between gap-3 pe-8'>
              <div>
                <SheetTitle className='font-mono text-xl'>
                  {tag.tag_id}
                </SheetTitle>
                <SheetDescription>
                  Bouteille {tag.bottle_serial}
                </SheetDescription>
              </div>
              <Badge
                className={cn('font-medium', rfidTagStatusClasses[tag.status])}
              >
                {rfidTagStatusLabels[tag.status]}
              </Badge>
            </div>
          </SheetHeader>

          <div className='space-y-4 px-4 pb-6'>
            <Card className='border-transparent bg-muted/20 shadow-xs'>
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-2 text-sm'>
                  <ScanBarcode className='size-4 text-primary' />
                  Informations du tag
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <DetailLine label='Bouteille' value={tag.bottle_serial} />
                <DetailLine label='Localisation' value={tag.location} />
                <DetailLine
                  label='Date creation'
                  value={formatDateTime(tag.created_at)}
                />
              </CardContent>
            </Card>

            <Separator />

            <div className='text-xs text-muted-foreground'>
              Identifiant interne
            </div>
            <DetailLine label='ID (UUID)' value={tag.tag.id} />
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-3 text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='max-w-72 text-right font-medium'>{value}</span>
    </div>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
