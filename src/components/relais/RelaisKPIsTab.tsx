
import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, Truck, Activity, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { relaisService } from '@/lib/dataService'
import type { RelaisKPIs } from '@/types'

export default function RelaisKPIsTab() {
  const [kpis, setKpis]       = useState<RelaisKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    relaisService.getKPIs()
      .then(r => setKpis(r.data.data))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
  if (error)   return <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg text-sm"><AlertCircle className="h-4 w-4" />{error}</div>
  if (!kpis)   return null

  const cards = [
    { label: 'Vehicules relais',  value: kpis.totalRelais,                         icon: Truck,          color: 'text-blue-600 bg-blue-50'   },
    { label: 'Missions actives',  value: kpis.activeMissions,                      icon: Activity,       color: 'text-green-600 bg-green-50'  },
    { label: "Taux d'occupation", value: kpis.occupancyRate.toFixed(1) + ' %',     icon: TrendingUp,     color: 'text-purple-600 bg-purple-50' },
    { label: 'Duree moyenne',     value: kpis.avgDurationDays.toFixed(1) + ' j',   icon: Clock,          color: 'text-orange-600 bg-orange-50' },
    { label: 'Missions en retard',value: kpis.lateMissions,                        icon: AlertTriangle,  color: kpis.lateMissions > 0 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className={`inline-flex p-2 rounded-lg ${c.color.split(' ')[1]}`}>
              <c.icon className={`h-5 w-5 ${c.color.split(' ')[0]}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
            </div>
          </div>
        ))}
      </div>
      {kpis.topVehicles.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Vehicules les plus sollicites</h3>
          <div className="space-y-2">
            {kpis.topVehicles.slice(0, 5).map((v, i) => {
              const max = kpis.topVehicles[0]._count.relaisVehicleId
              const cnt = v._count.relaisVehicleId
              const pct = max > 0 ? (cnt / max) * 100 : 0
              return (
                <div key={v.relaisVehicleId} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-6 text-right">{cnt}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
