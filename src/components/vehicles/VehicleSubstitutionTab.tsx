import { useEffect, useState, useCallback } from 'react'
import { ArrowRight, ArrowLeftRight, Clock } from 'lucide-react'
import { substitutionService } from '@/lib/services'

const TYPE_LABELS: Record<string, string> = {
  AMBULANCE:           'Ambulance',
  VSL:                 'VSL',
  TAXI:                'Taxi',
  TPMR:                'TPMR',
  TRANSPORT_PERSONNES: 'Transport de personnes',
}

interface Props {
  vehicleId: string
}

export default function VehicleSubstitutionTab({ vehicleId }: Props) {
  const [substitutions, setSubstitutions] = useState<any[]>([])
  const [loading,       setLoading]       = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await substitutionService.list({ vehicleId, status: 'COMPLETED' })
      setSubstitutions(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [vehicleId])

  useEffect(() => { fetch() }, [fetch])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
        <Clock className="w-4 h-4 animate-spin" />
        Chargement de l'historique…
      </div>
    )
  }

  if (substitutions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <ArrowLeftRight className="w-10 h-10 text-gray-200 mb-3" />
        <p className="text-sm font-medium text-gray-500">Aucun mouvement validé</p>
        <p className="text-xs text-gray-400 mt-1">Les mouvements validés apparaîtront ici.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {substitutions.map((s, index) => {
        const isIncoming = s.incomingVehicle?.id === vehicleId
        const partner    = isIncoming ? s.outgoingVehicle : s.incomingVehicle
        const role       = isIncoming ? 'Entrant' : 'Sortant'
        const roleColor  = isIncoming ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'
        const vehicleType = isIncoming ? s.incomingVehicleType : s.outgoingVehicleType

        return (
          <div key={s.id}
            className="relative flex gap-4"
          >
            {/* Ligne verticale de timeline */}
            {index < substitutions.length - 1 && (
              <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gray-100" />
            )}

            {/* Icône timeline */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-50 border-2 border-violet-200 flex items-center justify-center z-10">
              <ArrowLeftRight className="w-4 h-4 text-violet-600" />
            </div>

            {/* Contenu */}
            <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">

                {/* Infos mouvement */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColor}`}>
                      {role}
                    </span>
                    <span className="text-xs text-gray-500">
                      {TYPE_LABELS[vehicleType] ?? vehicleType}
                    </span>
                  </div>

                  {/* Véhicule partenaire */}
                  <div className="flex items-center gap-2">
                    {isIncoming ? (
                      <>
                        <div className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                          <div>{partner?.registration ?? '—'}</div>
                          <div className="text-[10px] font-normal text-red-500">{TYPE_LABELS[s.outgoingVehicleType]} · {s.outgoingAlias || '—'}</div>
                          {s.outgoingMileage != null && (
                            <div className="text-[10px] font-normal text-red-400">{s.outgoingMileage.toLocaleString('fr-FR')} km</div>
                          )}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <div className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
                          <div>Ce véhicule</div>
                          <div className="text-[10px] font-normal text-green-500">{TYPE_LABELS[s.incomingVehicleType]} · {s.incomingAlias || '—'}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
                          <div>{partner?.registration ?? '—'}</div>
                          <div className="text-[10px] font-normal text-green-500">{TYPE_LABELS[s.incomingVehicleType]} · {s.incomingAlias || '—'}</div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <div className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                          <div>Ce véhicule</div>
                          <div className="text-[10px] font-normal text-red-500">{TYPE_LABELS[s.outgoingVehicleType]} · {s.outgoingAlias || '—'}</div>
                          {s.outgoingMileage != null && (
                            <div className="text-[10px] font-normal text-red-400">{s.outgoingMileage.toLocaleString('fr-FR')} km</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Badges équipements */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.axaNotified      && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-200">AXA notifié</span>}
                    {s.arsDeclaration   && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] rounded border border-purple-200">ARS déclaré</span>}
                    {s.amsReceived      && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] rounded border border-purple-200">AMS reçue</span>}
                    {s.adsDeclaration   && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded border border-indigo-200">ADS déclaré</span>}
                    {s.geolocDevice     && <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 text-[10px] rounded border border-gray-200">Géoloc {s.geolocImei}</span>}
                    {s.pdaDevice        && <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 text-[10px] rounded border border-gray-200">PDA {s.pdaImei}</span>}
                    {!s.isDriveable     && <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 text-[10px] rounded border border-orange-200">Non roulant</span>}
                  </div>

                  {s.notes && (
                    <p className="text-[10px] text-gray-400 italic mt-1 truncate max-w-sm">{s.notes}</p>
                  )}
                </div>

                {/* Date + horodatage */}
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-400">Date effective</div>
                  <div className="text-sm font-bold text-gray-800">
                    {new Date(s.effectiveDate).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </div>
                  {s.createdAt && (
                    <div className="text-[10px] text-gray-400 mt-1">
                      Enregistré le {new Date(s.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                      })} à {new Date(s.createdAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  )}
                  {s.createdBy && (
                    <div className="text-[10px] text-gray-400">
                      par {s.createdBy.firstName} {s.createdBy.lastName}
                    </div>
                  )}
                  {s.incomingAgency && (
                    <div className="text-[10px] text-violet-500 mt-1 font-medium">{s.incomingAgency.name}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}