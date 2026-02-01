/**
 * GET /api/auth/session
 *
 * Check current session status and return user data if authenticated.
 */

import type { APIContext } from 'astro'
import { verifySessionToken, getSessionFromCookies } from '../../../lib/auth'

// Opt out of prerendering - this route needs to be dynamic
export const prerender = false

export async function GET({ request, locals }: APIContext) {
  try {
    // Get runtime for JWT secret
    const runtime = (locals as any).runtime
    const jwtSecret = runtime?.env?.JWT_SECRET || 'dev-secret-change-in-production'

    // Extract session token from cookies
    const cookieHeader = request.headers.get('cookie')
    const token = getSessionFromCookies(cookieHeader)

    if (!token) {
      return new Response(JSON.stringify({ authenticated: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verify session token
    const result = await verifySessionToken(token, jwtSecret)

    return new Response(JSON.stringify({
      authenticated: result.authenticated,
      address: result.address || null,
      error: result.error || null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Session check error:', error)
    return new Response(JSON.stringify({
      authenticated: false,
      error: 'Session check failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
