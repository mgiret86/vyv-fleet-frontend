
import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { relaisService, agencyService } from '@/lib/dataService'
import type { RelaisDepot, Agency } from '@/types'

interface Props {
  depot: RelaisDepot | null
  onClose: () => void
  onSaved: () => void
}

export default function RelaisDepotModal({ depot, onClose, onSaved }: Props) {
  const isEdit = !!depot
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const [form, setForm] = useState({
    name:      depot?.name      ?? '',
    address:   depot?.address   ?? '',
    zipCode:   depot?.zipCode   ?? '',
    city:      depot?.city      ?? '',
    phone:     depot?.phone     ?? '',
    capacity:  depot?.capacity  ? String(depot.capacity) : '1',
    agencyId:  depot?.agencyId  ?? '',
  })

  useEffect(() => {
    agencyService.list().then(r => setAgencies(r)).catch(() => {})
  }, [])

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.city) {
      setError('Le nom et la ville sont obligatoires.')
      return
    }
    setSaving(true); setError(null)
    try {
      const payload = {
        name:      form.name,
        address:   form.address  || undefined,
        zipCode:   form.zipCode  || undefined,
        city:      form.city,
        phone:     form.phone    || undefined,
        capacity:  parseInt(form.capacity, 10) || 1,
        agencyId:  form.agencyId  || undefined,
      }
      if (isEdit) await relaisService.updateDepot(depot.id, payload)
      else        await relaisService.createDepot(payload)
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
            {isEdit ? 'Modifier le depot' : 'Nouveau depot relais'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom du depot *</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Ex: Depot central Bordeaux"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Adresse</label>
            <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
              placeholder="Numero et rue"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Code postal</label>
              <input type="text" value={form.zipCode} onChange={e => set('zipCode', e.target.value)}
                placeholder="33000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Ville *</label>
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
                placeholder="Bordeaux"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Telephone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="05 56 ..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Capacite (vehicules)</label>
              <input type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Agence rattachee</label>
            <select value={form.agencyId} onChange={e => set('agencyId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Aucune</option>
              {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Creer le depot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
