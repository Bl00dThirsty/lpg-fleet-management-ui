import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiAdapter } from '@lpg/api-client'
import type { MissionDocument } from '@lpg/types'
import {
  FileImage,
  FileText,
  RefreshCw,
  Upload,
  ExternalLink,
  Download,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth-store'
import type { RouteTripViewStop } from '../data/tour-activity'
import { getTourLiveRefreshIntervalMs } from '../lib/use-tour-live-refresh'

export interface MissionDocumentsProps {
  missionId: string
  stops?: RouteTripViewStop[]
}

function isPdfDocument(doc: { url?: string; label?: string }): boolean {
  const url = (doc.url || '').toLowerCase()
  const label = (doc.label || '').toLowerCase()
  return (
    url.endsWith('.pdf') ||
    url.includes('application/pdf') ||
    url.startsWith('data:application/pdf') ||
    label.includes('.pdf') ||
    label.includes('(pdf)')
  )
}

export function MissionDocuments({ missionId, stops }: MissionDocumentsProps) {
  const userId = useAuthStore((s) => s.user?.id)
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // PDF Import state
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docLabel, setDocLabel] = useState('')
  const [targetStopId, setTargetStopId] = useState<string>('all')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const query = useQuery({
    queryKey: ['tours', missionId, 'documents', userId],
    queryFn: () =>
      apiAdapter.request<MissionDocument[]>(
        `/tours/${encodeURIComponent(missionId)}/documents`
      ),
    staleTime: 0,
    refetchInterval: getTourLiveRefreshIntervalMs(),
  })

  const selected = query.data?.find((d) => d.id === selectedId)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      toast.error('Veuillez sélectionner un fichier au format PDF.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier dépasse la taille maximale de 5 Mo.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setSelectedFile(file)
    if (!docLabel.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, '')
      setDocLabel(`Bon de livraison — ${baseName} (PDF)`)
    }
  }

  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) {
      toast.error('Veuillez choisir un fichier PDF.')
      return
    }

    setIsSubmitting(true)
    const reader = new FileReader()
    reader.readAsDataURL(selectedFile)

    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string
        const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '')
        const label =
          docLabel.trim() || `Bon de livraison — ${selectedFile.name} (PDF)`

        await apiAdapter.request<MissionDocument>(
          `/tours/${encodeURIComponent(missionId)}/documents`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              label,
              file_base64: base64,
              checkpoint_id: targetStopId !== 'all' ? targetStopId : undefined,
            }),
          }
        )

        await queryClient.invalidateQueries({
          queryKey: ['tours', missionId, 'documents'],
        })

        toast.success('Bon de livraison importé avec succès sous forme de PDF')
        setIsImportOpen(false)
        setSelectedFile(null)
        setDocLabel('')
        setTargetStopId('all')
        if (fileInputRef.current) fileInputRef.current.value = ''
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Erreur lors de l’importation du PDF'
        )
      } finally {
        setIsSubmitting(false)
      }
    }

    reader.onerror = () => {
      setIsSubmitting(false)
      toast.error('Erreur lors de la lecture du fichier.')
    }
  }

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle>Bons de livraison & justificatifs</CardTitle>
          <CardDescription>
            Bons scannés par le chauffeur ou importés sous forme de PDF.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="size-4" />
            Importer sous forme de PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={query.isFetching}
            onClick={() => query.refetch()}
          >
            <RefreshCw className="mr-2 size-4" />
            Actualiser
          </Button>
        </div>
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
            {query.data.map((document) => {
              const isPdf = isPdfDocument(document)
              return (
                <Button
                  key={document.id}
                  variant="outline"
                  className="h-auto justify-start gap-3 whitespace-normal p-4 text-left"
                  onClick={() => {
                    setSelectedId(document.id)
                    void query.refetch()
                  }}
                >
                  {isPdf ? (
                    <FileText className="size-6 shrink-0 text-red-500" />
                  ) : (
                    <FileImage className="size-6 shrink-0 text-emerald-600" />
                  )}
                  <span className="flex-1">
                    <span className="flex items-center gap-2 font-medium">
                      {document.label}
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1 py-0 h-4 ${
                          isPdf
                            ? 'bg-red-500/10 text-red-600 border-red-200'
                            : 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isPdf ? 'PDF' : 'IMG'}
                      </Badge>
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {document.captured_at
                        ? new Date(document.captured_at).toLocaleString('fr-FR')
                        : 'Document transmis'}
                    </span>
                  </span>
                </Button>
              )
            })}
          </div>
        )}

        {/* Dialog: Preview document */}
        <Dialog
          open={!!selectedId}
          onOpenChange={(open) => {
            if (!open) setSelectedId(null)
          }}
        >
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle>{selected?.label ?? 'Justificatif'}</DialogTitle>
                {selected && (
                  <Badge
                    variant={isPdfDocument(selected) ? 'destructive' : 'secondary'}
                  >
                    {isPdfDocument(selected) ? 'PDF' : 'Image'}
                  </Badge>
                )}
              </div>
              <DialogDescription>
                {selected?.captured_at
                  ? `Document transmis le ${new Date(selected.captured_at).toLocaleString('fr-FR')}`
                  : 'Document joint à la mission.'}
              </DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="space-y-4">
                {isPdfDocument(selected) ? (
                  <div className="relative h-[65vh] w-full overflow-hidden rounded-md border bg-muted/20">
                    <object
                      data={selected.url}
                      type="application/pdf"
                      className="size-full"
                    >
                      <iframe
                        src={selected.url}
                        title={selected.label}
                        className="size-full border-0"
                      />
                    </object>
                  </div>
                ) : (
                  <img
                    src={selected.url}
                    alt={selected.label}
                    className="max-h-[65vh] w-full object-contain rounded-md"
                  />
                )}
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline">
                    <a
                      href={selected.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="size-4" />
                      Ouvrir dans un nouvel onglet
                    </a>
                  </Button>
                  <Button asChild variant="secondary">
                    <a
                      href={selected.url}
                      download={selected.label || 'document.pdf'}
                      className="flex items-center gap-2"
                    >
                      <Download className="size-4" />
                      Télécharger
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog: Importer sous forme de PDF */}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="size-5 text-primary" />
                  Importer sous forme de PDF
                </DialogTitle>
                <DialogDescription>
                  Ajoutez un bon de livraison ou d'enlèvement scanné en PDF (5 Mo maximum).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pdf-file">Fichier PDF *</Label>
                  <Input
                    id="pdf-file"
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    required
                  />
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Sélectionné : <span className="font-medium text-foreground">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(0)} Ko)
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="doc-label">Libellé du document</Label>
                  <Input
                    id="doc-label"
                    value={docLabel}
                    onChange={(e) => setDocLabel(e.target.value)}
                    placeholder="Ex. Bon de livraison N° 2026-081"
                  />
                </div>

                {stops && stops.length > 0 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="stop-select">Arrêt / Étape associée</Label>
                    <Select value={targetStopId} onValueChange={setTargetStopId}>
                      <SelectTrigger id="stop-select">
                        <SelectValue placeholder="Sélectionnez une étape" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Mission globale (tous arrêts)</SelectItem>
                        {stops.map((stop, idx) => (
                          <SelectItem key={stop.id} value={stop.id}>
                            Étape {idx + 1} : {stop.pointName || stop.site?.name || stop.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsImportOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedFile || isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Importation…
                    </>
                  ) : (
                    <>
                      <Upload className="size-4" />
                      Importer le PDF
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
