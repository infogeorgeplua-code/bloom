import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TopBar } from '@/components'

describe('TopBar v1.2', () => {
  it('home: wordmark, fecha en label, Setup y hairline inferior', () => {
    const onSettings = vi.fn()
    const { container } = render(<TopBar variant="home" dateText="Lunes · 2 nov" onSettings={onSettings} />)
    expect(screen.getByRole('img', { name: 'Bloom' })).toBeInTheDocument()
    expect(screen.getByText('Lunes · 2 nov')).toHaveClass('t-label')
    fireEvent.click(screen.getByRole('button', { name: 'Setup' }))
    expect(onSettings).toHaveBeenCalled()
    expect(container.firstChild).toHaveClass('border-b')
  })

  it('flow: back + ProgressDots', () => {
    const onBack = vi.fn()
    render(<TopBar variant="flow" onBack={onBack} current={1} total={4} />)
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(onBack).toHaveBeenCalled()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Paso 1 de 4')
  })

  it('brew: META a la izquierda, tiempo total centrado y ✕ a la derecha (D-16)', () => {
    const onExit = vi.fn()
    const { container } = render(<TopBar variant="brew" windowText="2:40 – 3:00" elapsedText="0:14" onExit={onExit} />)
    const children = [...(container.firstChild as HTMLElement).children]
    expect(children[0]).toHaveTextContent('Meta2:40 – 3:00')
    expect(children[1]).toHaveTextContent('Tiempo total0:14')
    expect(children[2]).toContainElement(screen.getByRole('button', { name: 'Salir del brew' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salir del brew' }))
    expect(onExit).toHaveBeenCalled()
  })

  it('por defecto: back y método a la derecha (vista previa)', () => {
    render(<TopBar onBack={() => {}} meta="V60" />)
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
    expect(screen.getByText('V60')).toHaveClass('t-label')
  })

  it('por defecto con onClose: ✕ a la izquierda (preparación)', () => {
    render(<TopBar onClose={() => {}} />)
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
  })

  it('raíz sin back y con acción y título', () => {
    render(<TopBar title="Receta" action={<button type="button">Ajustes</button>} />)
    expect(screen.queryByRole('button', { name: 'Volver' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Receta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajustes' })).toBeInTheDocument()
  })
})
