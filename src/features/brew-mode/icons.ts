import { Bean, Citrus, Droplet, Gauge, Hourglass, ListChecks, Sparkles, type LucideIcon } from 'lucide-react'
import type { StepIcon } from '@/lib/schemas/recipe-seed'

/** Íconos de paso (DS §2.8): nombre del seed → componente Lucide */
export const STEP_ICON: Record<StepIcon, LucideIcon> = {
  'list-checks': ListChecks,
  droplet: Droplet,
  citrus: Citrus,
  bean: Bean,
  sparkles: Sparkles,
  hourglass: Hourglass,
  gauge: Gauge,
}
