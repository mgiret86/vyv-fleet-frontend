import { create }  from 'zustand'
import { persist } from 'zustand/middleware'
import type { Amortization, AmortizationFormData } from '@/types'
import { get as apiGet, post as apiPost, put as apiPut } from '@/lib/api'

// ─── Interface du store ───────────────────────────────────────────
interface AmortizationState {
  amortizations: Amortization[]
  isLoading:     boolean
  error:         string | null

  fetchAmortizations:      ()                                                => Promise<void>
  getByVehicle:            (vehicleId: string)                               => Amortization[]
  getActiveByVehicle:      (vehicleId: string)                               => Amortization[]
  addAmortization:         (data: AmortizationFormData)                      => Promise<Amortization>
  updateAmortization:      (id: string, data: Partial<AmortizationFormData>) => Promise<void>
  closeAmortization:       (id: string, closedAt?: string)                   => Promise<void>
  closeByVehicle:          (vehicleId: string, closedAt?: string)            => Promise<void>

  // Calculs TCO
  getMonthlyDotation:     (vehicleId: string, month?: string) => number
  getTotalDotationToDate: (vehicleId: string)                 => number
  getVNC:                 (vehicleId: string)                 => number

  // Déclenchement auto crédit-bail
  triggerCreditBailAmortization: (
    vehicleId:       string,
    contractId:      string,
    residualValue:   number,
    contractEndDate: string,
  ) => Promise<Amortization | null>
}


export const useAmortizationStore = create<AmortizationState>()(
  persist(
    (set, get) => ({
      amortizations: [],
      isLoading:     false,
      error:         null,

      // ─── Fetch ──────────────────────────────────────────────────
      fetchAmortizations: async () => {
        set({ isLoading: true, error: null })
        try {
          const data = await apiGet<Amortization[]>('/amortizations')
          set({ amortizations: data, isLoading: false })
        } catch (err: unknown) {
          set({ error: err instanceof Error ? err.message : 'Erreur', isLoading: false })
        }
      },

      // ─── Getters ────────────────────────────────────────────────
      getByVehicle: (vehicleId) =>
        get().amortizations
          .filter((a) => a.vehicleId === vehicleId)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),

      getActiveByVehicle: (vehicleId) =>
        get().amortizations.filter(
          (a) => a.vehicleId === vehicleId && a.status === 'ACTIVE'
        ),

      // ─── Création ───────────────────────────────────────────────
      addAmortization: async (data) => {
        const amort = await apiPost<Amortization>('/amortizations', data)
        set((s) => ({ amortizations: [...s.amortizations, amort] }))
        return amort
      },

      // ─── Mise à jour ─────────────────────────────────────────────
      updateAmortization: async (id, data) => {
        const amort = await apiPut<Amortization>(`/amortizations/${id}`, data)
        set((s) => ({
          amortizations: s.amortizations.map((a) => a.id === id ? amort : a),
        }))
      },

      // ─── Clôture individuelle ────────────────────────────────────
      closeAmortization: async (id, _closedAt) => {
        const amort = await apiPut<Amortization>(`/amortizations/${id}/close`, {})
        set((s) => ({
          amortizations: s.amortizations.map((a) => a.id === id ? amort : a),
        }))
      },

      // ─── Clôture de tous les amortissements d'un véhicule ────────
      closeByVehicle: async (vehicleId, _closedAt) => {
        const targets = get().amortizations.filter(
          (a) => a.vehicleId === vehicleId && a.status === 'ACTIVE'
        )
        await Promise.all(
          targets.map((a) =>
            apiPut<Amortization>(`/amortizations/${a.id}/close`, {}).then((updated) =>
              set((s) => ({
                amortizations: s.amortizations.map((x) => x.id === a.id ? updated : x),
              }))
            )
          )
        )
      },

      // ─── TCO : dotation mensuelle (mois courant par défaut) ──────
      getMonthlyDotation: (vehicleId, month) => {
        const targetMonth = month ?? (() => {
          const d = new Date()
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        })()
        return get()
          .amortizations
          .filter((a) => a.vehicleId === vehicleId && a.status === 'ACTIVE')
          .reduce((sum, a) => {
            const entry = a.entries.find((e) => e.month === targetMonth)
            return sum + (entry?.dotation ?? 0)
          }, 0)
      },

      // ─── TCO : cumul total des dotations passées à date ──────────
      getTotalDotationToDate: (vehicleId) => {
        const today = new Date()
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
        return get()
          .amortizations
          .filter((a) => a.vehicleId === vehicleId)
          .reduce((sum, a) => {
            const passedEntries = a.entries.filter((e) => e.month <= currentMonth)
            return sum + passedEntries.reduce((s, e) => s + e.dotation, 0)
          }, 0)
      },

      // ─── VNC : montant restant à amortir ─────────────────────────
      getVNC: (vehicleId) => {
        const today = new Date()
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
        return get()
          .amortizations
          .filter((a) => a.vehicleId === vehicleId && a.status === 'ACTIVE')
          .reduce((sum, a) => {
            const lastPassedEntry = [...a.entries]
              .filter((e) => e.month <= currentMonth)
              .pop()
            return sum + (lastPassedEntry?.remaining ?? a.amount)
          }, 0)
      },

      // ─── Déclenchement auto crédit-bail ──────────────────────────
      triggerCreditBailAmortization: async (vehicleId, contractId, residualValue, contractEndDate) => {
        const existing = get().amortizations.find(
          (a) => a.source === 'CREDIT_BAIL' && a.sourceId === contractId
        )
        if (existing) return null

        const startDate = (() => {
          const d = new Date(contractEndDate)
          d.setDate(d.getDate() + 1)
          return d.toISOString().split('T')[0]
        })()

        const data: AmortizationFormData = {
          vehicleId,
          source:         'CREDIT_BAIL',
          sourceId:       contractId,
          reference:      `AMORT-CB-${contractId.slice(-6).toUpperCase()}`,
          label:          'Valeur résiduelle — Crédit-bail',
          amount:         residualValue,
          startDate,
          durationMonths: 12,
        }

        return get().addAmortization(data)
      },
    }),
    {
      name:    'vyv-amortizations',
      version: 2, // Incrémenté pour invalider le cache local (données mock)
    }
  )
)
