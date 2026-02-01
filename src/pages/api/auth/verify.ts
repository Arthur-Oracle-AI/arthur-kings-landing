/**
 * POST /api/auth/verify
 *
 * Verify SIWE message signature and issue session cookie.
 * Expects JSON body: { message: string, signature: string }
 */

import type { APIContext } from 'astro'
import {
  verifySiweSignature,
  createSessionToken,
  createSessionCookie
} from '../../../lib/auth'

// Opt out of prerendering - this route needs to be dynamic
export const prerender = false

interface VerifyBody {
  message: string
  signature: `0x${string}`
}

export async function POST({ request, locals, url }: APIContext) {
  try {
    // Parse request body
    const body: VerifyBody = await request.json()
    const { message, signature } = body

    if (!message || !signature) {
      return new Response(JSON.stringify({ error: 'Missing message or signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get runtime for KV access
    const runtime = (locals as any).runtime
    const kv = runtime?.env?.NONCE_KV
    const jwtSecret = runtime?.env?.JWT_SECRET || 'dev-secret-change-in-production'

    // Verify the SIWE signature
    const result = await verifySiweSignature(
      message,
      signature,
      undefined, // nonce checked separately below
      url.hostname // verify domain matches
    )

    if (!result.valid || !result.address) {
      return new Response(JSON.stringify({ error: result.error || 'Verification failed' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verify nonce exists in KV (prevents replay attacks)
    if (kv && result.nonce) {
      const nonceData = await kv.get(`nonce:${result.nonce}`)
      if (!nonceData) {
        return new Response(JSON.stringify({ error: 'Invalid or expired nonce' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      // Delete nonce after use (single-use)
      await kv.delete(`nonce:${result.nonce}`)
    }

    // Create session token
    const token = await createSessionToken(result.address, jwtSecret)

    // Determine if we're in production (use secure cookies)
    const isProduction = url.protocol === 'https:'

    // Return success with session cookie
    return new Response(JSON.stringify({
      authenticated: true,
      address: result.address
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': createSessionCookie(token, isProduction)
      }
    })
  } catch (error) {
    console.error('Verify error:', error)
    return new Response(JSON.stringify({ error: 'Verification failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
