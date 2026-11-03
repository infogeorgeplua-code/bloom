'use client'

import { useRef, type ReactNode, type PointerEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/cn'

export interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** inverse = cierre de ciclo (brew terminado, receta bloqueada) · default = formularios cortos y confirmaciones */
  variant?: 'default' | 'inverse'
  /** Título del diálogo (nombre accesible). Puede llevar ícono. */
  title: ReactNode
  /** Si es true el título no se ve pero sigue anunciándose */
  hideTitle?: boolean
  titleAlign?: 'start' | 'center'
  description?: string
  /**
   * false = solo se cierra con sus botones: sin Esc, sin tocar fuera y sin swipe
   * (resumen del brew, DS §3.14).
   */
  dismissible?: boolean
  children?: ReactNode
  className?: string
}

const SWIPE_CLOSE_PX = 80

/**
 * Hoja inferior (DS §3.14 v1.2). Radix Dialog aporta solo comportamiento (focus trap, Esc,
 * scrim); los estilos son del DS. Dentro de `inverse` los tokens se invierten
 * (`.inverse-scope`) para que Button y StatRow se lean sobre fondo claro (P-18).
 * El botón atrás de Android se cablea en la fase 2.
 */
export function BottomSheet({
  open,
  onOpenChange,
  variant = 'default',
  title,
  hideTitle = false,
  titleAlign = 'start',
  description,
  dismissible = true,
  children,
  className,
}: BottomSheetProps) {
  const startY = useRef<number | null>(null)
  const inverse = variant === 'inverse'

  const onHandleDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!dismissible) return
    startY.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onHandleUp = (e: PointerEvent<HTMLDivElement>) => {
    if (startY.current !== null && e.clientY - startY.current > SWIPE_CLOSE_PX) {
      onOpenChange(false)
    }
    startY.current = null
  }

  const block = (e: Event) => {
    if (!dismissible) e.preventDefault()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="scrim fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          onEscapeKeyDown={block}
          onPointerDownOutside={block}
          onInteractOutside={block}
          className={cn(
            'sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-(--app-max-width) flex-col gap-4 rounded-t-sheet px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]',
            inverse ? 'inverse-scope bg-bg' : 'bg-surface-1 text-fg',
            className,
          )}
        >
          <div
            onPointerDown={onHandleDown}
            onPointerUp={onHandleUp}
            onPointerCancel={() => {
              startY.current = null
            }}
            className={cn('-mb-1 flex h-4 w-full justify-center', dismissible && 'touch-none')}
            aria-hidden="true"
          >
            <span className="block h-1 w-9 rounded-pill bg-fg-3" />
          </div>
          <Dialog.Title
            className={cn(
              hideTitle ? 'sr-only-text' : 't-title text-fg',
              titleAlign === 'center' && 'flex items-center justify-center gap-2 text-center',
            )}
          >
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description className={cn('t-body -mt-2 text-fg-2', titleAlign === 'center' && 'text-center')}>
              {description}
            </Dialog.Description>
          ) : null}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
