import type { Metadata } from 'next'
import { DsPreview } from './DsPreview'

export const metadata: Metadata = {
  title: 'Bloom · Sistema de diseño',
}

/** Preview del design system (fase 1). Datos de ejemplo ficticios, locales a esta ruta. */
export default function DsPage() {
  return <DsPreview />
}
