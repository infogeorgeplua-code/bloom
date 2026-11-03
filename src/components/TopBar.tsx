import type { ReactNode } from 'react'
import Image from 'next/image'
import wordmark from '@/assets/brand/bloom-wordmark.png'
import { ArrowLeft, Settings2, Timer, X } from 'lucide-react'
import { IconButton } from './IconButton'
import { ProgressDots } from './ProgressDots'
import { cn } from '@/lib/cn'

interface HomeBar {
  variant: 'home'
  /** Fecha ya formateada: "LUNES · 2 NOV" */
  dateText: string
  onSettings?: () => void
}

interface FlowBar {
  variant: 'flow'
  onBack: () => void
  current: number
  total: number
}

interface BrewBar {
  variant: 'brew'
  /** Ventana objetivo: "2:40 – 3:00" */
  windowText: string
  /** Tiempo total corriendo: "0:14" */
  elapsedText: string
  onExit: () => void
}

interface DefaultBar {
  variant?: 'default'
  /** Back (←) o cerrar (✕) a la izquierda; sin ninguno = pantalla raíz */
  onBack?: () => void
  onClose?: () => void
  title?: string
  /** Texto a la derecha en `label`, p. ej. el método "V60" (vista previa del brew) */
  meta?: string
  action?: ReactNode
}

export type TopBarProps = (HomeBar | FlowBar | BrewBar | DefaultBar) & { className?: string }

const SHELL = 'flex min-h-12 items-center justify-between gap-2 pt-[env(safe-area-inset-top)]'

/**
 * Barra superior (DS §3.12 v1.2): home · flow · brew, más la barra simple de la vista
 * previa y la preparación (back/✕ a la izquierda y el método a la derecha).
 */
export function TopBar(props: TopBarProps) {
  if (props.variant === 'home') {
    return (
      <header className={cn(SHELL, 'border-b border-line', props.className)}>
        {/* Wordmark recortado del logo de George (P-08 parcial: falta el SVG). unoptimized: funciona sin red */}
        <Image src={wordmark} alt="Bloom" width={104} height={20} unoptimized priority className="h-5 w-auto select-none" />
        <p className="t-label text-fg-3">{props.dateText}</p>
        <IconButton label="Setup" icon={Settings2} variant="ghost" onClick={props.onSettings} />
      </header>
    )
  }

  if (props.variant === 'flow') {
    return (
      <header className={cn(SHELL, props.className)}>
        <IconButton label="Volver" icon={ArrowLeft} variant="ghost" onClick={props.onBack} />
        <ProgressDots total={props.total} current={props.current} />
        <span className="size-12" aria-hidden="true" />
      </header>
    )
  }

  if (props.variant === 'brew') {
    return (
      <header className={cn(SHELL, props.className)}>
        <div className="flex w-24 flex-col">
          <span className="t-label text-fg-3">Meta</span>
          <span className="t-caption num text-fg-2">{props.windowText}</span>
        </div>
        <p className="flex items-center gap-1.5 text-fg">
          <Timer size={20} strokeWidth={1.5} aria-hidden="true" />
          <span className="sr-only-text">Tiempo total</span>
          <span className="t-num-md">{props.elapsedText}</span>
        </p>
        <div className="flex w-24 justify-end">
          <IconButton label="Salir del brew" icon={X} variant="ghost" onClick={props.onExit} />
        </div>
      </header>
    )
  }

  const { onBack, onClose, title, meta, action, className } = props
  return (
    <header className={cn('grid min-h-12 grid-cols-[minmax(3rem,auto)_1fr_minmax(3rem,auto)] items-center gap-2 pt-[env(safe-area-inset-top)]', className)}>
      <div className="flex justify-start">
        {onBack ? <IconButton label="Volver" icon={ArrowLeft} variant="ghost" onClick={onBack} /> : null}
        {!onBack && onClose ? <IconButton label="Cerrar" icon={X} variant="ghost" onClick={onClose} /> : null}
      </div>
      <h1 className="t-body truncate text-center font-semibold text-fg">{title}</h1>
      <div className="flex justify-end">
        {action ?? (meta ? <span className="t-label text-fg-2">{meta}</span> : null)}
      </div>
    </header>
  )
}
