import { PickupsPage } from '@/features/pickups'
import { useAuthStore } from '@/store/auth-store'
export function MarketerPickupsList({
  marketer,
}: {
  marketer: { id: string; name: string }
}) {
  const role = useAuthStore((s) => s.user?.system_role ?? 'LIVREUR')
  return <PickupsPage role={role} marketerId={marketer.id} />
}
