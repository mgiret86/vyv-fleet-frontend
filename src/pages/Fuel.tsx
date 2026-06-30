import { useState, useMemo, useEffect, useCallback } from 'react'
import { Fuel, Plus, RefreshCw } from 'lucide-react'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'
import FuelKPI      from '@/components/fuel/FuelKPI'
import FuelFilters  from '@/components/fuel/FuelFilters'
import FuelBarChart from '@/components/fuel/FuelBarChart'
import FuelTable    from '@/components/fuel/FuelTable'
import FuelForm     from '@/components/fuel/FuelForm'
import { fuelService } from '@/lib/services'
import type { FuelEntry } from '@/types'

type FuelTypeFilter = 'ALL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC'
type PeriodFilter   = 'CURRENT_MONTH' | 'PREVIOUS_MONTH' | 'LAST_3_MONTHS' | 'CURRENT_YEAR'

function isWithinPeriod(dateStr: string, period: PeriodFilter): boolean {
  const date = new Date(dateStr); const now = new Date()
  const year = now.getFullYear(); const month = now.getMonth()
  switch (period) {
    case 'CURRENT_MONTH':  return date.getFullYear() === year && date.getMonth() === month
    case 'PREVIOUS_MONTH': {
      const pm = month === 0 ? 11 : month - 1; const py = month === 0 ? year - 1 : year
      return date.getFullYear() === py && date.getMonth() === pm
    }
    case 'LAST_3_MONTHS': {
      const limit = new Date(now); limit.setMonth(now.getMonth() - 3); limit.setDate(1); limit.setHours(0,0,0,0)
      return date >= limit
    }
    case 'CURRENT_YEAR': return date.getFullYear() === year
    default: return true
  }
}

function formatCurrency(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

export default function FuelPage() {
  const { filterByAgency, visibleAgencyIds } = useAgencyFilter()

  const [entries,        setEntries]        = useState<FuelEntry[]>([])
  const [loading,        setLoading]        = useState(true)
  const [activeTab,      setActiveTab]      = useState<'fuel'>('fuel')
  const [search,         setSearch]         = useState('')
  const [fuelTypeFilter, setFuelTypeFilter] = useState<FuelTypeFilter>('ALL')
  const [agencyFilter,   setAgencyFilter]   = useState('')
  const [periodFilter,   setPeriodFilter]   = useState<PeriodFilter>('LAST_3_MONTHS')
  const [isFormOpen,     setIsFormOpen]     = useState(false)
  const [editingEntry,   setEditingEntry]   = useState<FuelEntry | null>(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const fuel = await fuelService.list()
      setEntries(fuel)
    }
    catch (e) { console.error('Erreur chargement carburant :', e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const visibleEntries = useMemo(() => filterByAgency(entries), [entries, filterByAgency])

  const filteredEntries = useMemo<FuelEntry[]>(() => {
    const lowerSearch = search.toLowerCase()
    return filterByAgency(entries).filter((entry) => {
      if (search) {
        const match =
          entry.vehicleRegistration.toLowerCase().includes(lowerSearch) ||
          (entry.driverName?.toLowerCase() ?? '').includes(lowerSearch) ||
          (entry.station?.toLowerCase()    ?? '').includes(lowerSearch)
        if (!match) return false
      }
      if (fuelTypeFilter !== 'ALL' && entry.fuelType !== fuelTypeFilter) return false
      if (agencyFilter   !== ''    && entry.agencyId !== agencyFilter)   return false
      if (!isWithinPeriod(entry.date, periodFilter))                     return false
      return true
    })
  }, [entries, search, fuelTypeFilter, agencyFilter, periodFilter, filterByAgency])

  const totalCost      = useMemo(() => filteredEntries.reduce((s, e) => s + e.totalCost, 0), [filteredEntries])
  const maxCost        = useMemo(() => filteredEntries.reduce((max, e) => Math.max(max, e.totalCost), 0), [filteredEntries])
  const fillCount      = filteredEntries.length
  const avgConsumption = useMemo(() => {
    const withConso = filteredEntries.filter((e) => e.consumption != null)
    if (!withConso.length) return 0
    return withConso.reduce((s, e) => s + (e.consumption ?? 0), 0) / withConso.length
  }, [filteredEntries])

  const barChartData = useMemo(() => {
    const map = new Map<string, number>()
    filteredEntries.forEach((e) => {
      const d = new Date(e.date)
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map.set(month, (map.get(month) ?? 0) + e.totalCost)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, cost]) => ({ month, cost }))
  }, [filteredEntries])


  const handleSave = async (entry: FuelEntry) => {
    try {
      const exists = entries.some((e) => e.id === entry.id)
      if (exists) {
        const updated = await fuelService.update(entry.id, entry)
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, ...updated } : e))
      } else {
        const created = await fuelService.create(entry)
        setEntries((prev) => [...prev, created])
      }
      setIsFormOpen(false); setEditingEntry(null)
    } catch (e) { console.error('Erreur sauvegarde carburant :', e) }
  }

  const handleDelete = async (entry: FuelEntry) => {
    if (!window.confirm('Supprimer cette entrée carburant ?')) return
    try {
      await fuelService.remove(entry.id)
      setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    } catch (e) { console.error('Erreur suppression carburant :', e) }
  }

  const handleEdit = (entry: FuelEntry) => { setEditingEntry(entry); setIsFormOpen(true) }

  // Labels période pour le header
  const PERIOD_LABELS: Record<PeriodFilter, string> = {
    CURRENT_MONTH:  'Ce mois',
    PREVIOUS_MONTH: 'Mois dernier',
    LAST_3_MONTHS:  '3 derniers mois',
    CURRENT_YEAR:   'Cette année',
  }

  return (
    <>
      {/* ── Header gradient ── */}
      <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl px-6 py-5 mb-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Fuel className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Carburant</h1>
                <p className="text-violet-300 text-xs mt-0.5">
                  {loading
                    ? 'Chargement...'
                    : `${visibleEntries.length} entrée${visibleEntries.length > 1 ? 's' : ''} · ${PERIOD_LABELS[periodFilter]}`}
                </p>
              </div>
            </div>

            {/* Compteurs rapides */}
            {!loading && activeTab === 'fuel' && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                  <span className="text-xs font-bold text-white">{fillCount}</span>
                  <span className="text-[10px] text-violet-300">plein{fillCount > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/20 border border-violet-400/30">
                  <span className="text-xs font-bold text-violet-200">{formatCurrency(totalCost)}</span>
                  <span className="text-[10px] text-violet-400">total</span>
                </div>
                {avgConsumption > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-400/30">
                    <span className="text-xs font-bold text-blue-300">{avgConsumption.toFixed(1)} L/100</span>
                    <span className="text-[10px] text-blue-400">moy.</span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={fetchEntries}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 border border-white/20 text-white text-xs font-medium rounded-xl hover:bg-white/20 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => { setEditingEntry(null); setIsFormOpen(true) }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-violet-700 text-sm font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Nouvelle entrée
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">

        {/* ── KPI (hors carte, comme Dashboard) ── */}
        {activeTab === 'fuel' && (
          <FuelKPI
            totalCost={totalCost}
            avgConsumption={avgConsumption}
            maxCost={maxCost}
            fillCount={fillCount}
          />
        )}


        {/* ── Onglets + contenu dans une carte unifiée ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-gray-100 px-2 pt-2">
            {([
              { value: 'fuel', label: 'Carburant' },
            ] as const).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
                  activeTab === tab.value
                    ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Onglet Carburant ── */}
          {activeTab === 'fuel' && (
            <>
              {/* Filtres */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/40">
                <FuelFilters
                  search={search}                 onSearchChange={setSearch}
                  fuelTypeFilter={fuelTypeFilter} onFuelTypeChange={setFuelTypeFilter}
                  agencyFilter={agencyFilter}     onAgencyChange={setAgencyFilter}
                  periodFilter={periodFilter}     onPeriodChange={setPeriodFilter}
                  visibleAgencyIds={visibleAgencyIds}
                />
              </div>

              {/* En-tête tableau */}
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-violet-600" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Relevés de carburant</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {loading ? 'Chargement...' : `${filteredEntries.length} entrée${filteredEntries.length !== 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Contenu */}
              {loading ? (
                <div className="p-12 text-center text-sm text-gray-400 animate-pulse">
                  Chargement des données carburant...
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="p-12 text-center">
                  <Fuel className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium text-sm">Aucune entrée carburant</p>
                  <p className="text-gray-400 text-xs mt-1">Ajoutez une première entrée ou modifiez vos filtres.</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-gray-100">
                    <FuelBarChart data={barChartData} />
                  </div>
                  <FuelTable entries={filteredEntries} onEdit={handleEdit} onDelete={handleDelete} />
                </>
              )}
            </>
          )}

        </div>
      </div>

      <FuelForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingEntry(null) }}
        entry={editingEntry}
        onSave={handleSave}
      />
    </>
  )
}
