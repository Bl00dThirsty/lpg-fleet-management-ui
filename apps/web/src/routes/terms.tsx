import { createFileRoute } from '@tanstack/react-router'
import { Button, Card } from '@lpg/ui'
import csphLogo from '@/assets/logo-csph-small.png'

export const Route = createFileRoute('/terms')({
  component: TermsPage,
})

function TermsPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-5">
      <div className="hidden lg:flex lg:col-span-2 bg-muted relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div className="flex items-center gap-2">
            <img src={csphLogo} alt="CSPH" className="h-10 w-auto" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">CSPH</h2>
            <p className="text-muted-foreground max-w-xs leading-relaxed">
              Console de gestion de flotte. Connectez-vous pour acceder a votre espace de travail.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CSPH. Tous droits reserves.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 lg:col-span-3 bg-background">
        <Card className="w-full max-w-2xl border shadow-sm">
          <div className="p-8">
            <div className="flex justify-center mb-6 lg:hidden">
              <img src={csphLogo} alt="CSPH" className="h-12 w-auto" />
            </div>

            <div className="space-y-6">
              <h1 className="text-2xl font-bold tracking-tight">Conditions d'utilisation</h1>

              <div className="prose prose-sm max-w-none">
                <p>Bienvenue sur la console de gestion de flotte CSPH.</p>

                <h2 className="text-lg font-semibold mt-4">1. Acceptation des conditions</h2>
                <p>En accedant a cette plateforme, vous acceptez les presentes conditions d'utilisation.</p>

                <h2 className="text-lg font-semibold mt-4">2. Utilisation</h2>
                <p>Cette plateforme est destinee exclusivement a la gestion de la flotte de camions LPG de CSPH.</p>

                <h2 className="text-lg font-semibold mt-4">3. Responsabilite</h2>
                <p>CSPH se reserve le droit de modifier les presentes conditions a tout moment.</p>
              </div>

              <div className="flex justify-end pt-4">
                <Button asChild>
                  <a href="/login">Retour a la connexion</a>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
