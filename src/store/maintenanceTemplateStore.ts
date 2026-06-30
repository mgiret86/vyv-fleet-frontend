import { create } from 'zustand'
import type {
  MaintenanceTemplate,
  MaintenanceChecklistItem,
  MaintenanceType,
  MaintenanceTriggerType,
} from '@/types'
import { templateService } from '@/lib/maintenanceCycleService'

// ── Types ──────────────────────────────────────────────────────────

export interface TemplateFormData {
  name:                 string
  description:          string
  type:                 MaintenanceType
  triggerType:          MaintenanceTriggerType
  triggerKm:            number | null
  triggerDays:          number | null
  estimatedCost:        number | null
  applicableCategories: string[]
  isMandatory:          boolean
  checklist:            Omit<MaintenanceChecklistItem, 'id'>[]
}

interface MaintenanceTemplateState {
  templates:  MaintenanceTemplate[]
  loading:    boolean
  error:      string | null

  // Chargement
  fetchTemplates: () => Promise<void>

  // CRUD
  addTemplate:    (data: TemplateFormData) => Promise<MaintenanceTemplate>
  updateTemplate: (id: string, data: TemplateFormData) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  getTemplate:    (id: string) => MaintenanceTemplate | undefined
}

// ── Store ──────────────────────────────────────────────────────────

export const useMaintenanceTemplateStore = create<MaintenanceTemplateState>()(
  (set, get) => ({
    templates: [],
    loading:   false,
    error:     null,

    fetchTemplates: async () => {
      set({ loading: true, error: null })
      try {
        const templates = await templateService.getAll()
        set({ templates, loading: false })
      } catch (e) {
        set({ error: 'Erreur lors du chargement des cycles', loading: false })
      }
    },

    addTemplate: async (data) => {
      const template = await templateService.create(data)
      set((s) => ({ templates: [...s.templates, template] }))
      return template
    },

    updateTemplate: async (id, data) => {
      const updated = await templateService.update(id, data)
      set((s) => ({
        templates: s.templates.map((t) => t.id === id ? updated : t),
      }))
    },

    deleteTemplate: async (id) => {
      await templateService.remove(id)
      set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }))
    },

    getTemplate: (id) => get().templates.find((t) => t.id === id),
  })
)
