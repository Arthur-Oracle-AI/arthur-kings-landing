/**
 * Auth Store - Nanostores for SIWE authentication state
 *
 * Manages wallet connection, authentication status, and user address.
 */

import { atom, computed } from 'nanostores'

// Auth state atoms
export const $userAddress = atom<string | null>(null)
export const $isConnecting = atom(false)
export const $authError = atom<string | null>(null)

// Computed derived state
export const $isAuthenticated = computed($userAddress, (address) => !!address)

// Shortened address for display (0x1234...5678)
export const $shortAddress = computed($userAddress, (address) => {
  if (!address) return null
  return `${address.slice(0, 6)}...${address.slice(-4)}`
})

/**
 * Check current session status on page load
 */
export async function checkSession(): Promise<void> {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include'
    })
    const data = await response.json()

    if (data.authenticated && data.address) {
      $userAddress.set(data.address)
    } else {
      $userAddress.set(null)
    }
  } catch (error) {
    console.error('Session check failed:', error)
    $userAddress.set(null)
  }
}

/**
 * Connect wallet and authenticate with SIWE
 */
export async function connectWallet(): Promise<void> {
  // Check for ethereum provider
  const ethereum = (window as any).ethereum
  if (!ethereum) {
    $authError.set('No Ethereum wallet found. Please install MetaMask.')
    return
  }

  $isConnecting.set(true)
  $authError.set(null)

  try {
    // Request account access
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    const address = accounts[0] as string

    if (!address) {
      throw new Error('No account selected')
    }

    // Get nonce from server
    const nonceResponse = await fetch('/api/auth/nonce')
    const { nonce } = await nonceResponse.json()

    if (!nonce) {
      throw new Error('Failed to get nonce')
    }

    // Create SIWE message
    const domain = window.location.host
    const origin = window.location.origin
    const statement = 'Sign in to Arthur Oracle'
    const issuedAt = new Date().toISOString()

    // EIP-4361 formatted message
    const message = [
      `${domain} wants you to sign in with your Ethereum account:`,
      address,
      '',
      statement,
      '',
      `URI: ${origin}`,
      `Version: 1`,
      `Chain ID: 1`,
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`
    ].join('\n')

    // Request signature from wallet
    const signature = await ethereum.request({
      method: 'personal_sign',
      params: [message, address]
    })

    // Send to server for verification
    const verifyResponse = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message, signature })
    })

    const result = await verifyResponse.json()

    if (result.authenticated && result.address) {
      $userAddress.set(result.address)
    } else {
      throw new Error(result.error || 'Authentication failed')
    }
  } catch (error) {
    console.error('Connect wallet error:', error)
    $authError.set(error instanceof Error ? error.message : 'Connection failed')
  } finally {
    $isConnecting.set(false)
  }
}

/**
 * Disconnect wallet and clear session
 */
export async function disconnectWallet(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    $userAddress.set(null)
    $authError.set(null)
  }
}
