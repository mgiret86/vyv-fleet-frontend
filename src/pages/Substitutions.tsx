import { useState, useEffect, useCallback, useMemo } from 'react'
import { ArrowLeftRight, Plus } from 'lucide-react'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'
import SubstitutionCard from '@/components/substitutions/SubstitutionCard'
import SubstitutionForm from '@/components/substitutions/SubstitutionForm'
import { substitutionService } from '@/lib/services'

type StatusFilter = 'ALL' | 'DRAFT' | 'COMPLETED' | 'CANCELLED'

const STATUS_LABELS: Record<StatusFilter, string> = {
  ALL:       'Tous',
  DRAFT:     'Demandes',
  COMPLETED: 'Validées',
  CANCELLED: 'Annulées',
}

export default function Substitutions() {
  const { filterByAgency } = useAgencyFilter()
  const [substitutions,   setSubstitutions]   = useState<any[]>([])
  const [showForm,        setShowForm]        = useState(false)
  const [editing,         setEditing]         = useState<any | null>(null)
  const [statusFilter,    setStatusFilter]    = useState<StatusFilter>('ALL')
  const [search,          setSearch]          = useState('')

  const fetchAll = useCallback(async () => {
    try {
      const data = await substitutionService.list()
      setSubstitutions(data)
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const visible = useMemo(() => {
    return filterByAgency(substitutions).filter(s => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          s.incomingVehicle?.registration?.toLowerCase().includes(q) ||
          s.outgoingVehicle?.registration?.toLowerCase().includes(q) ||
          s.incomingAlias?.toLowerCase().includes(q) ||
          s.outgoingAlias?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [substitutions, filterByAgency, statusFilter, search])

  const counts = useMemo(() => ({
    total:     substitutions.length,
    draft:     substitutions.filter(s => s.status === 'DRAFT').length,
    completed: substitutions.filter(s => s.status === 'COMPLETED').length,
  }), [substitutions])

  const handleNew   = () => { setEditing(null); setShowForm(true) }
  const handleEdit  = (s: any) => { setEditing(s); setShowForm(true) }
  const handleClose = () => { setShowForm(false); setEditing(null) }

  const handleSave = async (result: any) => {
    const exists = substitutions.some(s => s.id === result.id)
    if (exists) {
      setSubstitutions(prev => prev.map(s => s.id === result.id ? result : s))
    } else {
      setSubstitutions(prev => [result, ...prev])
    }
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette substitution ?')) return
    try {
      await substitutionService.remove(id)
      setSubstitutions(prev => prev.filter(s => s.id !== id))
    } catch (e) { console.error(e) }
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl px-6 py-5 mb-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Mouvements de parc</h1>
                <p className="text-violet-300 text-xs mt-0.5">
                  {counts.total} substitution{counts.total > 1 ? 's' : ''} enregistrée{counts.total > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                <span className="text-xs font-bold text-white">{counts.total}</span>
                <span className="text-[10px] text-violet-300">au total</span>
              </div>
              {counts.draft > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30">
                  <span className="text-xs font-bold text-amber-300">{counts.draft}</span>
                  <span className="text-[10px] text-amber-400">demande{counts.draft > 1 ? 's' : ''}</span>
                </div>
              )}
              {counts.completed > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-400/30">
                  <span className="text-xs font-bold text-green-300">{counts.completed}</span>
                  <span className="text-[10px] text-green-400">validée{counts.completed > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>

          <button onClick={handleNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-violet-700 text-sm font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-sm flex-shrink-0">
            <Plus className="w-4 h-4" /> Nouvelle substitution
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Filtres */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/40 flex items-center gap-3 flex-wrap">
            <input
              className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white"
              placeholder="Rechercher par immatriculation, alias…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-1">
              {(['ALL', 'DRAFT', 'COMPLETED', 'CANCELLED'] as StatusFilter[]).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    statusFilter === s
                      ? 'bg-violet-700 text-white'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* En-tête liste */}
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-violet-700" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Liste des mouvements</span>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {visible.length} résultat{visible.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Contenu */}
          {visible.length === 0 ? (
            <div className="p-12 text-center">
              <ArrowLeftRight className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">Aucune substitution trouvée</p>
              <p className="text-gray-400 text-xs mt-1">Créez votre premier mouvement de parc.</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {visible.map(s => (
                <SubstitutionCard key={s.id} substitution={s} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <SubstitutionForm
          substitution={editing ?? undefined}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}
    </>
  )
}
