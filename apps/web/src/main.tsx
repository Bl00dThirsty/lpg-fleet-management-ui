import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  extractErrorMessage,
  isSessionExpiryError,
  shouldShowGlobalMutationError,
} from '@/hooks/use-toast-feedback'
import { NotFoundError } from '@/features/errors/not-found-error'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { PermissionsProvider } from './context/PermissionsProvider'
import { ThemeProvider } from './context/theme-provider'
import { useAuthStore } from '@/store/auth-store'
import { useWsClient } from '@/lib/ws/use-ws-client'
import '@/lib/i18n'
import { usePreferencesStore } from '@/store/preferences-store'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'

// Ensure html lang reflects persisted preference on boot
try {
  const bootLang = usePreferencesStore.getState().language
  document.documentElement.lang = bootLang.slice(0, 2)
} catch {
  document.documentElement.lang = 'fr'
}

function WsBridge() {
  const user = useAuthStore((s) => s.user)
  useWsClient(!!user)
  return null
}

let sessionExpiryHandled = false

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error, variables, context, mutationFunctionContext) => {
        handleSessionExpiry(error)
        if (shouldShowGlobalMutationError(error, variables, context, mutationFunctionContext)) {
          toast.error(extractErrorMessage(error))
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      handleSessionExpiry(error)
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultNotFoundComponent: NotFoundError,
})

function handleSessionExpiry(error: unknown) {
  if (!isSessionExpiryError(error) || sessionExpiryHandled) return
  sessionExpiryHandled = true
  toast.error(extractErrorMessage(error))
  queryClient.clear()
  void router.navigate({ to: '/login' })
}

router.subscribe('onResolved', ({ toLocation }) => {
  if (toLocation.pathname !== '/login') sessionExpiryHandled = false
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme='light'>
          <FontProvider>
            <DirectionProvider>
              <PermissionsProvider>
                <WsBridge />
                <RouterProvider router={router} />
              </PermissionsProvider>
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
