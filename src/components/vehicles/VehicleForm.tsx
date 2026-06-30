import { useEffect } from "react"
import { z } from "zod"
import { useForm } from "@/hooks/useForm"
import { useToast } from "@/hooks/useToast"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { useVehicleStore }         from "@/store/vehicleStore"
import { useAppStore }             from "@/store/useAppStore"
import { useVehicleCategoryStore } from "@/store/vehicleCategoryStore"
import type { Vehicle } from "@/types"
import { Truck, Gauge, CalendarClock, Info, FileText, Radio } from "lucide-react"

const vehicleSchema = z.object({
  registration:              z.string().regex(/^[A-Z]{2}-[0-9]{3}-[A-Z]{2}$/, "Format invalide"),
  brand:                     z.string().min(2, "Min. 2 caracteres"),
  model:                     z.string().min(2, "Min. 2 caracteres"),
  categoryId:                z.string().min(1, "Requis"),
  energy:                    z.enum(["DIESEL", "HYBRID", "ELECTRIC", "GASOLINE"]),
  agencyId:                  z.string().min(1, "Requis"),
  mileage:                   z.coerce.number().min(0, "Valeur negative impossible"),
  monthlyLeaseCost:          z.coerce.number().nullable(),
  arsApprovalExpiry:         z.string().nullable(),
  insuranceExpiry:           z.string().min(1, "Requis"),
  technicalInspectionExpiry: z.string().min(1, "Requis"),
  nextMaintenanceDate:       z.string().nullable(),
  taxiMeterControlExpiry:    z.string().nullable(),
  firstRegistrationDate:     z.string().nullable(),
  entryDate:                 z.string().nullable(),
  exitDate:                  z.string().nullable(),
  color:                     z.string().nullable(),
  vin:                       z.string().nullable(),
  nationalGenre:             z.string().nullable(),
  co2Emission:               z.coerce.number().nullable(),
  seatingCapacity:           z.coerce.number().int().nullable(),
  imeiPda:                   z.string().nullable(),
  imeiTelematics:            z.string().nullable(),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

const INITIAL: VehicleFormData = {
  registration: "", brand: "", model: "", categoryId: "", energy: "DIESEL",
  agencyId: "", mileage: 0, monthlyLeaseCost: null,
  arsApprovalExpiry: null, insuranceExpiry: "", technicalInspectionExpiry: "",
  nextMaintenanceDate: null, taxiMeterControlExpiry: null,
  firstRegistrationDate: null, entryDate: null, exitDate: null,
  color: null, vin: null, nationalGenre: null, co2Emission: null,
  seatingCapacity: null, imeiPda: null, imeiTelematics: null,
}

interface VehicleFormProps {
  isOpen:   boolean
  onClose:  () => void
  vehicle?: Partial<Vehicle>
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  error?: string
  className?: string
  onChange?: (name: string, value: string | number | null) => void
}
function Input({ error, className = "", onChange, ...props }: InputProps) {
  const handleNative = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e.target.name, e.target.value)
  }
  return (
    <div>
      <input {...props} onChange={handleNative} className={"w-full px-3 py-2 text-sm bg-white border rounded-lg text-gray-900 placeholder-gray-300 transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent " + (error ? "border-red-400" : "border-gray-200") + " " + className} />
      {error && <p className="text-[10px] text-red-500 mt-0.5 font-medium">{error}</p>}
    </div>
  )
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  error?: string
  className?: string
  children?: React.ReactNode
  onChange?: (name: string, value: string | number | null) => void
}
function Select({ error, children, className = "", onChange, ...props }: SelectProps) {
  const handleNative = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) onChange(e.target.name, e.target.value)
  }
  return (
    <div>
      <select {...props} onChange={handleNative} className={"w-full px-3 py-2 text-sm bg-white border rounded-lg text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent " + (error ? "border-red-400" : "border-gray-200") + " " + className}>
        {children}
      </select>
      {error && <p className="text-[10px] text-red-500 mt-0.5 font-medium">{error}</p>}
    </div>
  )
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 rounded-full bg-violet-600" />
      <Icon className="w-3.5 h-3.5 text-violet-500" />
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  )
}

export default function VehicleForm({ isOpen, onClose, vehicle }: VehicleFormProps) {
  const { addVehicle, updateVehicle } = useVehicleStore()
  const { agencies }                  = useAppStore()
  const { categories: snap }          = useVehicleCategoryStore()
  const toast                         = useToast()
  const categories = snap.filter((c) => !c.isSystem && c.isActive)
  const horsListe  = snap.find((c) => c.isSystem)
  const isPrefilled = (f: keyof VehicleFormData): boolean =>
    !vehicle?.id &&
    vehicle?.[f as keyof Vehicle] !== undefined &&
    vehicle?.[f as keyof Vehicle] !== null &&
    vehicle?.[f as keyof Vehicle] !== ""
  const { formData, errors, handleChange, handleSubmit, setFormData, resetForm } = useForm<VehicleFormData>(vehicleSchema, INITIAL)

  const fromISO = (v: string | null | undefined): string => v ? (v.includes("T") ? v.split("T")[0] : v) : ""

  const toISO = (v: string | null | undefined): string | null => {
    if (!v || v === "") return null
    if (v.includes("T")) return v
    return new Date(v).toISOString()
  }

  useEffect(() => {
    if (vehicle) {
      const rawCategory = vehicle.categoryId ?? ""
      const resolvedCategory = snap.find((c) => c.id === rawCategory)?.id ?? snap.find((c) => c.label === rawCategory)?.id ?? INITIAL.categoryId
      setFormData({
        registration: vehicle.registration ?? INITIAL.registration,
        brand: vehicle.brand ?? INITIAL.brand,
        model: vehicle.model ?? INITIAL.model,
        categoryId: resolvedCategory,
        energy: vehicle.energy ?? INITIAL.energy,
        agencyId: vehicle.agencyId ?? INITIAL.agencyId,
        mileage: vehicle.mileage ?? INITIAL.mileage,
        monthlyLeaseCost: vehicle.monthlyLeaseCost ?? INITIAL.monthlyLeaseCost,
        arsApprovalExpiry: fromISO(vehicle.arsApprovalExpiry),
        insuranceExpiry: fromISO(vehicle.insuranceExpiry),
        technicalInspectionExpiry: fromISO(vehicle.technicalInspectionExpiry),
        nextMaintenanceDate: fromISO(vehicle.nextMaintenanceDate),
        taxiMeterControlExpiry: fromISO(vehicle.taxiMeterControlExpiry),
        firstRegistrationDate: fromISO(vehicle.firstRegistrationDate),
        entryDate: fromISO(vehicle.entryDate),
        exitDate: fromISO(vehicle.exitDate),
        color: vehicle.color ?? INITIAL.color,
        vin: vehicle.vin ?? INITIAL.vin,
        nationalGenre: vehicle.nationalGenre ?? INITIAL.nationalGenre,
        co2Emission: vehicle.co2Emission ?? INITIAL.co2Emission,
        seatingCapacity: vehicle.seatingCapacity ?? INITIAL.seatingCapacity,
        imeiPda: vehicle.imeiPda ?? INITIAL.imeiPda,
        imeiTelematics: vehicle.imeiTelematics ?? INITIAL.imeiTelematics,
      })
    } else { resetForm() }
  }, [isOpen, vehicle])

  const onSubmit = async (data: VehicleFormData) => {
    const agencyName = agencies.find((a) => a.id === data.agencyId)?.name ?? "Inconnu"
    const vehicleData: Omit<Vehicle, "id"> = {
      ...data, agencyName,
      arsApprovalExpiry: toISO(data.arsApprovalExpiry),
      nextMaintenanceDate: toISO(data.nextMaintenanceDate),
      taxiMeterControlExpiry: toISO(data.taxiMeterControlExpiry),
      firstRegistrationDate: toISO(data.firstRegistrationDate),
      entryDate: toISO(data.entryDate),
      exitDate: toISO(data.exitDate),
      complianceScore: vehicle?.complianceScore ?? 100,
      isRelais: vehicle?.isRelais ?? false,
      status: vehicle?.status ?? "ACTIVE",
    }
    try {
      if (vehicle?.id) { await updateVehicle(vehicle.id, vehicleData); toast.success("Vehicule mis a jour") }
      else { await addVehicle(vehicleData); toast.success("Vehicule ajoute") }
      onClose()
    } catch { toast.error("Une erreur est survenue") }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(onSubmit, () => toast.error("Veuillez corriger les erreurs"))
  }

  const title = vehicle?.id ? "Modifier " + vehicle.registration : vehicle?.registration ? "Nouveau vehicule - " + vehicle.registration : "Ajouter un vehicule"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="2xl">
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
        {!vehicle?.id && vehicle?.registration && (
          <div className="flex items-center gap-2.5 px-3 py-2 bg-violet-50 border border-violet-100 rounded-lg">
            <Info className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <p className="text-xs text-violet-700">Champs pre-remplis via API immatriculation. Verifiez avant enregistrement.</p>
          </div>
        )}
        {categories.length === 0 && (
          <div className="flex items-center gap-2.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">Aucune categorie. Allez dans <strong>Parametres Categories</strong>.</p>
          </div>
        )}
        <div className="grid grid-cols-4 gap-x-5 gap-y-0">
          <div className="space-y-2.5">
            <SectionHeader icon={Truck} label="Identification" />
            <div><Label required>Immatriculation</Label><Input name="registration" value={formData.registration} onChange={handleChange} error={errors.registration} placeholder="AB-123-CD" className={isPrefilled("registration") ? "border-violet-300 bg-violet-50/40" : ""} /></div>
            <div><Label required>Marque</Label><Input name="brand" value={formData.brand} onChange={handleChange} error={errors.brand} className={isPrefilled("brand") ? "border-violet-300 bg-violet-50/40" : ""} /></div>
            <div><Label required>Modele</Label><Input name="model" value={formData.model} onChange={handleChange} error={errors.model} className={isPrefilled("model") ? "border-violet-300 bg-violet-50/40" : ""} /></div>
            <div><Label required>Categorie</Label><Select name="categoryId" value={formData.categoryId} onChange={handleChange} error={errors.categoryId}><option value="">Selectionner</option>{categories.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}{horsListe && (<option value={horsListe.id}>{horsListe.label}</option>)}</Select></div>
            <div><Label required>Energie</Label><Select name="energy" value={formData.energy} onChange={handleChange} error={errors.energy}><option value="DIESEL">Diesel</option><option value="HYBRID">Hybride</option><option value="ELECTRIC">Electrique</option><option value="GASOLINE">Essence</option></Select></div>
            <div><Label required>Agence</Label><Select name="agencyId" value={formData.agencyId} onChange={handleChange} error={errors.agencyId}><option value="">Selectionner</option>{agencies.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}</Select></div>
          </div>

          <div className="space-y-2.5">
            <SectionHeader icon={Gauge} label="Kilometrage et couts" />
            <div><Label required>Kilometrage (km)</Label><Input type="number" name="mileage" value={formData.mileage} onChange={handleChange} error={errors.mileage} min={0} /></div>
            <div><Label>Loyer mensuel (euros)</Label><Input type="number" name="monthlyLeaseCost" value={formData.monthlyLeaseCost ?? ""} onChange={handleChange} error={errors.monthlyLeaseCost} placeholder="Vide si N/A" /></div>
            <div className="pt-2"><SectionHeader icon={CalendarClock} label="Dates parc" /></div>
            <div><Label>1ere immatriculation</Label><Input type="date" name="firstRegistrationDate" value={formData.firstRegistrationDate ?? ""} onChange={handleChange} error={errors.firstRegistrationDate} className={isPrefilled("firstRegistrationDate") ? "border-violet-300 bg-violet-50/40" : ""} /></div>
            <div><Label>Entree dans le parc</Label><Input type="date" name="entryDate" value={formData.entryDate ?? ""} onChange={handleChange} error={errors.entryDate} /></div>
            <div><Label>Sortie du parc</Label><Input type="date" name="exitDate" value={formData.exitDate ?? ""} onChange={handleChange} error={errors.exitDate} /></div>
          </div>

          <div className="space-y-2.5">
            <SectionHeader icon={CalendarClock} label="Echeances" />
            <div><Label>Agrement ARS</Label><Input type="date" name="arsApprovalExpiry" value={formData.arsApprovalExpiry ?? ""} onChange={handleChange} error={errors.arsApprovalExpiry} className={isPrefilled("arsApprovalExpiry") ? "border-violet-300 bg-violet-50/40" : ""} /></div>
            <div><Label required>Assurance</Label><Input type="date" name="insuranceExpiry" value={formData.insuranceExpiry} onChange={handleChange} error={errors.insuranceExpiry} /></div>
            <div><Label required>Controle technique</Label><Input type="date" name="technicalInspectionExpiry" value={formData.technicalInspectionExpiry} onChange={handleChange} error={errors.technicalInspectionExpiry} className={isPrefilled("technicalInspectionExpiry") ? "border-violet-300 bg-violet-50/40" : ""} /></div>
            <div><Label>Prochaine maintenance</Label><Input type="date" name="nextMaintenanceDate" value={formData.nextMaintenanceDate ?? ""} onChange={handleChange} error={errors.nextMaintenanceDate} /></div>
            <div><Label>Controle taximetre</Label><Input type="date" name="taxiMeterControlExpiry" value={formData.taxiMeterControlExpiry ?? ""} onChange={handleChange} error={errors.taxiMeterControlExpiry} /></div>
          </div>

          <div className="space-y-2.5">
            <SectionHeader icon={FileText} label="Carte grise" />
            <div><Label>Couleur</Label><Input name="color" value={formData.color ?? ""} onChange={handleChange} error={errors.color} placeholder="Ex : Blanc" className={isPrefilled("color") ? "border-violet-300 bg-violet-50/40" : ""} /></div>
            <div><Label>Code VIN (E)</Label><Input name="vin" value={formData.vin ?? ""} onChange={handleChange} error={errors.vin} placeholder="17 caracteres" className={isPrefilled("vin") ? "border-violet-300 bg-violet-50/40" : ""} /></div>
            <div><Label>Genre national (J.1)</Label><Input name="nationalGenre" value={formData.nationalGenre ?? ""} onChange={handleChange} error={errors.nationalGenre} placeholder="Ex : VASP" className={isPrefilled("nationalGenre") ? "border-violet-300 bg-violet-50/40" : ""} /></div>
            <div><Label>CO2 g/km (V.7)</Label><Input type="number" name="co2Emission" value={formData.co2Emission ?? ""} onChange={handleChange} error={errors.co2Emission} placeholder="Ex : 120" min={0} className={isPrefilled("co2Emission") ? "border-violet-300 bg-violet-50/40" : ""} /></div>
            <div><Label>Places assises (S.1)</Label><Input type="number" name="seatingCapacity" value={formData.seatingCapacity ?? ""} onChange={handleChange} error={errors.seatingCapacity} placeholder="Ex : 3" min={1} className={isPrefilled("seatingCapacity") ? "border-violet-300 bg-violet-50/40" : ""} /></div>
            <div className="pt-2"><SectionHeader icon={Radio} label="Materiels embarques" /></div>
            <div><Label>N IMEI PDA</Label><Input name="imeiPda" value={formData.imeiPda ?? ""} onChange={handleChange} error={errors.imeiPda} placeholder="15 chiffres" /></div>
            <div><Label>N IMEI Boitier Telematique</Label><Input name="imeiTelematics" value={formData.imeiTelematics ?? ""} onChange={handleChange} error={errors.imeiTelematics} placeholder="15 chiffres" /></div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-1">
          <Button type="button" variant="SECONDARY" onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="PRIMARY">{vehicle?.id ? "Enregistrer les modifications" : "Ajouter le vehicule"}</Button>
        </div>
      </form>
    </Modal>
  )
}
