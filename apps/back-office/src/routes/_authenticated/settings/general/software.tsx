import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/settings/general/software')({
  component: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Logiciel</h3>
        <p className="text-sm text-muted-foreground">
          Mises à jour et informations sur le logiciel.
        </p>
      </div>
      <div className="text-sm text-muted-foreground flex flex-col gap-4">
        <p>Cette section est vide pour le moment. Nous la compléterons au fur et à mesure.</p>
      </div>
    </div>
  ),
})
