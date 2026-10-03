/** Pending-state skeleton for data-heavy routes (dashboard, tours, pickups). */

export function RouteSkeleton() {
  return (
    <div className='space-y-4 p-6' aria-busy='true'>
      <div className='h-8 w-56 animate-pulse rounded bg-muted' />
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='h-24 animate-pulse rounded-xl bg-muted' />
        ))}
      </div>
      <div className='h-40 animate-pulse rounded-xl bg-muted' />
    </div>
  )
}
