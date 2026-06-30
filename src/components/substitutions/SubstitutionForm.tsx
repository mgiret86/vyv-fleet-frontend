import { useState, useCallback } from 'react'
import { X, ArrowLeftRight, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { substitutionService } from '@/lib/services'
import { get } from '@/lib/api'

interface Vehicle {
  id:             string
  registration:   string
  brand:          string
  model:          string
  mileage:        number
  imeiPda:        string | null
  imeiTelematics: string | null
  agency: { id: string; name: string }
}

const VEHICLE_TYPES = ['AMBULANCE', 'VSL', 'TAXI', 'TPMR', 'TRANSPORT_PERSONNES'] as const
const TYPE_LABELS: Record<string, string> = {
  AMBULANCE:           'Ambulance',
  VSL:                 'VSL',
  TAXI:                'Taxi',
  TPMR:                'TPMR',
  TRANSPORT_PERSONNES: 'Transport de personnes',
}

interface Props {
  substitution?: any
  onClose: () => void
  onSave:  (data: any) => void
}

interface VehicleSearchFieldProps {
  side:       'incoming' | 'outgoing'
  search:     string
  setSearch:  (v: string) => void
  vehicle:    Vehicle | null
  error:      string
  searching:  boolean
  onSearch:   (registration: string, side: 'incoming' | 'outgoing') => void
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white'

function VehicleSearchField({ side, search, setSearch, vehicle, error, searching, onSearch }: VehicleSearchFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className={inputCls + (error ? ' border-red-300 focus:ring-red-300/30 focus:border-red-400' : '')}
          placeholder="Ex: FA-093-MV"
          value={search}
          onChange={e => setSearch(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && onSearch(search, side)}
        />
        <button
          type="button"
          onClick={() => onSearch(search, side)}
          disabled={searching || !search.trim()}
          className="px-3 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-40 flex items-center gap-1 flex-shrink-0"
        >
          {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Vérifier'}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded-lg border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
        </div>
      )}
      {vehicle && !error && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs space-y-0.5">
          <div className="font-semibold text-green-800">{vehicle.registration} — {vehicle.brand} {vehicle.model}</div>
          <div className="text-green-600">Agence : {vehicle.agency.name} · {vehicle.mileage.toLocaleString('fr-FR')} km</div>
        </div>
      )}
    </div>
  )
}

export default function SubstitutionForm({ substitution, onClose, onSave }: Props) {

  const [outgoingSearch,  setOutgoingSearch]  = useState(substitution?.outgoingVehicle?.registration ?? '')
  const [incomingSearch,  setIncomingSearch]  = useState(substitution?.incomingVehicle?.registration ?? '')
  const [outgoingVehicle, setOutgoingVehicle] = useState<Vehicle | null>(substitution?.outgoingVehicle ?? null)
  const [incomingVehicle, setIncomingVehicle] = useState<Vehicle | null>(substitution?.incomingVehicle ?? null)
  const [outgoingError,   setOutgoingError]   = useState('')
  const [incomingError,   setIncomingError]   = useState('')
  const [searchingOut,    setSearchingOut]    = useState(false)
  const [searchingIn,     setSearchingIn]     = useState(false)

  const [form, setForm] = useState({
    effectiveDate:            substitution?.effectiveDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    incomingAlias:            substitution?.incomingAlias            ?? '',
    incomingVehicleType:      substitution?.incomingVehicleType      ?? 'AMBULANCE',
    incomingTaxiConventionAM: substitution?.incomingTaxiConventionAM ?? false,
    axaNotified:              substitution?.axaNotified              ?? false,
    arsDeclaration:           substitution?.arsDeclaration           ?? false,
    amsReceived:              substitution?.amsReceived              ?? false,
    adsDeclaration:           substitution?.adsDeclaration           ?? false,
    adsNumber:                substitution?.adsNumber                ?? '',
    adsMunicipality:          substitution?.adsMunicipality          ?? '',
    outgoingAlias:            substitution?.outgoingAlias            ?? '',
    outgoingVehicleType:      substitution?.outgoingVehicleType      ?? 'AMBULANCE',
    outgoingMileage:          substitution?.outgoingMileage          ?? 0,
    hasFuelCard:              substitution?.hasFuelCard              ?? false,
    dkvReplacement:           substitution?.dkvReplacement           ?? false,
    tollDevice:               substitution?.tollDevice               ?? false,
    tollDeviceNumber:         substitution?.tollDeviceNumber         ?? '',
    geolocDevice:             substitution?.geolocDevice             ?? false,
    geolocImei:               substitution?.geolocImei              ?? '',
    pdaDevice:                substitution?.pdaDevice               ?? false,
    pdaImei:                  substitution?.pdaImei                 ?? '',
    incomingFuelCard:         substitution?.incomingFuelCard         ?? false,
    incomingDkv:              substitution?.incomingDkv              ?? false,
    incomingTollDevice:       substitution?.incomingTollDevice       ?? false,
    incomingGeolocDevice:     substitution?.incomingGeolocDevice     ?? false,
    incomingGeolocImei:       substitution?.incomingGeolocImei       ?? '',
    incomingPdaDevice:        substitution?.incomingPdaDevice        ?? false,
    incomingPdaImei:          substitution?.incomingPdaImei          ?? '',
    returnReportByEmail:      substitution?.returnReportByEmail      ?? false,
    returnReportDate:         substitution?.returnReportDate?.slice(0, 10) ?? '',
    bodyCondition:            substitution?.bodyCondition            ?? '',
    sanitaryCellCondition:    substitution?.sanitaryCellCondition    ?? '',
    interiorCondition:        substitution?.interiorCondition        ?? '',
    mechanicalCondition:      substitution?.mechanicalCondition      ?? '',
    additionalCosts:          substitution?.additionalCosts          ?? '',
    isDriveable:              substitution?.isDriveable              ?? true,
    vehicleLocation:          substitution?.vehicleLocation          ?? '',
    notes:                    substitution?.notes                    ?? '',
  })

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const requiresARS = ['AMBULANCE', 'VSL'].includes(form.incomingVehicleType)
    || (form.incomingVehicleType === 'TAXI' && form.incomingTaxiConventionAM)

  const searchVehicle = useCallback(async (
    registration: string,
    side: 'incoming' | 'outgoing'
  ) => {
    const setSearching = side === 'outgoing' ? setSearchingOut : setSearchingIn
    const setVehicle   = side === 'outgoing' ? setOutgoingVehicle : setIncomingVehicle
    const setError     = side === 'outgoing' ? setOutgoingError   : setIncomingError
    const otherVehicle = side === 'outgoing' ? incomingVehicle    : outgoingVehicle

    if (!registration.trim()) return
    setSearching(true)
    setError('')
    try {
      const vehicles: Vehicle[] = await get(
        `/vehicles?registration=${encodeURIComponent(registration.toUpperCase().trim())}`
      )
      const found = vehicles?.[0] ?? null
      if (!found) {
        setError(`Immatriculation "${registration.toUpperCase()}" introuvable en base de données.`)
        setVehicle(null)
        return
      }
      if (otherVehicle && found.id === otherVehicle.id) {
        setError("Ce véhicule est déjà sélectionné de l'autre côté.")
        setVehicle(null)
        return
      }
      setVehicle(found)
      if (side === 'outgoing') {
        set('outgoingMileage', found.mileage)
        set('outgoingAlias', '')
        if (found.imeiTelematics) { set('geolocDevice', true);  set('geolocImei', found.imeiTelematics) }
        else                      { set('geolocDevice', false); set('geolocImei', '') }
        if (found.imeiPda)        { set('pdaDevice', true);     set('pdaImei', found.imeiPda) }
        else                      { set('pdaDevice', false);    set('pdaImei', '') }
      } else {
        set('incomingAlias', '')
      }
    } catch {
      setError('Erreur lors de la recherche.')
      setVehicle(null)
    } finally {
      setSearching(false)
    }
  }, [incomingVehicle, outgoingVehicle])

  const [saving, setSaving]           = useState(false)
  const [globalError, setGlobalError] = useState('')

  const handleSubmit = async (status: 'DRAFT' | 'COMPLETED') => {
    if (!outgoingVehicle) { setOutgoingError('Veuillez sélectionner un véhicule sortant valide.'); return }
    if (!incomingVehicle) { setIncomingError('Veuillez sélectionner un véhicule entrant valide.'); return }
    setSaving(true)
    setGlobalError('')
    try {
      const payload = {
        ...form,
        status,
        effectiveDate:     new Date(form.effectiveDate).toISOString(),
        returnReportDate:  form.returnReportDate ? new Date(form.returnReportDate).toISOString() : undefined,
        incomingVehicleId: incomingVehicle.id,
        incomingAgencyId:  incomingVehicle.agency.id,
        outgoingVehicleId: outgoingVehicle.id,
        outgoingMileage:   Number(form.outgoingMileage),
      }
      const result: any = substitution?.id
        ? await substitutionService.update(substitution.id, payload)
        : await substitutionService.create(payload)
      onSave(result)
    } catch (e: any) {
      setGlobalError(e?.message ?? "Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  const labelCls        = 'block text-xs font-semibold text-gray-600 mb-1'
  const sectionTitleCls = 'text-xs font-bold text-gray-500 uppercase tracking-wider pb-1 border-b border-gray-100'
  const checkCls        = 'flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-950 to-violet-800 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <ArrowLeftRight className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {substitution ? 'Modifier la substitution' : 'Nouvelle substitution de véhicule'}
              </h2>
              <p className="text-violet-300 text-xs">Collecte sur le sortant · Transfert optionnel vers l'entrant</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          <div className="mb-6 max-w-xs">
            <label className={labelCls}>Date effective <span className="text-red-500">*</span></label>
            <input type="date" className={inputCls} value={form.effectiveDate}
              onChange={e => set('effectiveDate', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── SORTANT (gauche) ── */}
            <div className="space-y-5 bg-red-50/40 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-bold text-red-800 uppercase tracking-wide">Véhicule sortant</span>
              </div>

              <div>
                <label className={labelCls}>Immatriculation <span className="text-red-500">*</span></label>
                <VehicleSearchField side="outgoing" search={outgoingSearch} setSearch={setOutgoingSearch}
                  vehicle={outgoingVehicle} error={outgoingError} searching={searchingOut} onSearch={searchVehicle} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Alias</label>
                  <input className={inputCls} value={form.outgoingAlias}
                    onChange={e => set('outgoingAlias', e.target.value)} placeholder="Ex: DI 26" />
                </div>
                <div>
                  <label className={labelCls}>Type <span className="text-red-500">*</span></label>
                  <select className={inputCls} value={form.outgoingVehicleType}
                    onChange={e => set('outgoingVehicleType', e.target.value)}>
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Kilométrage <span className="text-red-500">*</span></label>
                <input type="number" min={0} className={inputCls} value={form.outgoingMileage}
                  onChange={e => set('outgoingMileage', e.target.value)} />
              </div>

              <div>
                <p className={sectionTitleCls}>Équipements collectés</p>
                <div className="space-y-2 mt-2">
                  <label className={checkCls}>
                    <input type="checkbox" checked={form.hasFuelCard}
                      onChange={e => set('hasFuelCard', e.target.checked)} className="rounded" />
                    Carte carburant
                  </label>
                  <label className={checkCls}>
                    <input type="checkbox" checked={form.dkvReplacement}
                      onChange={e => set('dkvReplacement', e.target.checked)} className="rounded" />
                    Badge DKV
                  </label>
                  <label className={checkCls}>
                    <input type="checkbox" checked={form.tollDevice}
                      onChange={e => set('tollDevice', e.target.checked)} className="rounded" />
                    Télépéage
                  </label>
                  {form.tollDevice && (
                    <input className={inputCls} placeholder="Numéro de télépéage"
                      value={form.tollDeviceNumber} onChange={e => set('tollDeviceNumber', e.target.value)} />
                  )}
                  <label className={checkCls}>
                    <input type="checkbox" checked={form.geolocDevice}
                      onChange={e => set('geolocDevice', e.target.checked)} className="rounded" />
                    Boîtier géolocalisation
                  </label>
                  {form.geolocDevice && (
                    <input className={inputCls} placeholder="IMEI géoloc"
                      value={form.geolocImei} onChange={e => set('geolocImei', e.target.value)} />
                  )}
                  <label className={checkCls}>
                    <input type="checkbox" checked={form.pdaDevice}
                      onChange={e => set('pdaDevice', e.target.checked)} className="rounded" />
                    PDA
                  </label>
                  {form.pdaDevice && (
                    <input className={inputCls} placeholder="IMEI PDA"
                      value={form.pdaImei} onChange={e => set('pdaImei', e.target.value)} />
                  )}
                </div>
              </div>

              <div>
                <p className={sectionTitleCls}>État du véhicule</p>
                <div className="space-y-2 mt-2">
                  <label className={checkCls}>
                    <input type="checkbox" checked={form.returnReportByEmail}
                      onChange={e => set('returnReportByEmail', e.target.checked)} className="rounded" />
                    Retour effectué par mail
                  </label>
                  {form.returnReportByEmail ? (
                    <div>
                      <label className={labelCls}>Date du retour mail</label>
                      <input type="date" className={inputCls} value={form.returnReportDate}
                        onChange={e => set('returnReportDate', e.target.value)} />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className={labelCls}>Carrosserie</label>
                        <input className={inputCls} value={form.bodyCondition}
                          onChange={e => set('bodyCondition', e.target.value)} />
                      </div>
                      {(form.outgoingVehicleType === 'AMBULANCE' || form.outgoingVehicleType === 'VSL') && (
                        <div>
                          <label className={labelCls}>Cellule sanitaire</label>
                          <input className={inputCls} value={form.sanitaryCellCondition}
                            onChange={e => set('sanitaryCellCondition', e.target.value)} />
                        </div>
                      )}
                      <div>
                        <label className={labelCls}>Habitacle</label>
                        <input className={inputCls} value={form.interiorCondition}
                          onChange={e => set('interiorCondition', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Mécanique / voyants</label>
                        <input className={inputCls} value={form.mechanicalCondition}
                          onChange={e => set('mechanicalCondition', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Frais prévus</label>
                        <input className={inputCls} value={form.additionalCosts}
                          onChange={e => set('additionalCosts', e.target.value)} />
                      </div>
                    </>
                  )}
                  <label className={checkCls}>
                    <input type="checkbox" checked={form.isDriveable}
                      onChange={e => set('isDriveable', e.target.checked)} className="rounded" />
                    Véhicule roulant
                  </label>
                  <div>
                    <label className={labelCls}>Localisation</label>
                    <input className={inputCls} value={form.vehicleLocation}
                      onChange={e => set('vehicleLocation', e.target.value)} placeholder="Ex: Agence de Quétigny" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── ENTRANT (droite) ── */}
            <div className="space-y-5 bg-green-50/40 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-bold text-green-800 uppercase tracking-wide">Véhicule entrant</span>
              </div>

              <div>
                <label className={labelCls}>Immatriculation <span className="text-red-500">*</span></label>
                <VehicleSearchField side="incoming" search={incomingSearch} setSearch={setIncomingSearch}
                  vehicle={incomingVehicle} error={incomingError} searching={searchingIn} onSearch={searchVehicle} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Alias</label>
                  <input className={inputCls} value={form.incomingAlias}
                    onChange={e => set('incomingAlias', e.target.value)} placeholder="Ex: DI 71" />
                </div>
                <div>
                  <label className={labelCls}>Type <span className="text-red-500">*</span></label>
                  <select className={inputCls} value={form.incomingVehicleType}
                    onChange={e => { set('incomingVehicleType', e.target.value); set('incomingTaxiConventionAM', false) }}>
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>

              {form.incomingVehicleType === 'TAXI' && (
                <label className={checkCls}>
                  <input type="checkbox" checked={form.incomingTaxiConventionAM}
                    onChange={e => set('incomingTaxiConventionAM', e.target.checked)} className="rounded" />
                  Taxi conventionné Assurance Maladie
                </label>
              )}

              <div>
                <p className={sectionTitleCls}>Transferts depuis le sortant</p>
                <div className="space-y-3 mt-2">
                  {!outgoingVehicle ? (
                    <p className="text-xs text-gray-400 italic">Sélectionnez d'abord le véhicule sortant</p>
                  ) : (
                    <>
                      {form.hasFuelCard && (
                        <label className={checkCls}>
                          <input type="checkbox" checked={form.incomingFuelCard}
                            onChange={e => set('incomingFuelCard', e.target.checked)} className="rounded" />
                          <ArrowRight className="w-3 h-3 text-gray-400" /> Carte carburant transférée
                        </label>
                      )}
                      {form.dkvReplacement && (
                        <label className={checkCls}>
                          <input type="checkbox" checked={form.incomingDkv}
                            onChange={e => set('incomingDkv', e.target.checked)} className="rounded" />
                          <ArrowRight className="w-3 h-3 text-gray-400" /> Badge DKV transféré
                        </label>
                      )}
                      {form.tollDevice && (
                        <label className={checkCls}>
                          <input type="checkbox" checked={form.incomingTollDevice}
                            onChange={e => set('incomingTollDevice', e.target.checked)} className="rounded" />
                          <ArrowRight className="w-3 h-3 text-gray-400" /> Télépéage transféré
                        </label>
                      )}
                      {form.geolocDevice && (
                        <div className="space-y-1.5">
                          <label className={checkCls}>
                            <input type="checkbox" checked={form.incomingGeolocDevice}
                              onChange={e => {
                                set('incomingGeolocDevice', e.target.checked)
                                set('incomingGeolocImei', e.target.checked ? form.geolocImei : '')
                              }} className="rounded" />
                            <ArrowRight className="w-3 h-3 text-gray-400" /> Boîtier géoloc transféré
                          </label>
                          {form.incomingGeolocDevice && (
                            <input className={inputCls} placeholder="IMEI géoloc"
                              value={form.incomingGeolocImei} onChange={e => set('incomingGeolocImei', e.target.value)} />
                          )}
                        </div>
                      )}
                      {form.pdaDevice && (
                        <div className="space-y-1.5">
                          <label className={checkCls}>
                            <input type="checkbox" checked={form.incomingPdaDevice}
                              onChange={e => {
                                set('incomingPdaDevice', e.target.checked)
                                set('incomingPdaImei', e.target.checked ? form.pdaImei : '')
                              }} className="rounded" />
                            <ArrowRight className="w-3 h-3 text-gray-400" /> PDA transféré
                          </label>
                          {form.incomingPdaDevice && (
                            <input className={inputCls} placeholder="IMEI PDA"
                              value={form.incomingPdaImei} onChange={e => set('incomingPdaImei', e.target.value)} />
                          )}
                        </div>
                      )}
                      {!form.hasFuelCard && !form.dkvReplacement && !form.tollDevice && !form.geolocDevice && !form.pdaDevice && (
                        <p className="text-xs text-gray-400 italic">Aucun équipement collecté sur le sortant</p>
                      )}
                      {(form.incomingVehicleType === 'AMBULANCE' || form.incomingVehicleType === 'VSL') && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                          Géoloc et PDA obligatoires pour le sanitaire
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <p className={sectionTitleCls}>Déclarations réglementaires</p>
                <div className="space-y-2 mt-2">
                  <label className={checkCls}>
                    <input type="checkbox" checked={form.axaNotified}
                      onChange={e => set('axaNotified', e.target.checked)} className="rounded" />
                    Information AXA
                  </label>
                  {requiresARS && (
                    <>
                      <label className={checkCls}>
                        <input type="checkbox" checked={form.arsDeclaration}
                          onChange={e => set('arsDeclaration', e.target.checked)} className="rounded" />
                        Déclaration ARS
                      </label>
                      <label className={checkCls}>
                        <input type="checkbox" checked={form.amsReceived}
                          onChange={e => set('amsReceived', e.target.checked)} className="rounded" />
                        AMS reçue
                      </label>
                    </>
                  )}
                  {form.incomingVehicleType === 'TAXI' && (
                    <>
                      <label className={checkCls}>
                        <input type="checkbox" checked={form.adsDeclaration}
                          onChange={e => set('adsDeclaration', e.target.checked)} className="rounded" />
                        Déclaration ADS à la mairie
                      </label>
                      {form.adsDeclaration && (
                        <div className="grid grid-cols-2 gap-2">
                          <input className={inputCls} placeholder="N° ADS"
                            value={form.adsNumber} onChange={e => set('adsNumber', e.target.value)} />
                          <input className={inputCls} placeholder="Ville"
                            value={form.adsMunicipality} onChange={e => set('adsMunicipality', e.target.value)} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className={labelCls}>Commentaires</label>
            <textarea rows={2} className={inputCls} value={form.notes}
              onChange={e => set('notes', e.target.value)} />
          </div>

          {globalError && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {globalError}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
            Annuler
          </button>
          <button onClick={() => handleSubmit('DRAFT')} disabled={saving}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer comme demande'}
          </button>
          <button onClick={() => handleSubmit('COMPLETED')} disabled={saving}
            className="px-4 py-2 bg-violet-700 text-white text-sm font-semibold rounded-xl hover:bg-violet-800 transition-colors disabled:opacity-40 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Valider la substitution
          </button>
        </div>
      </div>
    </div>
  )
}
