import { type Marketer } from '../data/marketers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sites, siteTypeLabels, type SiteType } from '@/features/sites/data/sites'
import { Badge } from '@/components/ui/badge'

export function MarketerSites({ marketer }: { marketer: Marketer }) {
  // Filtre simulé : on prend quelques sites au hasard pour ce marketer ou ceux qui contiennent son nom.
  const marketerSites = sites.filter(
    (site) =>
      site.operator.toLowerCase().includes(marketer.name.toLowerCase()) ||
      site.type === 'depot' ||
      site.type === 'marketer'
  ).slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base sm:text-lg'>Sites et Dépôts de {marketer.name}</CardTitle>
      </CardHeader>
      <CardContent className='px-0 sm:px-6'>
        {/* Mobile: card list */}
        <div className='flex flex-col gap-3 sm:hidden'>
          {marketerSites.map((site) => (
            <div key={site.id} className='border rounded-lg p-3 mx-3'>
              <div className='flex items-start justify-between gap-2'>
                <p className='font-medium text-sm leading-tight'>{site.name}</p>
                <Badge variant={site.status === 'active' ? 'default' : 'secondary'} className='shrink-0'>
                  {site.status}
                </Badge>
              </div>
              <div className='mt-2 flex items-center gap-3 text-xs text-muted-foreground'>
                <span>{siteTypeLabels[site.type as SiteType]}</span>
                <span>•</span>
                <span>{site.city}</span>
              </div>
            </div>
          ))}
          {marketerSites.length === 0 && (
            <p className='p-4 text-center text-muted-foreground'>
              Aucun site trouvé pour ce marketer.
            </p>
          )}
        </div>

        {/* Desktop: table */}
        <div className='hidden sm:block overflow-x-auto rounded-md border'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted/50 text-muted-foreground'>
              <tr>
                <th className='p-3 font-medium'>Nom du Site</th>
                <th className='p-3 font-medium'>Type</th>
                <th className='p-3 font-medium'>Ville</th>
                <th className='p-3 font-medium'>Statut</th>
              </tr>
            </thead>
            <tbody>
              {marketerSites.map((site) => (
                <tr key={site.id} className='border-t'>
                  <td className='p-3 font-medium'>{site.name}</td>
                  <td className='p-3'>{siteTypeLabels[site.type as SiteType]}</td>
                  <td className='p-3'>{site.city}</td>
                  <td className='p-3'>
                    <Badge variant={site.status === 'active' ? 'default' : 'secondary'}>
                      {site.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {marketerSites.length === 0 && (
                <tr>
                  <td colSpan={4} className='p-4 text-center text-muted-foreground'>
                    Aucun site trouvé pour ce marketer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
