
import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { relaisService, vehicleService } from '@/lib/dataService'
import type { RelaisMission, RelaisMissionStatus, Vehicle } from '@/types'

interface Props {
  mission: RelaisMission | null
  onClose: () => void
  onSaved: () => void
}

const STATUSES: RelaisMissionStatus[] = ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']
const STATUS_LABELS: Record<RelaisMissionStatus, string> = {
  PLANNED: 'Planifiee', ACTIVE: 'En cours', COMPLETED: 'Terminee', CANCELLED: 'Annulee',
}

export default function RelaisMissionModal({ mission, onClose, onSaved }: Props) {
  const isEdit = !!mission
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [relaisVehicles, setRelaisVehicles] = useState<Vehicle[]>([])
  const [saving, setSaving]  = useState(false)
  const [error, setError]    = useState<string | null>(null)

  const [form, setForm] = useState({
    relaisVehicleId:   mission?.relaisVehicleId   ?? '',
    replacedVehicleId: mission?.replacedVehicleId ?? '',
    startDate:         mission?.startDate ? mission.startDate.slice(0, 10) : '',
    estimatedEndDate:  mission?.estimatedEndDate ? mission.estimatedEndDate.slice(0, 10) : '',
    endDate:           mission?.endDate ? mission.endDate.slice(0, 10) : '',
    reason:            mission?.reason ?? '',
    status:            (mission?.status ?? 'PLANNED') as RelaisMissionStatus,
    notes:             mission?.notes ?? '',
  })

  useEffect(() => {
    vehicleService.list().then(r => setAllVehicles(r)).catch(() => {})
    relaisService.listVehicles().then(r => setRelaisVehicles(r.data.data)).catch(() => {})
  }, [])

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.relaisVehicleId || !form.replacedVehicleId || !form.startDate) {
      setError('Vehicule relais, vehicule remplace et date de debut sont obligatoires.')
      return
    }
    setSaving(true); setError(null)
    try {
      const payload = {
        ...form,
        startDate:        new Date(form.startDate).toISOString(),
        estimatedEndDate: form.estimatedEndDate ? new Date(form.estimatedEndDate).toISOString() : undefined,
        endDate:          form.endDate ? new Date(form.endDate).toISOString() : undefined,
        reason:           form.reason || undefined,
        notes:            form.notes || undefined,
      }
      if (isEdit) await relaisService.updateMission(mission.id, payload)
      else        await relaisService.createMission(payload)
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Modifier la mission' : 'Nouvelle mission relais'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vehicule relais *</label>
              <select value={form.relaisVehicleId} onChange={e => set('relaisVehicleId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selectionnez...</option>
                {relaisVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registration}{v.brand ? ` - ${v.brand}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vehicule remplace *</label>
              <select value={form.replacedVehicleId} onChange={e => set('replacedVehicleId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selectionnez...</option>
                {allVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registration}{v.agencyId ? ` (ag. ${v.agencyId.slice(-6)})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date de debut *</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fin estimee</label>
              <input type="date" value={form.estimatedEndDate} onChange={e => set('estimatedEndDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {isEdit && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date de fin reelle</label>
                <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                <select value={form.status} onChange={e => set('status', e.target.value as RelaisMissionStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Motif</label>
            <input type="text" value={form.reason} onChange={e => set('reason', e.target.value)}
              placeholder="Panne, entretien, accident..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Creer la mission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
