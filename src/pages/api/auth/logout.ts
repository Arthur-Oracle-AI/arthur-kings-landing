/**
 * POST /api/auth/logout
 *
 * Clear session cookie to log out user.
 */

import type { APIContext } from 'astro'
import { createLogoutCookie } from '../../../lib/auth'

// Opt out of prerendering - this route needs to be dynamic
export const prerender = false

export async function POST(_context: APIContext) {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': createLogoutCookie()
    }
  })
}
