/**
 * Formulario "Tengo un café nuevo" → CoffeeInput validado. Puro y testeado: el componente
 * solo pinta. Vacío = null (nunca "N/A"); solo el nombre es obligatorio.
 */
import { CoffeeInput, type CoffeeRecord, type ProcessType, type RoastLevel } from '@/lib/schemas/coffee'

export interface CoffeeFormValues {
  name: string
  roaster: string
  originCountry: string
  variety: string
  altitudeM: string
  process: ProcessType | null
  roastLevel: RoastLevel | null
  roastDateISO: string
  /** Gramos de la bolsa (texto del campo) */
  bagG: string
}

export const EMPTY_FORM: CoffeeFormValues = {
  name: '',
  roaster: '',
  originCountry: '',
  variety: '',
  altitudeM: '',
  process: null,
  roastLevel: null,
  roastDateISO: '',
  bagG: '',
}

/** Atajos de tamaño de bolsa (g) */
export const BAG_SIZES = [250, 340, 500, 1000]

export type FormErrors = Partial<Record<keyof CoffeeFormValues, string>>

const text = (s: string) => (s.trim() ? s.trim() : null)

/** "1.850" / "1,850" / "1850 m" → 1850; vacío → null; basura → NaN */
export function parseNumber(s: string): number | null {
  // Separador de miles (punto, coma o espacio antes de 3 dígitos finales) fuera; coma decimal → punto
  const clean = s.trim().replace(/\s*(m|g)$/i, '').replace(/[.,\s](?=\d{3}$)/g, '').replace(',', '.')
  if (!clean) return null
  return /^\d+(\.\d+)?$/.test(clean) ? Number(clean) : Number.NaN
}

export function fromRecord(c: CoffeeRecord): CoffeeFormValues {
  return {
    name: c.name,
    roaster: c.roaster ?? '',
    originCountry: c.originCountry ?? '',
    variety: c.variety ?? '',
    altitudeM: c.altitudeM === null ? '' : String(c.altitudeM),
    process: c.process,
    roastLevel: c.roastLevel,
    roastDateISO: c.roastDateISO ?? '',
    bagG: '',
  }
}

export function validateCoffeeForm(
  v: CoffeeFormValues,
  todayISO: string,
): { ok: true; coffee: CoffeeInput; bagG: number | null } | { ok: false; errors: FormErrors } {
  const errors: FormErrors = {}
  if (!v.name.trim()) errors.name = 'Ponle un nombre para reconocerlo'

  const alt = parseNumber(v.altitudeM)
  if (alt !== null && (Number.isNaN(alt) || alt > 3000 || !Number.isInteger(alt))) errors.altitudeM = 'Escribe la altitud en metros, hasta 3000'

  const bag = parseNumber(v.bagG)
  if (bag !== null && (Number.isNaN(bag) || bag < 1 || bag > 5000 || !Number.isInteger(bag))) errors.bagG = 'Escribe los gramos de la bolsa, hasta 5000'

  const date = text(v.roastDateISO)
  if (date && date > todayISO) errors.roastDateISO = 'La fecha de tueste no puede ser futura'

  if (Object.keys(errors).length) return { ok: false, errors }

  const parsed = CoffeeInput.safeParse({
    name: v.name,
    roaster: text(v.roaster),
    originCountry: text(v.originCountry),
    variety: text(v.variety),
    process: v.process,
    roastLevel: v.roastLevel,
    roastDateISO: date,
    altitudeM: alt,
  })
  if (!parsed.success) return { ok: false, errors: { name: parsed.error.issues[0]?.message ?? 'Revisa los datos' } }
  return { ok: true, coffee: parsed.data, bagG: bag }
}

/** Fecha local del teléfono en ISO (yyyy-mm-dd) */
export function todayISO(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

/** "día" / "días" (el número va aparte, en mono) */
export const daysWord = (n: number): string => (n === 1 ? 'día' : 'días')

/** Estado de la ventana de tueste (P-14.1: orientativa, nunca "caducó") */
export const ROAST_STATE_TEXT = {
  reposo: 'aún reposando',
  en_ventana: 'dentro de su ventana',
  fuera_de_ventana: 'fuera de su ventana orientativa',
} as const
