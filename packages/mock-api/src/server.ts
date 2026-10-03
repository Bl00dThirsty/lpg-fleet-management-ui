import cors from 'cors'
import express from 'express'
import { buildRouter } from './handlers.ts'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/v1', buildRouter())

const PORT = Number(process.env.MOCK_API_PORT ?? 8787)

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[mock-api] listening on http://localhost:${PORT}/api/v1`)
  })
}

export default app
