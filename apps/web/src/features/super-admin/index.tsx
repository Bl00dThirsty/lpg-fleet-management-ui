import { ShieldCheck } from 'lucide-react'

export function ToursPage() {
  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <div className='flex items-center gap-2'>
        <ShieldCheck className='h-6 w-6 text-primary' />
        <h1 className='text-2xl font-bold tracking-tight'>Super Admin — Tours</h1>
      </div>
    </main>
  )
}