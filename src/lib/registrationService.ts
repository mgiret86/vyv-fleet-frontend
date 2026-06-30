// ═══════════════════════════════════════════════════════════════════
// registrationService.ts
// Provider : api-plaque.com via RapidAPI
// La clé API est lue depuis le settingsStore (localStorage)
// USE_MOCK = true → mode démo sans clé API
// ═══════════════════════════════════════════════════════════════════
import { useAuthStore } from '../store/useAuthStore'


// ── Types ──────────────────────────────────────────────────────────
export interface VehicleRegistrationData {
  registration:              string
  brand:                     string
  model:                     string
  version:                   string | null
  energy:                    'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'GASOLINE'
  firstRegistrationDate:     string | null
  technicalInspectionExpiry: string | null
  seats:                     number | null
  ptac:                      number | null
  co2:                       number | null
	nationalGenre: string | null   // Genre national J.1 (ex : VASP, DERIV VP)
  color:                     string | null
  vin:                       string | null
  bodyType:                  string | null
  doors:                     number | null
  power:                     number | null
  cylinderCount:             number | null
  gearbox:                   string | null
}

export interface RegistrationLookupResult {
  success: boolean
  data:    VehicleRegistrationData | null
  error:   string | null
}

// ── Configuration ──────────────────────────────────────────────────

// ── Mock data ──────────────────────────────────────────────────────
const MOCK_DB: Record<string, VehicleRegistrationData> = {
  'AB-123-CD': {
    registration: 'AB-123-CD', brand: 'Peugeot', model: 'Expert',
    version: 'Fourgon 2.0 BlueHDi 145 BVM6', energy: 'DIESEL',
    firstRegistrationDate: '2020-03-15', technicalInspectionExpiry: '2026-03-15',
    seats: 3, ptac: 3100, co2: 172, color: 'Blanc',
    vin: 'VF3XBYHZJLS123456', bodyType: 'Fourgon', doors: 4, power: 107,
    cylinderCount: 4, gearbox: 'Manuelle',
		nationalGenre: 'VASP',
  },
  'EF-456-GH': {
    registration: 'EF-456-GH', brand: 'Renault', model: 'Trafic',
    version: 'Combi L1H1 2.0 dCi 120', energy: 'DIESEL',
    firstRegistrationDate: '2019-07-22', technicalInspectionExpiry: '2025-07-22',
    seats: 9, ptac: 2980, co2: 185, color: 'Blanc',
    vin: 'VF1FL000567890123', bodyType: 'Minibus', doors: 5, power: 88,
    cylinderCount: 4, gearbox: 'Manuelle',
		nationalGenre: 'VASP',
  },
  'IJ-789-KL': {
    registration: 'IJ-789-KL', brand: 'Citroën', model: 'Jumpy',
    version: 'XL 2.0 BlueHDi 150 EAT8', energy: 'DIESEL',
    firstRegistrationDate: '2021-05-10', technicalInspectionExpiry: '2027-05-10',
    seats: 3, ptac: 3100, co2: 163, color: 'Gris',
    vin: 'VF7VEBHYBML654321', bodyType: 'Fourgon', doors: 4, power: 110,
    cylinderCount: 4, gearbox: 'Automatique',
		nationalGenre: 'VASP',
  },
}

const MOCK_DEFAULT: Omit<VehicleRegistrationData, 'registration'> = {
  brand: 'Mercedes-Benz', model: 'Sprinter',
  version: '314 CDI Fourgon L2H2', energy: 'DIESEL',
  firstRegistrationDate: '2022-01-10', technicalInspectionExpiry: '2026-01-10',
  seats: 3, ptac: 3500, co2: 195, color: 'Blanc',
  vin: 'WDB9066351S123789', bodyType: 'Fourgon', doors: 4, power: 105,
  cylinderCount: 4, gearbox: 'Manuelle',
	nationalGenre: 'VASP',
}

// ── Utilitaires ────────────────────────────────────────────────────
export function normalizePlate(raw: string): string {
  const clean = raw.toUpperCase().replace(/[\s\-_]/g, '')
  const match = clean.match(/^([A-Z]{2})(\d{3})([A-Z]{2})$/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`
  return clean
}

export function isValidFrenchPlate(plate: string): boolean {
  return /^[A-Z]{2}-\d{3}-[A-Z]{2}$/.test(plate)
}

// ── Mapping réponse API ────────────────────────────────────────────
function mapApiResponse(json: Record<string, unknown>, plate: string): VehicleRegistrationData {
  const mapEnergy = (raw: unknown): VehicleRegistrationData['energy'] => {
    const map: Record<string, VehicleRegistrationData['energy']> = {
      'GO': 'DIESEL', 'DIESEL': 'DIESEL', 'GAZOLE': 'DIESEL',
      'ES': 'GASOLINE', 'ESSENCE': 'GASOLINE',
      'HY': 'HYBRID', 'HYBRIDE': 'HYBRID',
      'EL': 'ELECTRIC', 'ELECTRIQUE': 'ELECTRIC',
    }
    return map[String(raw ?? '').toUpperCase()] ?? 'DIESEL'
  }

  const parseDate = (raw: unknown): string | null => {
    if (!raw) return null
    const str = String(raw)
    const ddmmyyyy = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
    if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
    return null
  }

  // L'API retourne les donnees dans json.data avec le prefixe AWN_
  const d = (json['data'] ?? json) as Record<string, unknown>

  return {
    registration:              plate,
    brand:                     String(d['AWN_marque']                    ?? d['marque']       ?? d['brand']       ?? ''),
    model:                     String(d['AWN_modele']                    ?? d['modele']       ?? d['model']       ?? ''),
    version:                   d['AWN_version']              ? String(d['AWN_version'])        : d['AWN_finition'] ? String(d['AWN_finition']) : null,
    energy:                    mapEnergy(d['AWN_energie']    ?? d['AWN_energie_cg']            ?? d['energie']     ?? d['energy'] ?? d['carburant']),
    firstRegistrationDate:     parseDate(d['AWN_date_mise_en_circulation_us'] ?? d['AWN_date_mise_en_circulation'] ?? d['date_mise_en_circulation']),
    technicalInspectionExpiry: parseDate(d['date_fin_ct']   ?? d['ct_expiry']                 ?? null),
    seats:                     d['AWN_nbr_de_places']  != null ? Number(d['AWN_nbr_de_places'])  : d['nb_places']    != null ? Number(d['nb_places'])    : null,
    ptac:                      d['AWN_PTAC']           != null ? Number(d['AWN_PTAC'])           : d['ptac']         != null ? Number(d['ptac'])         : null,
    co2:                       d['AWN_emission_co_2']  != null ? Number(d['AWN_emission_co_2'])  : d['co2']          != null ? Number(d['co2'])          : null,
    nationalGenre:             d['AWN_genre_carte_grise']   ? String(d['AWN_genre_carte_grise']) : d['AWN_carrosserie'] ? String(d['AWN_carrosserie'])   : null,
    color:                     d['AWN_couleur']             ? String(d['AWN_couleur'])           : d['couleur']      ? String(d['couleur'])              : null,
    vin:                       d['AWN_VIN']                 ? String(d['AWN_VIN'])               : d['vin']          ? String(d['vin'])                  : null,
    bodyType:                  d['AWN_style_carrosserie']   ? String(d['AWN_style_carrosserie']) : d['AWN_carrosserie'] ? String(d['AWN_carrosserie'])   : null,
    doors:                     d['AWN_nbr_portes']     != null ? Number(d['AWN_nbr_portes'])     : d['nb_portes']    != null ? Number(d['nb_portes'])    : null,
    power:                     d['AWN_puissance_KW']   != null ? Number(d['AWN_puissance_KW'])   : d['puissance_kw'] != null ? Number(d['puissance_kw']) : null,
    cylinderCount:             d['AWN_nbr_cylindres']  != null ? Number(d['AWN_nbr_cylindres'])  : d['nb_cylindres'] != null ? Number(d['nb_cylindres']) : null,
    gearbox:                   d['AWN_type_boite_vites']    ? String(d['AWN_type_boite_vites'])  : d['boite_vitesse'] ? String(d['boite_vitesse'])       : null,
  }
}

// ── Appel API réel ─────────────────────────────────────────────────
// Appel API via backend proxy
async function fetchFromApi(plate: string): Promise<RegistrationLookupResult> {
  try {
    const token = useAuthStore.getState().accessToken ?? ''
    const res = await fetch(`/api/registration/${encodeURIComponent(plate)}`, {
      method:  'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (res.status === 503) {
      return { success: false, data: null, error: 'NO_API_KEY' }
    }
    if (!res.ok) {
      return { success: false, data: null, error: `Erreur API ${res.status}` }
    }
    const json = await res.json()
    if (!json?.success) {
      return { success: false, data: null, error: json?.error ?? 'Reponse invalide' }
    }
    return { success: true, data: mapApiResponse(json.data as Record<string, unknown>, plate), error: null }
  } catch (err: unknown) {
    return { success: false, data: null, error: err instanceof Error ? err.message : 'Erreur reseau' }
  }
}

// ── Appel mock ─────────────────────────────────────────────────────
async function fetchFromMock(plate: string): Promise<RegistrationLookupResult> {
  await new Promise((r) => setTimeout(r, 1200))
  const known = MOCK_DB[plate]
  const data: VehicleRegistrationData = known
    ? { ...known }
    : { ...MOCK_DEFAULT, registration: plate }
  return { success: true, data, error: null }
}

// ── Point d'entrée public ──────────────────────────────────────────
export async function lookupRegistration(rawPlate: string): Promise<RegistrationLookupResult> {
  const plate = normalizePlate(rawPlate)
  if (!isValidFrenchPlate(plate)) {
    return {
      success: false,
      data:    null,
      error:   `Format invalide : "${plate}". Format attendu : AA-123-AA`,
    }
  }

  const result = await fetchFromApi(plate)
  if (result.error === 'NO_API_KEY') return fetchFromMock(plate)
  return result
}

// ── Test de connexion (utilisé depuis SettingsIntegrations) ────────
export async function testRegistrationApiConnection(): Promise<RegistrationLookupResult> {
  try {
    const token = useAuthStore.getState().accessToken ?? ''
    const res = await fetch('/api/registration/test', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const json = await res.json()
    return { success: json?.success ?? false, data: null, error: json?.error ?? null }
  } catch (err: unknown) {
    return { success: false, data: null, error: err instanceof Error ? err.message : 'Erreur reseau' }
  }
}
