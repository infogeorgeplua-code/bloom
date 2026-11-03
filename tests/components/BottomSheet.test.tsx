import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BottomSheet } from '@/components'

describe('BottomSheet v1.2', () => {
  it('abierto: es un diálogo con título accesible y descripción', () => {
    render(
      <BottomSheet open onOpenChange={() => {}} title="¿Salir del brew?" description="Perderás el progreso de esta preparación.">
        <p>Contenido</p>
      </BottomSheet>,
    )
    expect(screen.getByRole('dialog', { name: '¿Salir del brew?' })).toHaveAccessibleDescription(
      'Perderás el progreso de esta preparación.',
    )
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('cerrado: no renderiza nada', () => {
    render(<BottomSheet open={false} onOpenChange={() => {}} title="X" />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('se cierra con Esc', () => {
    const onOpenChange = vi.fn()
    render(<BottomSheet open onOpenChange={onOpenChange} title="X" />)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('dismissible=false: Esc no lo cierra (resumen del brew)', () => {
    const onOpenChange = vi.fn()
    render(<BottomSheet open onOpenChange={onOpenChange} title="X" dismissible={false} />)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('variantes default e inverse (inverse invierte los tokens dentro)', () => {
    const { rerender } = render(<BottomSheet open onOpenChange={() => {}} title="X" />)
    expect(screen.getByRole('dialog')).toHaveClass('bg-surface-1')
    rerender(<BottomSheet open onOpenChange={() => {}} title="X" variant="inverse" />)
    expect(screen.getByRole('dialog')).toHaveClass('inverse-scope', 'bg-bg')
  })

  it('padding 12 24 24, gap 16, handle 36 × 4 y sin botón cerrar', () => {
    render(<BottomSheet open onOpenChange={() => {}} title="X" />)
    expect(screen.getByRole('dialog')).toHaveClass('rounded-t-sheet', 'pt-3', 'px-6', 'gap-4')
    expect(document.querySelector('.h-1.w-9')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Cerrar' })).not.toBeInTheDocument()
  })
})
