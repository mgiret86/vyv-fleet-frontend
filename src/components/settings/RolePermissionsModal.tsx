import { useState } from 'react'
import { X, Shield } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { roleService } from '@/lib/services'
import PermissionsMatrix from '@/components/settings/PermissionsMatrix'
import type { Permissions } from '@/types/settings'
import type { ApiRole } from '@/lib/services'

interface Props {
  role: ApiRole
  onClose: () => void
  onSaved?: () => void
}

export default function RolePermissionsModal({ role, onClose, onSaved }: Props) {
  const { addToast } = useToastStore()
  const [perms, setPerms]   = useState<Permissions>({ ...role.permissions } as unknown as Permissions)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await roleService.update(role.id, { permissions: perms } as unknown as Partial<ApiRole>)
      addToast({ type: 'success', message: 'Permissions mises à jour.' })
      onSaved?.()
      onClose()
    } catch {
      addToast({ type: 'error', message: 'Erreur lors de la mise à jour.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col border border-gray-100"
        style={{ maxHeight: 'min(92vh, 820px)' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-violet-600" />
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Modifier : {role.name}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {role.description || "Gestion des droits d'accès"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Contenu scrollable si nécessaire ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          <PermissionsMatrix permissions={perms} onChange={setPerms} />
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  )
}
