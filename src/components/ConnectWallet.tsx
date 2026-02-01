/**
 * ConnectWallet Component
 *
 * React component for SIWE wallet connection.
 * Shows connect button when not authenticated, address when authenticated.
 */

import { useStore } from '@nanostores/react'
import { useEffect } from 'react'
import {
  $userAddress,
  $isConnecting,
  $authError,
  $shortAddress,
  checkSession,
  connectWallet,
  disconnectWallet
} from '../stores/auth'

export default function ConnectWallet() {
  const address = useStore($userAddress)
  const isConnecting = useStore($isConnecting)
  const error = useStore($authError)
  const shortAddress = useStore($shortAddress)

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [])

  // Connected state - show address and disconnect button
  if (address) {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 ring-1 ring-emerald-500/30">
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          {shortAddress}
        </span>
        <button
          onClick={disconnectWallet}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 ring-1 ring-slate-700 transition hover:bg-slate-700 hover:text-slate-100 cursor-pointer"
        >
          Disconnect
        </button>
      </div>
    )
  }

  // Not connected - show connect button
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="rounded-xl bg-violet-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-violet-400 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isConnecting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Connecting...
          </span>
        ) : (
          'Connect Wallet'
        )}
      </button>
      {error && (
        <p className="text-sm text-red-400 max-w-xs text-center">{error}</p>
      )}
    </div>
  )
}
