import { create } from 'zustand'
import type { VehicleCategory } from '@/types'
import { get as apiGet, post, put, del } from '@/lib/api'

export const CATEGORY_COLORS = [
  { key: 'violet', label: 'Violet', bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  { key: 'blue',   label: 'Bleu',   bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  { key: 'green',  label: 'Vert',   bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  { key: 'orange', label: 'Orange', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  { key: 'red',    label: 'Rouge',  bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  { key: 'yellow', label: 'Jaune',  bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  { key: 'pink',   label: 'Rose',   bg: 'bg-pink-100',   text: 'text-pink-700',   dot: 'bg-pink-500'   },
  { key: 'teal',   label: 'Teal',   bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-500'   },
  { key: 'gray',   label: 'Gris',   bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-400'   },
] as const

export type CategoryColorKey = typeof CATEGORY_COLORS[number]['key']

export function getCategoryColor(colorKey: string) {
  return CATEGORY_COLORS.find((c) => c.key === colorKey) ?? CATEGORY_COLORS[8]
}

// Génère le slug name depuis le label (identique à l'ancien toCode)
function toName(label: string): string {
  return label
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export interface CategoryFormData {
  label:   string
  color:   string
  vatRate: number
  order:   number
}

interface VehicleCategoryState {
  categories:      VehicleCategory[]
  loading:         boolean
  error:           string | null
  fetchCategories: () => Promise<void>
  addCategory:     (data: CategoryFormData) => Promise<void>
  updateCategory:  (id: string, data: CategoryFormData) => Promise<void>
  deleteCategory:  (id: string) => Promise<void>
  getById:         (id: string) => VehicleCategory | undefined
  getActive:       () => VehicleCategory[]
}

export const useVehicleCategoryStore = create<VehicleCategoryState>()((set, get) => ({
  categories: [],
  loading:    false,
  error:      null,

  fetchCategories: async () => {
    set({ loading: true, error: null })
    try {
      const data = await apiGet<VehicleCategory[]>('/vehicle-categories')
      set({ categories: data })
    } catch (e) {
      set({ error: (e as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  addCategory: async (data) => {
    const created = await post<VehicleCategory>('/vehicle-categories', {
      name:    toName(data.label),
      label:   data.label.trim(),
      color:   data.color,
      vatRate: data.vatRate,
      order:   data.order,
    })
    set((s) => ({ categories: [...s.categories, created] }))
  },

  updateCategory: async (id, data) => {
    const updated = await put<VehicleCategory>(`/vehicle-categories/${id}`, {
      name:    toName(data.label),
      label:   data.label.trim(),
      color:   data.color,
      vatRate: data.vatRate,
      order:   data.order,
    })
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? updated : c)),
    }))
  },

  deleteCategory: async (id) => {
    await del(`/vehicle-categories/${id}`)
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
  },

  getById:   (id) => get().categories.find((c) => c.id === id),
  getActive: ()   => get().categories
    .filter((c) => c.isActive)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.label.localeCompare(b.label)),
}))
