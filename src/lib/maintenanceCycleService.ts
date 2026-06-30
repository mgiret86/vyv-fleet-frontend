import { get, post, put, patch, del } from '@/lib/api'
import type { MaintenanceTemplate, VehicleMaintenanceAssignment } from '@/types'
import type { TemplateFormData } from '@/store/maintenanceTemplateStore'

const T = '/maintenance-cycles/templates'
const A = '/maintenance-cycles/assignments'

// ── Templates ──────────────────────────────────────────────────────

export const templateService = {
  getAll: () =>
    get<MaintenanceTemplate[]>(T),

  getById: (id: string) =>
    get<MaintenanceTemplate>(`${T}/${id}`),

  create: (data: TemplateFormData) =>
    post<MaintenanceTemplate>(T, data),

  update: (id: string, data: TemplateFormData) =>
    put<MaintenanceTemplate>(`${T}/${id}`, data),

  remove: (id: string) =>
    del<void>(`${T}/${id}`),
}

// ── Assignments ────────────────────────────────────────────────────

export const assignmentService = {
  getAll: (vehicleId?: string) =>
    get<VehicleMaintenanceAssignment[]>(A, vehicleId ? { vehicleId } : undefined),

  create: (payload: {
    vehicleId:        string
    templateId:       string
    lastDoneDate?:    string | null
    lastDoneMileage?: number | null
  }) =>
    post<VehicleMaintenanceAssignment>(A, payload),

  remove: (id: string) =>
    del<void>(`${A}/${id}`),

  toggle: (id: string) =>
    patch<VehicleMaintenanceAssignment>(`${A}/${id}/toggle`),

  recordIntervention: (id: string, payload: {
    doneDate:     string
    doneMileage?: number | null
  }) =>
    post<VehicleMaintenanceAssignment>(`${A}/${id}/intervention`, payload),
}
