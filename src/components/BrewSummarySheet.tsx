'use client'

import type { ReactNode } from 'react'
import { Bean, Check, Droplet, Thermometer } from 'lucide-react'
import { BottomSheet } from './BottomSheet'
import { Button } from './Button'
import { StatRow } from './StatRow'

export interface BrewSummarySheetProps {
  open: boolean
  /** Tiempo total ya formateado: "2:52" */
  totalText: string
  /** Números sin unidad */
  coffeeG: string
  waterG: string
  tempC: string
  /**
   * TODO(ds-pendiente): P-05 — línea caption bajo el tiempo ("En tiempo · meta 2:40 – 3:00",
   * "+0:12 sobre la meta", "Stock: 145 → 130 g"). Slot preparado; vacío hasta que se apruebe.
   */
  statusLine?: ReactNode
  onEvaluate: () => void
  /** Sin brew guardado no hay qué evaluar */
  evaluateDisabled?: boolean
  onLater: () => void
}

/**
 * Cierre del brew (DS §3.14.a, Figma 09): "Tu café está listo", tiempo total, StatRow y
 * "Evaluar receta" / "Más tarde". Solo se cierra con sus botones (sin Esc ni swipe).
 */
export function BrewSummarySheet({
  open,
  totalText,
  coffeeG,
  waterG,
  tempC,
  statusLine,
  onEvaluate,
  evaluateDisabled = false,
  onLater,
}: BrewSummarySheetProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={() => {}}
      variant="inverse"
      dismissible={false}
      titleAlign="center"
      title={
        <span className="t-body flex items-center gap-2 font-semibold text-success">
          <Check size={20} strokeWidth={1.5} aria-hidden="true" />
          Tu café está listo
        </span>
      }
    >
      <div className="flex flex-col items-center">
        <p className="t-label text-fg-2">Tiempo total</p>
        <p className="t-num-xl text-fg">{totalText}</p>
        {statusLine ? <p className="t-caption mt-1 text-fg-2">{statusLine}</p> : null}
      </div>
      <div className="border-t border-line pt-4">
        <StatRow
          stats={[
            { icon: Bean, label: 'Café', value: coffeeG, unit: 'g' },
            { icon: Droplet, label: 'Agua', value: waterG, unit: 'g' },
            // Figma dice "Agua a" y se corta: se rotula "Temp." (corrección de copy del log)
            { icon: Thermometer, label: 'Temp.', value: tempC, unit: '°C' },
          ]}
        />
      </div>
      <Button fullWidth onClick={onEvaluate} disabled={evaluateDisabled}>
        Evaluar receta
      </Button>
      <Button variant="tertiary" size="md" fullWidth onClick={onLater}>
        Más tarde
      </Button>
    </BottomSheet>
  )
}
