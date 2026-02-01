import { useStore } from '@nanostores/react'
import { $allOnline, $onlineCount, apis, $isChecking } from '../stores/api'

interface Props {
  showCount?: boolean
}

export function StatusBadge({ showCount = false }: Props) {
  const allOnline = useStore($allOnline)
  const onlineCount = useStore($onlineCount)
  const isChecking = useStore($isChecking)

  if (isChecking) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-400 ring-1 ring-slate-600/50">
        <span className="h-2 w-2 rounded-full bg-slate-500 animate-pulse"></span>
        Checking...
      </span>
    )
  }

  if (allOnline) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 ring-1 ring-green-500/30">
        <span className="h-2 w-2 rounded-full bg-green-500 pulse-green"></span>
        {showCount ? `${onlineCount}/${apis.length} Online` : 'API Online'}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 ring-1 ring-amber-500/30">
      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
      {showCount ? `${onlineCount}/${apis.length} Online` : 'Partial'}
    </span>
  )
}
