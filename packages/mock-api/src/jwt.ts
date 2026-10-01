import crypto from 'node:crypto'

function b64url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function b64urlJson(obj: unknown): string {
  return b64url(JSON.stringify(obj))
}

function decodeB64url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8')
}

export interface JwtPayload {
  sub: string
  role: string
  email: string
  type: 'access' | 'refresh'
  exp: number
}

export function signToken(payload: Omit<JwtPayload, 'exp'>, expiresInSec: number): string {
  const header = { alg: 'none', typ: 'JWT' }
  const exp = Math.floor(Date.now() / 1000) + expiresInSec
  const body: JwtPayload = { ...payload, exp }
  return `${b64urlJson(header)}.${b64urlJson(body)}.mock`
}

export function verifyToken(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const body = JSON.parse(decodeB64url(parts[1])) as JwtPayload
    if (body.exp * 1000 < Date.now()) return null
    return body
  } catch {
    return null
  }
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}
