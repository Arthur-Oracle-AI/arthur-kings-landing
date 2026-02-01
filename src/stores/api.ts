import { atom, map, computed } from 'nanostores'

const API_BASE = 'https://arthur-oracle-api.laris.workers.dev'

export interface ApiInfo {
  id: string
  name: string
  description: string
}

export interface ApiStatus {
  status: 'checking' | 'online' | 'offline'
  latency?: number
  lastChecked?: number
}

// Static API information
export const apis: ApiInfo[] = [
  { id: 'ujic', name: 'UJIC', description: 'Unified Joint Intelligence Center' },
  { id: 'cm_command', name: 'CM Command', description: 'Chiang Mai Command Center' },
  { id: 'cmu_press', name: 'CMU Press', description: 'University Press Office' },
  { id: 'lp_hff', name: 'LP HFF', description: 'Lamphun Highlands Forest Fire' },
  { id: 'haze', name: 'Haze', description: 'Air Quality & Haze Monitoring' },
  { id: 'lp_ff', name: 'LP FF', description: 'Lamphun Forest Fire' },
  { id: 'carbon_one', name: 'Carbon One', description: 'Carbon Emissions Tracking' },
]

// Store for API statuses - a map of apiId -> status
export const $apiStatuses = map<Record<string, ApiStatus>>(() => {
  const initial: Record<string, ApiStatus> = {}
  for (const api of apis) {
    initial[api.id] = { status: 'checking' }
  }
  return initial
})

// Computed values
export const $onlineCount = computed($apiStatuses, (statuses) => {
  return Object.values(statuses).filter(s => s.status === 'online').length
})

export const $allOnline = computed($onlineCount, (count) => {
  return count === apis.length
})

export const $avgLatency = computed($apiStatuses, (statuses) => {
  const latencies = Object.values(statuses)
    .filter(s => s.latency !== undefined)
    .map(s => s.latency!)
  if (latencies.length === 0) return null
  return Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
})

// Loading state
export const $isChecking = atom(false)

// Actions
export async function checkApi(apiId: string): Promise<void> {
  const start = Date.now()
  try {
    const response = await fetch(`${API_BASE}/${apiId}?limit=1`)
    const latency = Date.now() - start
    if (response.ok) {
      $apiStatuses.setKey(apiId, {
        status: 'online',
        latency,
        lastChecked: Date.now()
      })
    } else {
      throw new Error('Not OK')
    }
  } catch {
    $apiStatuses.setKey(apiId, {
      status: 'offline',
      lastChecked: Date.now()
    })
  }
}

export async function checkAllApis(): Promise<void> {
  $isChecking.set(true)

  // Reset all to checking
  const resetStatuses: Record<string, ApiStatus> = {}
  for (const api of apis) {
    resetStatuses[api.id] = { status: 'checking' }
  }
  $apiStatuses.set(resetStatuses)

  // Check all in parallel
  await Promise.all(apis.map(api => checkApi(api.id)))

  $isChecking.set(false)
}

// Get status for a specific API
export function getApiStatus(apiId: string): ApiStatus {
  return $apiStatuses.get()[apiId] ?? { status: 'checking' }
}
