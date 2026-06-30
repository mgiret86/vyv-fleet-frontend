
import { useState, useEffect } from 'react'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, XCircle, Pencil } from 'lucide-react'
import { relaisService } from '@/lib/dataService'
import type { RelaisMission, RelaisMissionStatus } from '@/types'
import RelaisMissionModal from './RelaisMissionModal'

interface Props {
  missionId: string
  onBack: () => void
}

const SC: Record<RelaisMissionStatus, string> = {
  PLANNED:   'bg-yellow-100 text-yellow-800',
  ACTIVE:    'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
}
const SL: Record<RelaisMissionStatus, string> = {
  PLANNED: 'Planifiee', ACTIVE: 'En cours', COMPLETED: 'Terminee', CANCELLED: 'Annulee',
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}

export default function RelaisMissionDetail({ missionId, onBack }: Props) {
  const [mission, setMission] = useState<RelaisMission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [closing, setClosing]   = useState(false)

  const load = () => {
    setLoading(true)
    relaisService.getMission(missionId)
      .then(r => setMission(r.data.data))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [missionId])

  const handleClose = async (status: 'COMPLETED' | 'CANCELLED') => {
    if (!mission) return
    const label = status === 'COMPLETED' ? 'Terminer' : 'Annuler'
    if (!confirm(`${label} cette mission ?`)) return
    setClosing(true)
    try {
      await relaisService.updateMission(mission.id, {
        status,
        endDate: status === 'COMPLETED' ? new Date().toISOString() : undefined,
      })
      load()
    } finally { setClosing(false) }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
  if (error)   return <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg text-sm"><AlertCircle className="h-4 w-4" />{error}</div>
  if (!mission) return null

  const isActive = mission.status === 'ACTIVE' || mission.status === 'PLANNED'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />Retour aux missions
        </button>
        <div className="flex gap-2">
          {isActive && (
            <>
              <button onClick={() => handleClose('COMPLETED')} disabled={closing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60">
                <CheckCircle className="h-3.5 w-3.5" />Terminer
              </button>
              <button onClick={() => handleClose('CANCELLED')} disabled={closing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60">
                <XCircle className="h-3.5 w-3.5" />Annuler
              </button>
            </>
          )}
          <button onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Pencil className="h-3.5 w-3.5" />Modifier
          </button>
        </div>
      </div>

      {/* Statut */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${SC[mission.status]}`}>
          {SL[mission.status]}
        </span>
        <span className="text-xs text-gray-400">
          Mission #{mission.id.slice(-8).toUpperCase()}
        </span>
      </div>

      {/* Cards vehicules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Vehicule relais</p>
          <p className="text-xl font-mono font-bold text-gray-900">{mission.relaisVehicle?.registration ?? '-'}</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Marque"  value={mission.relaisVehicle?.brand} />
            <Field label="Modele"  value={mission.relaisVehicle?.model} />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Vehicule remplace</p>
          <p className="text-xl font-mono font-bold text-gray-900">{mission.replacedVehicle?.registration ?? '-'}</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Agence" value={mission.replacedVehicle?.agency?.name} />
            <Field label="Modele" value={mission.replacedVehicle?.model} />
          </div>
        </div>
      </div>

      {/* Dates et details */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Informations</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Date de debut"    value={new Date(mission.startDate).toLocaleDateString('fr-FR')} />
          <Field label="Fin estimee"      value={mission.estimatedEndDate ? new Date(mission.estimatedEndDate).toLocaleDateString('fr-FR') : null} />
          <Field label="Fin reelle"       value={mission.endDate ? new Date(mission.endDate).toLocaleDateString('fr-FR') : null} />
          <Field label="Motif"            value={mission.reason} />
        </div>
        {mission.notes && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{mission.notes}</p>
          </div>
        )}
      </div>

      {showEdit && (
        <RelaisMissionModal
          mission={mission}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load() }} />
      )}
    </div>
  )
}
