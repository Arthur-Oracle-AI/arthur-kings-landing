import { useStore } from '@nanostores/react'
import { useEffect } from 'react'
import { $apiStatuses, apis, checkAllApis, type ApiStatus } from '../stores/api'

function StatusCell({ status }: { status: ApiStatus }) {
  if (status.status === 'checking') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-700/50 px-3 py-1 text-sm text-slate-400">
        <span className="h-2 w-2 rounded-full bg-slate-500 animate-pulse"></span>
        Checking...
      </span>
    )
  }

  if (status.status === 'online') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
        <span className="h-2 w-2 rounded-full bg-green-500"></span>
        Online
        {status.latency && (
          <span className="text-xs text-slate-500">{status.latency}ms</span>
        )}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-400">
      <span className="h-2 w-2 rounded-full bg-red-500"></span>
      Offline
    </span>
  )
}

export function ApiStatusTable() {
  const statuses = useStore($apiStatuses)

  useEffect(() => {
    checkAllApis()
  }, [])

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900">
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Source</th>
            <th className="hidden px-6 py-4 text-left text-sm font-semibold text-slate-300 sm:table-cell">Description</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {apis.map(api => (
            <tr key={api.id} className="transition hover:bg-slate-800/50">
              <td className="px-6 py-4">
                <span className="font-medium text-slate-100">{api.name}</span>
              </td>
              <td className="hidden px-6 py-4 text-slate-400 sm:table-cell">{api.description}</td>
              <td className="px-6 py-4 text-right">
                <StatusCell status={statuses[api.id] ?? { status: 'checking' }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
