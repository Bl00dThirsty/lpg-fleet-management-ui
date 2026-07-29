import { createApp } from './handlers.ts'

export { createApp }
export * from './types.ts'
export { AUTH_FIXTURES } from '@lpg/mock-data'

/** Default export = configured Express app, ready to `listen()` or mount. */
export { default } from './server.ts'
