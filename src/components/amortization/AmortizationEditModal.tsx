import { useState, useEffect } from 'react'
import { X, TrendingDown } from 'lucide-react'
import { useAmortizationStore } from '@/store/amortizationStore'
import type { Amortization } from '@/types'

interface Props {
  amortization: Amortization | null
  onClose: () => void
}

export default function AmortizationEditModal({ amortization, onClose }: Props) {
  const updateAmortization = useAmortizationStore((s) => s.updateAmortization)
  const closeAmortization  = useAmortizationStore((s) => s.closeAmortization)
  const fetchAmortizations = useAmortizationStore((s) => s.fetchAmortizations)

  const [label,     setLabel]     = useState('')
  const [amount,    setAmount]    = useState('')
  const [duration,  setDuration]  = useState('')
  const [reference, setReference] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [closing,   setClosing]   = useState(false)
  const [confirm,   setConfirm]   = useState(false)

  useEffect(() => {
    if (!amortization) return
    setLabel(amortization.label)
    setAmount(String(amortization.amount))
    setDuration(String(amortization.durationMonths))
    setReference(amortization.reference)
    setSaving(false)
    setClosing(false)
    setConfirm(false)
  }, [amortization])

  if (!amortization) return null

  const dotation = amount !== '' && duration !== ''
    ? (parseFloat(amount) / parseInt(duration)).toFixed(2)
    : '—'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !duration || !label.trim() || !reference.trim()) return
    setSaving(true)
    try {
      await updateAmortization(amortization!.id, {
        label:          label.trim(),
        amount:         parseFloat(amount),
        durationMonths: parseInt(duration),
        reference:      reference.trim(),
      })
      await fetchAmortizations()
      onClose()
    } catch (err) {
      console.error('Erreur mise à jour amortissement :', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleCloseAmort() {
    setClosing(true)
    try {
      await closeAmortization(amortization!.id)
      await fetchAmortizations()
      onClose()
    } catch (err) {
      console.error('Erreur clôture amortissement :', err)
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
         role="dialog" aria-modal="true">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/60">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-violet-600" />
            <h2 className="text-base font-semibold text-gray-900">Modifier l'amortissement</h2>
          </div>
          <button onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">

          {/* Infos fixes */}
          <div className="rounded-xl bg-violet-50/60 border border-violet-100 px-4 py-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Véhicule</span>
              <span className="font-medium text-gray-700">{amortization.vehicleId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Source</span>
              <span className="font-medium text-gray-700">{amortization.source === 'MAINTENANCE' ? 'Maintenance' : 'Crédit-bail'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Début</span>
              <span className="font-medium text-gray-700">
                {new Date(amortization.startDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Statut</span>
              <span className={`font-semibold ${amortization.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400'}`}>
                {amortization.status === 'ACTIVE' ? 'Actif' : 'Clôturé'}
              </span>
            </div>
          </div>

          {/* Libellé */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Libellé <span className="text-red-500">*</span>
            </label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
              disabled={amortization.status === 'CLOSED'}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-50 disabled:text-gray-400" />
          </div>

          {/* Référence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence comptable <span className="text-red-500">*</span>
            </label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
              disabled={amortization.status === 'CLOSED'}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-50 disabled:text-gray-400" />
          </div>

          {/* Montant + Durée */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant (€) <span className="text-red-500">*</span>
              </label>
              <input type="number" min={0.01} step={0.01} value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={amortization.status === 'CLOSED'}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-50 disabled:text-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée (mois) <span className="text-red-500">*</span>
              </label>
              <input type="number" min={1} max={120} step={1} value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={amortization.status === 'CLOSED'}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-50 disabled:text-gray-400" />
            </div>
          </div>

          {amount !== '' && duration !== '' && parseFloat(amount) > 0 && parseInt(duration) > 0 && (
            <p className="text-xs text-violet-700 bg-violet-100 rounded-lg px-3 py-2">
              Dotation mensuelle : <strong>{dotation} €</strong> sur {duration} mois
            </p>
          )}

          {/* Boutons */}
          <div className="flex items-center justify-between pt-2 gap-3">

            {amortization.status === 'ACTIVE' && (
              confirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-medium">Confirmer la clôture ?</span>
                  <button type="button" onClick={handleCloseAmort} disabled={closing}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                    {closing ? 'Clôture…' : 'Oui, clôturer'}
                  </button>
                  <button type="button" onClick={() => setConfirm(false)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    Annuler
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirm(true)}
                  className="rounded-lg border border-red-200 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                  Clôturer
                </button>
              )
            )}

            {amortization.status === 'CLOSED' && (
              <span className="text-xs text-gray-400 italic">Amortissement clôturé — lecture seule</span>
            )}

            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              {amortization.status === 'ACTIVE' && (
                <button type="submit" disabled={saving}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50">
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              )}
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}