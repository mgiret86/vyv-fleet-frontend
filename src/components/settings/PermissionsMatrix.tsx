import type { Permissions, AppModule, PermissionAction } from '@/types/settings'

const MODULES: { key: AppModule; label: string }[] = [
  { key: 'dashboard',   label: 'Tableau de bord' },
  { key: 'vehicles',    label: 'Véhicules'        },
  { key: 'maintenance', label: 'Maintenance'      },
  { key: 'relais',       label: 'Véhicules Relais' },
  { key: 'compliance',  label: 'Conformité'       },
  { key: 'incidents',   label: 'Incidents'        },
  { key: 'drivers',     label: 'Conducteurs'      },
  { key: 'fuel',        label: 'Carburant'        },
  { key: 'equipment',   label: 'Équipements'      },
  { key: 'finance',        label: 'Finance'          },
  { key: 'substitutions', label: 'Mouvements'       },
  { key: 'settings',     label: 'Paramètres'       },
]

const ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: 'view',   label: 'Voir'      },
  { key: 'create', label: 'Créer'     },
  { key: 'edit',   label: 'Modifier'  },
  { key: 'delete', label: 'Supprimer' },
]

interface PermissionsMatrixProps {
  permissions: Permissions
  onChange: (updated: Permissions) => void
  disabled?: boolean
}

export default function PermissionsMatrix({
  permissions,
  onChange,
  disabled = false,
}: PermissionsMatrixProps) {
  const toggle = (modKey: AppModule, actionKey: PermissionAction) => {
    if (disabled) return
    const current = permissions[modKey]
    let next = { ...current }

    if (actionKey === 'view') {
      const viewToggled = !current.view
      next = {
        view:   viewToggled,
        create: viewToggled ? current.create : false,
        edit:   viewToggled ? current.edit   : false,
        delete: viewToggled ? current.delete : false,
      }
    } else {
      const actionToggled = !current[actionKey]
      next = {
        ...current,
        [actionKey]: actionToggled,
        view: actionToggled ? true : current.view,
      }
    }
    onChange({ ...permissions, [modKey]: next })
  }

  return (
    <div className="w-full">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-100">
            <th className="text-left pb-3 pr-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest w-40">
              Module
            </th>
            {ACTIONS.map((action) => (
              <th
                key={action.key}
                className="text-center pb-3 px-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest"
              >
                {action.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {MODULES.map((mod, idx) => {
            const isEven = idx % 2 === 0
            return (
              <tr
                key={mod.key}
                className={`${isEven ? 'bg-white' : 'bg-gray-50/60'} hover:bg-violet-50/40 transition-colors`}
              >
                <td className="py-2.5 pr-4 text-sm font-semibold text-gray-700">
                  {mod.label}
                </td>
                {ACTIONS.map((action) => {
                  const checked = permissions[mod.key]?.[action.key] ?? false
                  const cellDisabled =
                    disabled || (action.key !== 'view' && !(permissions[mod.key]?.view))

                  return (
                    <td key={action.key} className="text-center py-2.5 px-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={cellDisabled}
                        onChange={() => toggle(mod.key, action.key)}
                        className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed accent-violet-600"
                      />
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
