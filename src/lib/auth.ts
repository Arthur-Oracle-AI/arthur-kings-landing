/**
 * SIWE Authentication Library for Arthur Oracle
 *
 * Uses viem for Ethereum signature verification and SIWE message handling.
 * Stateless JWT-based sessions stored in HTTP-only cookies.
 */

import { generateSiweNonce, parseSiweMessage, validateSiweMessage } from 'viem/siwe'
import { verifyMessage } from 'viem'
import type { SiweMessage } from 'viem/siwe'

// Session configuration
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours
const NONCE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

// Types
export interface Session {
  address: string
  iat: number // issued at (timestamp)
  exp: number // expiry (timestamp)
}

export interface AuthResult {
  authenticated: boolean
  address?: string
  error?: string
}

// Re-export viem SIWE utilities
export { generateSiweNonce, parseSiweMessage }
export type { SiweMessage }

/**
 * Create a simple JWT-like token (base64 encoded JSON with HMAC signature)
 * Uses Web Crypto API for Cloudflare Workers compatibility
 */
export async function createSessionToken(address: string, secret: string): Promise<string> {
  const now = Date.now()
  const session: Session = {
    address: address.toLowerCase(),
    iat: now,
    exp: now + SESSION_DURATION_MS
  }

  const payload = btoa(JSON.stringify(session))
  const signature = await hmacSign(payload, secret)

  return `${payload}.${signature}`
}

/**
 * Verify and decode a session token
 */
export async function verifySessionToken(token: string, secret: string): Promise<AuthResult> {
  try {
    const [payload, signature] = token.split('.')
    if (!payload || !signature) {
      return { authenticated: false, error: 'Invalid token format' }
    }

    // Verify signature
    const expectedSig = await hmacSign(payload, secret)
    if (signature !== expectedSig) {
      return { authenticated: false, error: 'Invalid signature' }
    }

    // Decode and check expiry
    const session: Session = JSON.parse(atob(payload))
    if (Date.now() > session.exp) {
      return { authenticated: false, error: 'Token expired' }
    }

    return { authenticated: true, address: session.address }
  } catch {
    return { authenticated: false, error: 'Token decode failed' }
  }
}

/**
 * Verify SIWE message signature using viem
 * Uses parseSiweMessage + validateSiweMessage + verifyMessage
 */
export async function verifySiweSignature(
  message: string,
  signature: `0x${string}`,
  expectedNonce?: string,
  expectedDomain?: string
): Promise<{ valid: boolean; address?: string; nonce?: string; error?: string }> {
  try {
    // Parse the SIWE message to extract fields
    const parsed = parseSiweMessage(message)

    // Validate message structure and optional fields (time, nonce, domain)
    const isValidMessage = validateSiweMessage({
      message: parsed,
      nonce: expectedNonce,
      domain: expectedDomain,
      time: new Date()
    })

    if (!isValidMessage) {
      return { valid: false, error: 'Message validation failed (nonce, domain, or time)' }
    }

    // Verify the cryptographic signature
    const isValidSignature = await verifyMessage({
      address: parsed.address as `0x${string}`,
      message,
      signature
    })

    if (!isValidSignature) {
      return { valid: false, error: 'Signature verification failed' }
    }

    // Additional check: message not too old (even if within expiration)
    if (parsed.issuedAt) {
      const issuedAt = new Date(parsed.issuedAt).getTime()
      if (Date.now() - issuedAt > NONCE_DURATION_MS) {
        return { valid: false, error: 'Message too old' }
      }
    }

    return {
      valid: true,
      address: parsed.address,
      nonce: parsed.nonce
    }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Verification failed' }
  }
}

/**
 * Create HTTP-only session cookie string
 */
export function createSessionCookie(token: string, secure: boolean = true): string {
  const maxAge = SESSION_DURATION_MS / 1000 // Convert to seconds
  const parts = [
    `arthur_session=${token}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict'
  ]
  if (secure) {
    parts.push('Secure')
  }
  return parts.join('; ')
}

/**
 * Create cookie string that clears the session
 */
export function createLogoutCookie(): string {
  return 'arthur_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict'
}

/**
 * Extract session token from cookie header
 */
export function getSessionFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').map(c => c.trim())
  const sessionCookie = cookies.find(c => c.startsWith('arthur_session='))

  if (!sessionCookie) return null
  return sessionCookie.split('=')[1] || null
}

/**
 * HMAC-SHA256 signing using Web Crypto API (Cloudflare Workers compatible)
 */
async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(data)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, messageData)

  // Convert to base64url (URL-safe base64)
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
