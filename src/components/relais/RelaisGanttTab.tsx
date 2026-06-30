
import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { relaisService } from '@/lib/dataService'
import type { RelaisMission, RelaisMissionStatus } from '@/types'

const SC: Record<RelaisMissionStatus, string> = {
  PLANNED: 'bg-yellow-400', ACTIVE: 'bg-green-500',
  COMPLETED: 'bg-gray-400', CANCELLED: 'bg-red-400',
}
const SL: Record<RelaisMissionStatus, string> = {
  PLANNED: 'Planifiee', ACTIVE: 'En cours',
  COMPLETED: 'Terminee', CANCELLED: 'Annulee',
}

export default function RelaisGanttTab() {
  const [missions, setMissions] = useState<RelaisMission[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [offset, setOffset]     = useState(0)

  useEffect(() => {
    relaisService.listMissions()
      .then(r => setMissions(r.data.data))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [])

  const days = useMemo(() => {
    const now = new Date()
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1
    const start = new Date(now)
    start.setDate(now.getDate() - dow + offset * 7)
    start.setHours(0, 0, 0, 0)
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i); return d
    })
  }, [offset])

  const rangeEnd = useMemo(() => {
    const d = new Date(days[13]); d.setHours(23, 59, 59, 999); return d
  }, [days])

  const visible = useMemo(() => missions.filter(m => {
    const s = new Date(m.startDate)
    const e = m.endDate ? new Date(m.endDate) : m.estimatedEndDate ? new Date(m.estimatedEndDate) : new Date(s.getTime() + 86400000)
    return s <= rangeEnd && e >= days[0]
  }), [missions, days, rangeEnd])

  const bar = (m: RelaisMission) => {
    const r0 = days[0].getTime(), r1 = rangeEnd.getTime(), rl = r1 - r0
    const ms = Math.max(new Date(m.startDate).getTime(), r0)
    const me = Math.min(
      m.endDate ? new Date(m.endDate).getTime() :
      m.estimatedEndDate ? new Date(m.estimatedEndDate).getTime() :
      new Date(m.startDate).getTime() + 86400000, r1)
    return { left: `${((ms - r0) / rl) * 100}%`, width: `${Math.max(((me - ms) / rl) * 100, 1)}%` }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
  if (error)   return <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg text-sm"><AlertCircle className="h-4 w-4" />{error}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setOffset(o => o - 1)} className="p-2 rounded-lg border hover:bg-gray-50">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-gray-700">
          {days[0].toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
          {' - '}
          {days[13].toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => setOffset(o => o + 1)} className="p-2 rounded-lg border hover:bg-gray-50">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-4 text-xs">
        {Object.entries(SL).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-sm ${SC[k as RelaisMissionStatus]}`} />
            <span className="text-gray-600">{v}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <div className="flex border-b border-gray-200">
          <div className="w-40 shrink-0 px-3 py-2 text-xs font-medium text-gray-500 border-r border-gray-200">Vehicule</div>
          <div className="flex-1 grid" style={{ gridTemplateColumns: 'repeat(14, 1fr)' }}>
            {days.map((d, i) => {
              const today = d.toDateString() === new Date().toDateString()
              return (
                <div key={i} className={`px-1 py-2 text-center text-xs border-r border-gray-100 last:border-0 ${today ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-500'}`}>
                  <div>{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                  <div>{d.getDate()}</div>
                </div>
              )
            })}
          </div>
        </div>
        {visible.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500">Aucune mission sur cette periode.</div>
        ) : visible.map(m => (
          <div key={m.id} className="flex border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <div className="w-40 shrink-0 px-3 py-3 border-r border-gray-200">
              <p className="font-mono text-xs font-semibold text-gray-900 truncate">{m.relaisVehicle?.registration ?? '-'}</p>
              <p className="text-xs text-gray-400 truncate">{m.replacedVehicle?.agency?.name ?? ''}</p>
            </div>
            <div className="flex-1 relative h-12">
              <div className={`absolute top-2 bottom-2 rounded ${SC[m.status]} opacity-80 flex items-center px-2 overflow-hidden`}
                style={bar(m)}
                title={`${m.relaisVehicle?.registration} -> ${m.replacedVehicle?.registration}`}>
                <span className="text-xs text-white font-medium truncate">{m.replacedVehicle?.registration}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
