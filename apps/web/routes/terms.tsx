import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'

export const Route = createFileRoute('/terms')({
  component: TermsPage,
})

function TermsPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-12'>
      <Card className='rounded-2xl border-border/60 shadow-none'>
        <CardHeader>
          <CardTitle className='text-2xl'>Conditions Générales d'Utilisation</CardTitle>
          <p className='text-sm text-muted-foreground'>Dernière mise à jour : 21 juillet 2026</p>
        </CardHeader>
        <CardContent className='prose prose-sm max-w-none space-y-6'>
          <Section title='1. Acceptation des conditions'>
            En accédant à la plateforme CSPH Gestion de Flotte, vous acceptez d'être lié par les présentes conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.
          </Section>
          <Section title='2. Utilisation du service'>
            La plateforme est destinée à la gestion de flotte de véhicules GPL. Vous vous engagez à utiliser le service conformément aux lois et règlements en vigueur. Toute utilisation frauduleuse ou abusive entraînera la suspension immédiate de votre compte.
          </Section>
          <Section title='3. Responsabilités'>
            CSPH met tout en œuvre pour assurer la disponibilité et la sécurité de la plateforme. Cependant, CSPH ne saurait être tenue responsable des dommages directs ou indirects résultant de l'utilisation du service, y compris les pertes de données ou les interruptions de service.
          </Section>
          <Section title='4. Protection des données'>
            Les données personnelles collectées sont traitées conformément à la réglementation en vigueur sur la protection des données. Vos informations sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers sans votre consentement explicite. Vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
          </Section>
          <Section title='5. Modifications'>
            CSPH se réserve le droit de modifier les présentes conditions à tout moment. Les utilisateurs seront notifiés des changements importants par email ou via la plateforme. L'utilisation continue du service après modification constitue l'acceptation des nouvelles conditions.
          </Section>
          <Section title='6. Contact'>
            Pour toute question relative aux présentes conditions, veuillez contacter notre équipe juridique à l'adresse suivante : juridique@csph.cm.
          </Section>
        </CardContent>
      </Card>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className='text-base font-semibold'>{title}</h3>
      <p className='mt-1 text-sm text-muted-foreground leading-relaxed'>{children}</p>
    </div>
  )
}
