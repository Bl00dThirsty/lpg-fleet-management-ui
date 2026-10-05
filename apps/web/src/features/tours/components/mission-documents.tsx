import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiAdapter } from '@lpg/api-client'
import type { MissionDocument } from '@lpg/types'
import { FileImage, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth-store'

export function MissionDocuments({ missionId }: { missionId: string }) {
  const userId = useAuthStore((s) => s.user?.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ['tours', missionId, 'documents', userId],
    queryFn: () =>
      apiAdapter.request<MissionDocument[]>(
        `/tours/${encodeURIComponent(missionId)}/documents`,
      ),
    staleTime: 0,
  })
  const selected = query.data?.find((d) => d.id === selectedId)
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Documents scannés</CardTitle>
        <Button
          size="sm"
          variant="outline"
          disabled={query.isFetching}
          onClick={() => query.refetch()}
        >
          <RefreshCw className="mr-2 size-4" />
          Actualiser
        </Button>
      </CardHeader>
      <CardContent>
        {query.isPending ? (
          <p role="status">Chargement des justificatifs…</p>
        ) : query.isError ? (
          <p role="alert" className="text-destructive">
            Les documents sont indisponibles. Réessayez.
          </p>
        ) : !query.data?.length ? (
          <p className="text-sm text-muted-foreground">
            Aucun document transmis par le livreur pour le moment.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {query.data.map((document) => (
              <Button
                key={document.id}
                variant="outline"
                className="h-auto justify-start gap-3 whitespace-normal p-4 text-left"
                onClick={() => {
                  setSelectedId(document.id)
                  void query.refetch()
                }}
              >
                <FileImage className="size-6 shrink-0" />
                <span>
                  {document.label}
                  <span className="block text-xs text-muted-foreground">
                    {document.captured_at
                      ? new Date(document.captured_at).toLocaleString('fr-FR')
                      : 'Document transmis'}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        )}
        <Dialog
          open={!!selectedId}
          onOpenChange={(open) => {
            if (!open) setSelectedId(null)
          }}
        >
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selected?.label ?? 'Justificatif'}</DialogTitle>
              <DialogDescription>
                Document photographié sur le mobile du livreur.
              </DialogDescription>
            </DialogHeader>
            {selected && (
              <>
                <img
                  src={selected.url}
                  alt={selected.label}
                  className="max-h-[65vh] w-full object-contain"
                />
                <Button asChild variant="outline">
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ouvrir le document
                  </a>
                </Button>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
