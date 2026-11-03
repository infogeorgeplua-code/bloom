import v60Dripper from '@/assets/illustrations/v60-dripper.svg'
import v60Filtro from '@/assets/illustrations/v60-filtro.svg'
import { cn } from '@/lib/cn'

/** Next entrega `{ src }`; Vite (tests) entrega la URL como texto */
const assetSrc = (asset: unknown): string =>
  typeof asset === 'string' ? asset : (asset as { src: string }).src

export type IllustratedMethod = 'v60' | 'aeropress' | 'espresso'

export interface MethodIllustrationProps {
  method: IllustratedMethod
  className?: string
}

/**
 * Dibujo lineal del método (DS §3.27). Decorativo: aria-hidden. Caja de 126 × 94 (hero de Home).
 * V60: los dos grupos exportados de Figma (`Illustration/V60`, nodo 16:1021) en su posición original.
 * TODO(ds-pendiente): P-08 — los SVG exportados traen el color fijo (no `currentColor`) y vienen
 * en dos grupos; falta exportarlos como un solo SVG simplificado. Faltan AeroPress y Espresso.
 */
export function MethodIllustration({ method, className }: MethodIllustrationProps) {
  return (
    <span
      aria-hidden="true"
      data-method={method}
      className={cn('relative block h-[94px] w-[126px] shrink-0', className)}
    >
      {method === 'v60' ? (
        <>
          <span className="absolute inset-[5.08%_5.7%_47.46%_36.08%]">
            {/* eslint-disable-next-line @next/next/no-img-element -- asset estático exacto de Figma */}
            <img src={assetSrc(v60Filtro)} alt="" className="absolute inset-0 block size-full max-w-none" />
          </span>
          <span className="absolute inset-[11.86%_5.8%_5.93%_24.05%]">
            <span className="absolute inset-[-0.93%_-0.81%]">
              {/* eslint-disable-next-line @next/next/no-img-element -- asset estático exacto de Figma */}
              <img src={assetSrc(v60Dripper)} alt="" className="block size-full max-w-none" />
            </span>
          </span>
        </>
      ) : (
        <span className="absolute inset-0 rounded-chip border border-dashed border-line" />
      )}
    </span>
  )
}
