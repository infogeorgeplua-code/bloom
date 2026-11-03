import { Coffee, Star } from 'lucide-react'
import { Button } from './Button'
import { MethodIllustration, type IllustratedMethod } from './MethodIllustration'
import { Orb } from './Orb'
import { cn } from '@/lib/cn'

export interface HeroParam {
  /** Número sin unidad: "15", "1:16" */
  value: string
  unit?: string
  /** "Café", "Agua", "Temp.", "Ratio" */
  label: string
}

interface CoffeeHeroFilled {
  empty?: false
  name: string
  method: IllustratedMethod
  /** "V60 · Receta V3". Con P-04 pasará a "V60 · V4 lista · +0,5 °C" */
  subtitle: string
  /** Receta bloqueada: estrella crema con aria-label */
  locked?: boolean
  params: HeroParam[]
  onPrepare?: () => void
  className?: string
}

interface CoffeeHeroEmpty {
  empty: true
  onPrepare?: () => void
  className?: string
}

export type CoffeeHeroProps = CoffeeHeroFilled | CoffeeHeroEmpty

/** Tarjeta "Tu café habitual" del Home (DS §3.29, Figma 01). */
export function CoffeeHero(props: CoffeeHeroProps) {
  const shell = 'flex flex-col gap-4 rounded-tile bg-surface-2 p-4'

  if (props.empty) {
    return (
      <section className={cn(shell, 'items-center text-center', props.className)} aria-label="Tu café habitual">
        <Orb variant="outline" size="sm" icon={Coffee} />
        <p className="t-title text-fg">Prepara tu primer café</p>
        <Button fullWidth onClick={props.onPrepare}>
          Preparar ahora
        </Button>
      </section>
    )
  }

  const { name, method, subtitle, locked, params, onPrepare, className } = props
  return (
    <section className={cn(shell, className)} aria-labelledby="coffee-hero-name">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          {/* Figma: 8,8 px; se implementa en label 11 px (mínimo legible, DS §2.2) */}
          <p className="t-label text-fg-3">Tu café habitual</p>
          <h2 id="coffee-hero-name" className="t-title-md text-fg">
            {name}
          </h2>
          <p className="t-caption flex items-center gap-1.5 text-fg-2">
            {/* TODO(ds-pendiente): P-04 — subtítulo con la versión propuesta por el motor */}
            {subtitle}
            {locked ? (
              <Star size={14} strokeWidth={1.5} className="fill-accent text-accent" role="img" aria-label="Receta bloqueada" />
            ) : null}
          </p>
        </div>
        <MethodIllustration method={method} />
      </div>
      <dl className="m-0 grid grid-cols-4 gap-2">
        {params.map((p) => (
          <div key={p.label} className="flex flex-col gap-0.5">
            <dt className="t-caption order-2 text-fg-3">{p.label}</dt>
            <dd className="order-1 m-0 flex items-baseline gap-1">
              <span className="t-num-sm text-fg">{p.value}</span>
              {p.unit ? <span className="t-caption text-fg-2">{p.unit}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
      <Button fullWidth onClick={onPrepare}>
        Preparar ahora
      </Button>
    </section>
  )
}
