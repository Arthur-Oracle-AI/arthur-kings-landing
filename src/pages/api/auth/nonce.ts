/**
 * GET /api/auth/nonce
 *
 * Generate a cryptographic nonce for SIWE authentication.
 * Nonces are stored in KV with 5-minute TTL and single-use.
 */

import type { APIContext } from 'astro'
import { generateSiweNonce } from '../../../lib/auth'

// Opt out of prerendering - this route needs to be dynamic
export const prerender = false

export async function GET({ locals }: APIContext) {
  try {
    // Generate cryptographic nonce
    const nonce = generateSiweNonce()

    // Get KV binding from Cloudflare runtime
    const runtime = (locals as any).runtime
    const kv = runtime?.env?.NONCE_KV

    if (kv) {
      // Store nonce in KV with 5-minute TTL
      await kv.put(`nonce:${nonce}`, JSON.stringify({ created: Date.now() }), {
        expirationTtl: 300 // 5 minutes in seconds
      })
    } else {
      // Development fallback: log warning but continue
      console.warn('NONCE_KV not available - nonces will not be validated')
    }

    return new Response(JSON.stringify({ nonce }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error('Nonce generation error:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate nonce' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
