import { useState, useEffect } from 'react'
import { Plus, Loader2, AlertCircle, Pencil, Trash2, MapPin, Truck, UserPlus, X } from 'lucide-react'
import { relaisService } from '@/lib/dataService'
import type { RelaisDepot, Vehicle } from '@/types'
import RelaisDepotModal from './RelaisDepotModal'

// ─── Modale d'affectation ────────────────────────────────────────
function AssignVehicleModal({
  depot,
  onClose,
  onSaved,
}: {
  depot: RelaisDepot
  onClose: () => void
  onSaved: () => void
}) {
  const [vehicles, setVehicles]   = useState<Vehicle[]>([])
  const [selected, setSelected]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    relaisService.listVehicles()
      .then(r => {
        // Exclure les véhicules déjà affectés à ce dépôt
        const assignedIds = new Set((depot.vehicles ?? []).map(v => v.id))
        setVehicles(r.data.data.filter(v => !assignedIds.has(v.id)))
      })
      .catch(() => setError('Impossible de charger les véhicules.'))
  }, [depot])

  const handleAssign = async () => {
    if (!selected) return
    setSaving(true); setError(null)
    try {
      await relaisService.assignVehicle(depot.id, selected)
      onSaved()
    } catch {
      setError("Erreur lors de l'affectation.")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Affecter un véhicule</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500">Dépôt : <span className="font-medium text-gray-700">{depot.name}</span></p>
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner un véhicule…</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.registration}{v.brand ? ` — ${v.brand}` : ''}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-3">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button onClick={handleAssign} disabled={!selected || saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Affecter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Carte dépôt ─────────────────────────────────────────────────
function DepotCard({
  depot,
  onEdit,
  onDelete,
  onAssign,
  onUnassign,
}: {
  depot: RelaisDepot
  onEdit: () => void
  onDelete: () => void
  onAssign: () => void
  onUnassign: (vehicleId: string) => void
}) {
  const vehicles = depot.vehicles ?? []

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 hover:shadow-md transition-shadow">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-lg"><MapPin className="h-4 w-4 text-blue-600" /></div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{depot.name}</p>
            {depot.city && <p className="text-xs text-gray-500">{depot.zipCode} {depot.city}</p>}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit}   className="text-gray-400 hover:text-blue-600 p-1"><Pencil className="h-4 w-4" /></button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600 p-1"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Infos */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>
          <span className="text-gray-400">Capacité</span>
          <p className="font-medium text-gray-900">
            {vehicles.length} / {depot.capacity} véhicule{depot.capacity > 1 ? 's' : ''}
          </p>
        </div>
        {depot.agency && (
          <div>
            <span className="text-gray-400">Agence</span>
            <p className="font-medium text-gray-900">{depot.agency.name}</p>
          </div>
        )}
        {depot.phone && (
          <div>
            <span className="text-gray-400">Tél</span>
            <p className="font-medium text-gray-900">{depot.phone}</p>
          </div>
        )}
      </div>

      {/* Véhicules affectés */}
      <div className="pt-2 border-t border-gray-100 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Truck className="h-3 w-3" /> Véhicules affectés
          </p>
          {vehicles.length < depot.capacity && (
            <button onClick={onAssign}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
              <UserPlus className="h-3 w-3" /> Affecter
            </button>
          )}
        </div>
        {vehicles.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Aucun véhicule affecté</p>
        ) : (
          <ul className="space-y-1">
            {vehicles.map(v => (
              <li key={v.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1">
                <span className="text-xs font-mono font-medium text-gray-800">{v.registration}</span>
                <button onClick={() => onUnassign(v.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Missions */}
      {depot.missions && depot.missions.length > 0 && (
        <div className="text-xs text-gray-500">
          {depot.missions.length} mission{depot.missions.length > 1 ? 's' : ''} associée{depot.missions.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

// ─── Tab principal ────────────────────────────────────────────────
export default function RelaisDepotsTab() {
  const [depots, setDepots]         = useState<RelaisDepot[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [showModal, setShowModal]   = useState(false)
  const [editDepot, setEditDepot]   = useState<RelaisDepot | null>(null)
  const [assignDepot, setAssignDepot] = useState<RelaisDepot | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try { setDepots((await relaisService.listDepots()).data.data) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce dépôt ?')) return
    await relaisService.deleteDepot(id); load()
  }

  const handleUnassign = async (depotId: string, vehicleId: string) => {
    if (!confirm('Retirer ce véhicule du dépôt ?')) return
    await relaisService.unassignVehicle(depotId, vehicleId); load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditDepot(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> Nouveau dépôt
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
      ) : error ? (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4" />{error}
        </div>
      ) : depots.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">Aucun dépôt enregistré.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {depots.map(d => (
            <DepotCard
              key={d.id}
              depot={d}
              onEdit={() => { setEditDepot(d); setShowModal(true) }}
              onDelete={() => handleDelete(d.id)}
              onAssign={() => setAssignDepot(d)}
              onUnassign={vehicleId => handleUnassign(d.id, vehicleId)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <RelaisDepotModal
          depot={editDepot}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
        />
      )}

      {assignDepot && (
        <AssignVehicleModal
          depot={assignDepot}
          onClose={() => setAssignDepot(null)}
          onSaved={() => { setAssignDepot(null); load() }}
        />
      )}
    </div>
  )
}
