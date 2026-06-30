
import { useState, useEffect } from 'react'
import { Plus, Search, Filter, ChevronDown, Loader2, AlertCircle, Pencil, Trash2, Eye } from 'lucide-react'
import { relaisService } from '@/lib/dataService'
import type { RelaisMission, RelaisMissionStatus } from '@/types'
import RelaisMissionModal from './RelaisMissionModal'
import RelaisMissionDetail from './RelaisMissionDetail'

const STATUS_LABELS: Record<RelaisMissionStatus, string> = {
  PLANNED: 'Planifiee', ACTIVE: 'En cours', COMPLETED: 'Terminee', CANCELLED: 'Annulee',
}
const STATUS_COLORS: Record<RelaisMissionStatus, string> = {
  PLANNED: 'bg-yellow-100 text-yellow-800', ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-700',   CANCELLED: 'bg-red-100 text-red-700',
}

export default function RelaisMissionsTab() {
  const [missions, setMissions]         = useState<RelaisMission[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal]       = useState(false)
  const [editMission, setEditMission]   = useState<RelaisMission | null>(null)
  const [detailId, setDetailId]         = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await relaisService.listMissions(filterStatus ? { status: filterStatus } : undefined)
      setMissions(res.data.data)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filterStatus])

  const filtered = missions.filter(m => {
    const q = search.toLowerCase()
    return (m.relaisVehicle?.registration?.toLowerCase().includes(q) ||
            m.replacedVehicle?.registration?.toLowerCase().includes(q) ||
            m.reason?.toLowerCase().includes(q))
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette mission ?')) return
    await relaisService.deleteMission(id); load()
  }

  if (detailId) return (
    <RelaisMissionDetail missionId={detailId} onBack={() => { setDetailId(null); load() }} />
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Immatriculation, motif..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <button onClick={() => { setEditMission(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />Nouvelle mission
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
      ) : error ? (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">Aucune mission trouvee.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>{['Relais','Remplace','Agence','Debut','Fin est.','Statut','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium">{m.relaisVehicle?.registration ?? '-'}</td>
                  <td className="px-4 py-3 font-mono">{m.replacedVehicle?.registration ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{m.replacedVehicle?.agency?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(m.startDate).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.estimatedEndDate ? new Date(m.estimatedEndDate).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                      {STATUS_LABELS[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setDetailId(m.id)} className="text-gray-400 hover:text-blue-600"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => { setEditMission(m); setShowModal(true) }} className="text-gray-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(m.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <RelaisMissionModal mission={editMission}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }} />
      )}
    </div>
  )
}
