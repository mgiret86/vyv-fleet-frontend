import { ArrowRight, Pencil, Trash2, CheckCircle2, Clock, XCircle } from 'lucide-react'

const STATUS_CONFIG = {
  DRAFT:      { label: 'Demande',    icon: Clock,         cls: 'bg-amber-100 text-amber-700' },
  COMPLETED:  { label: 'Validée',   icon: CheckCircle2,  cls: 'bg-green-100 text-green-700' },
  CANCELLED:  { label: 'Annulée',   icon: XCircle,       cls: 'bg-red-100 text-red-600' },
}

const TYPE_LABELS: Record<string, string> = {
  AMBULANCE:           'Ambulance',
  VSL:                 'VSL',
  TAXI:                'Taxi',
  TPMR:                'TPMR',
  TRANSPORT_PERSONNES: 'Transport de personnes',
}

interface Props {
  substitution: any
  onEdit:   (s: any) => void
  onDelete: (id: string) => void
}

export default function SubstitutionCard({ substitution: s, onEdit, onDelete }: Props) {
  const status = STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.DRAFT
  const StatusIcon = status.icon

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">

        {/* Véhicules */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Entrant */}
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
            <div className="font-bold text-green-800">{s.incomingVehicle?.registration}</div>
            <div className="text-xs text-green-600">{TYPE_LABELS[s.incomingVehicleType]} · {s.incomingAlias || '—'}</div>
            <div className="text-xs text-green-500">{s.incomingVehicle?.agency?.name}</div>
          </div>

          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />

          {/* Sortant */}
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
            <div className="font-bold text-red-800">{s.outgoingVehicle?.registration}</div>
            <div className="text-xs text-red-600">{TYPE_LABELS[s.outgoingVehicleType]} · {s.outgoingAlias || '—'}</div>
            <div className="text-xs text-red-500">{s.outgoingMileage?.toLocaleString('fr-FR')} km</div>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="text-right">
            <div className="text-xs text-gray-400">Date effective</div>
            <div className="text-sm font-semibold text-gray-700">
              {new Date(s.effectiveDate).toLocaleDateString('fr-FR')}
            </div>
          </div>

          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.cls}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </span>

          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(s)}
              className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(s.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Détails équipements / déclarations */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {s.axaNotified      && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200">AXA notifié</span>}
        {s.arsDeclaration   && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-md border border-purple-200">ARS déclaré</span>}
        {s.amsReceived      && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-md border border-purple-200">AMS reçue</span>}
        {s.adsDeclaration   && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-md border border-indigo-200">ADS déclaré</span>}
        {s.geolocDevice     && <span className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-200">Géoloc {s.geolocImei}</span>}
        {s.pdaDevice        && <span className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-200">PDA {s.pdaImei}</span>}
        {!s.isDriveable     && <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-md border border-orange-200">Non roulant</span>}
        {s.incomingTaxiConventionAM && <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-md border border-teal-200">Conv. AM</span>}
      </div>

      {s.notes && (
        <p className="mt-2 text-xs text-gray-400 italic truncate">{s.notes}</p>
      )}
    </div>
  )
}
