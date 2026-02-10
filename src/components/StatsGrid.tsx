import { useStore } from '@nanostores/react'
import { $avgLatency, apis } from '../stores/api'

interface StatCardProps {
  icon: string
  value: string
  label: string
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="text-center">
      <div className="text-3xl">{icon}</div>
      <div className="mt-2 text-4xl font-bold text-slate-100">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  )
}

export function StatsGrid() {
  const avgLatency = useStore($avgLatency)

  const stats = [
    { value: String(apis.length), label: 'Data Sources', icon: '📡' },
    { value: '18K+', label: 'Posts Indexed', icon: '📋' },
    { value: '150+', label: 'Days of Data', icon: '📅' },
    { value: avgLatency ? `${avgLatency}ms` : '<50ms', label: 'Avg Latency', icon: '⚡' },
  ]

  return (
    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
      {stats.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </div>
  )
}
