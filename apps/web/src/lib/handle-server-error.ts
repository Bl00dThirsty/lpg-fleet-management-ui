import { AxiosError } from 'axios'
import { toast } from 'sonner'
import i18n from '@/lib/i18n'

export function handleServerError(error: unknown) {
  if (import.meta.env.DEV) console.log(error)

  let errMsg = i18n.t('errors:server.generic', { defaultValue: 'Something went wrong!' })

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = i18n.t('errors:server.noContent', { defaultValue: 'No content.' })
  }

  if (error instanceof AxiosError) {
    const title = error.response?.data?.title
    if (typeof title === 'string' && title.length > 0) {
      errMsg = title
    }
  }

  toast.error(errMsg)
}
