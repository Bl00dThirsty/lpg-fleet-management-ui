import { toast as sonnerToast, type ExternalToast } from 'sonner'

export const toast = (message: string, data?: ExternalToast) =>
  sonnerToast(message, { duration: 5000, ...data })

export const toastSuccess = (message: string, data?: ExternalToast) =>
  sonnerToast.success(message, { duration: 4000, ...data })

export const toastError = (message: string, data?: ExternalToast) =>
  sonnerToast.error(message, { duration: 6000, ...data })

export const toastInfo = (message: string, data?: ExternalToast) =>
  sonnerToast.info(message, { duration: 4000, ...data })
