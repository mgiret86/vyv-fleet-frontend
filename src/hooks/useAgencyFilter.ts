import { useMemo } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

export function useAgencyFilter() {
  const getVisibleAgencyIds = useAuthStore((s) => s.getVisibleAgencyIds)
  const currentUser         = useAuthStore((s) => s.currentUser)

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  // Réactif : recalculé si currentUser change
  const visibleAgencyIds = useMemo(
    () => getVisibleAgencyIds(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser]
  )

  function filterByAgency<T extends { agencyId: string }>(data: T[]): T[] {
    // SUPER_ADMIN voit tout, pas de filtre agence
    if (isSuperAdmin) return data
    if (visibleAgencyIds.length === 0) return data
    return data.filter((item) => visibleAgencyIds.includes(item.agencyId))
  }

  return { filterByAgency, visibleAgencyIds }
}
