import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/settings/general/date')({
  component: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Date et heure</h3>
        <p className="text-sm text-muted-foreground">
          Gérez l'affichage de la date et de l'heure de votre système.
        </p>
      </div>
      <div className="text-sm text-muted-foreground flex flex-col gap-4">
        <p>Cette section est vide pour le moment. Nous la compléterons au fur et à mesure.</p>
      </div>
    </div>
  ),
})
