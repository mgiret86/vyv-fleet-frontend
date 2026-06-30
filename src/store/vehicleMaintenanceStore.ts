import { create } from 'zustand'
import type { VehicleMaintenanceAssignment, AssignmentStatus, MaintenanceTemplate } from '@/types'
import { assignmentService } from '@/lib/maintenanceCycleService'

// ── Helpers publics (utilisés dans VehicleMaintenanceTab) ──────────

export function computeAssignmentStatus(
  assignment:     VehicleMaintenanceAssignment,
  currentMileage: number,
  warningDays:    number = 30,
  warningKm:      number = 2000,
): AssignmentStatus {
  const { nextDueDate, nextDueMileage } = assignment
  if (!nextDueDate && !nextDueMileage) return 'UNKNOWN'

  const today = new Date()

  const dateOverdue = nextDueDate ? new Date(nextDueDate) < today : false
  const kmOverdue   = nextDueMileage != null ? currentMileage >= nextDueMileage : false
  if (dateOverdue || kmOverdue) return 'OVERDUE'

  const dateSoon = nextDueDate
    ? (new Date(nextDueDate).getTime() - today.getTime()) / 86400000 <= warningDays
    : false
  const kmSoon = nextDueMileage != null
    ? nextDueMileage - currentMileage <= warningKm
    : false
  if (dateSoon || kmSoon) return 'SOON'

  return 'OK'
}

// ── Types du store ─────────────────────────────────────────────────

interface VehicleMaintenanceState {
  assignments: VehicleMaintenanceAssignment[]
  loading:     boolean
  error:       string | null

  // Chargement
  fetchByVehicle: (vehicleId: string) => Promise<void>
  fetchAll:       () => Promise<void>

  // Lecture locale
  getByVehicle:  (vehicleId: string)  => VehicleMaintenanceAssignment[]
  getByTemplate: (templateId: string) => VehicleMaintenanceAssignment[]
  getAssignment: (id: string)         => VehicleMaintenanceAssignment | undefined

  // CRUD
  assign: (
    vehicleId:        string,
    templateId:       string,
    template:         MaintenanceTemplate,
    lastDoneDate?:    string | null,
    lastDoneMileage?: number | null,
  ) => Promise<VehicleMaintenanceAssignment>

  unassign:           (assignmentId: string) => Promise<void>
  toggleActive:       (assignmentId: string) => Promise<void>
  recordIntervention: (
    assignmentId: string,
    doneDate:     string,
    doneMileage:  number | null,
    template:     MaintenanceTemplate,
  ) => Promise<void>
}

// ── Store ──────────────────────────────────────────────────────────

export const useVehicleMaintenanceStore = create<VehicleMaintenanceState>()(
  (set, get) => ({
    assignments: [],
    loading:     false,
    error:       null,

    fetchByVehicle: async (vehicleId) => {
      set({ loading: true, error: null })
      try {
        const all = await assignmentService.getAll(vehicleId)
        // Fusionner avec les assignments existants des autres véhicules
        set((s) => ({
          assignments: [
            ...s.assignments.filter((a) => a.vehicleId !== vehicleId),
            ...all,
          ],
          loading: false,
        }))
      } catch (e) {
        set({ error: 'Erreur lors du chargement des affectations', loading: false })
      }
    },

    fetchAll: async () => {
      set({ loading: true, error: null })
      try {
        const assignments = await assignmentService.getAll()
        set({ assignments, loading: false })
      } catch (e) {
        set({ error: 'Erreur lors du chargement des affectations', loading: false })
      }
    },

    getByVehicle:  (vehicleId)  => get().assignments.filter((a) => a.vehicleId  === vehicleId),
    getByTemplate: (templateId) => get().assignments.filter((a) => a.templateId === templateId),
    getAssignment: (id)         => get().assignments.find((a) => a.id === id),

    assign: async (vehicleId, templateId, _template, lastDoneDate = null, lastDoneMileage = null) => {
      const assignment = await assignmentService.create({
        vehicleId, templateId, lastDoneDate, lastDoneMileage,
      })
      set((s) => ({ assignments: [...s.assignments, assignment] }))
      return assignment
    },

    unassign: async (assignmentId) => {
      await assignmentService.remove(assignmentId)
      set((s) => ({ assignments: s.assignments.filter((a) => a.id !== assignmentId) }))
    },

    toggleActive: async (assignmentId) => {
      const updated = await assignmentService.toggle(assignmentId)
      set((s) => ({
        assignments: s.assignments.map((a) => a.id === assignmentId ? updated : a),
      }))
    },

    recordIntervention: async (assignmentId, doneDate, doneMileage, _template) => {
      const updated = await assignmentService.recordIntervention(assignmentId, {
        doneDate, doneMileage,
      })
      set((s) => ({
        assignments: s.assignments.map((a) => a.id === assignmentId ? updated : a),
      }))
    },
  })
)
