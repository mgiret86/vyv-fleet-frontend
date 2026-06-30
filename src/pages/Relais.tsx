
import { useState } from 'react'
import { RefreshCw, MapPin, Calendar, Truck, BarChart2 } from 'lucide-react'
import RelaisDepotsTab   from '@/components/relais/RelaisDepotsTab'
import RelaisMissionsTab from '@/components/relais/RelaisMissionsTab'
import RelaisGanttTab    from '@/components/relais/RelaisGanttTab'
import RelaisKPIsTab     from '@/components/relais/RelaisKPIsTab'

type Tab = 'depots' | 'missions' | 'gantt' | 'kpis'
const TABS = [
  { id: 'depots'   as Tab, label: 'Depots',   icon: MapPin    },
  { id: 'missions' as Tab, label: 'Missions', icon: Calendar  },
  { id: 'gantt'    as Tab, label: 'Planning', icon: Truck     },
  { id: 'kpis'     as Tab, label: 'KPIs',    icon: BarChart2 },
]

export default function Relais() {
  const [tab, setTab] = useState<Tab>('missions')
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50">
          <RefreshCw className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicules Relais</h1>
          <p className="text-sm text-gray-500">Gestion des vehicules de remplacement</p>
        </div>
      </div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={['flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors',
                tab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>
      </div>
      <div>
        {tab === 'depots'   && <RelaisDepotsTab   />}
        {tab === 'missions' && <RelaisMissionsTab />}
        {tab === 'gantt'    && <RelaisGanttTab    />}
        {tab === 'kpis'     && <RelaisKPIsTab     />}
      </div>
    </div>
  )
}
