import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BrewSummarySheet } from '@/components'

const base = { open: true, totalText: '2:52', coffeeG: '15', waterG: '240', tempC: '92' }

describe('BrewSummarySheet', () => {
  it('"Tu café está listo", tiempo total en num-xl y StatRow con "Temp."', () => {
    render(<BrewSummarySheet {...base} onEvaluate={() => {}} onLater={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'Tu café está listo' })).toBeInTheDocument()
    expect(screen.getByText('2:52')).toHaveClass('t-num-xl')
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['Café', 'Agua', 'Temp.'])
    expect(screen.queryByText('Agua a')).not.toBeInTheDocument()
  })

  it('variante inverse y solo se cierra con sus botones', () => {
    render(<BrewSummarySheet {...base} onEvaluate={() => {}} onLater={() => {}} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('inverse-scope')
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('"Evaluar receta" y "Más tarde" llaman a sus acciones', () => {
    const onEvaluate = vi.fn()
    const onLater = vi.fn()
    render(<BrewSummarySheet {...base} onEvaluate={onEvaluate} onLater={onLater} />)
    fireEvent.click(screen.getByRole('button', { name: 'Evaluar receta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Más tarde' }))
    expect(onEvaluate).toHaveBeenCalled()
    expect(onLater).toHaveBeenCalled()
  })

  it('"Evaluar receta" puede ir deshabilitado (fase 2) y el slot de P-05 se muestra si llega', () => {
    render(<BrewSummarySheet {...base} evaluateDisabled statusLine="En tiempo · meta 2:40 – 3:00" onEvaluate={() => {}} onLater={() => {}} />)
    expect(screen.getByRole('button', { name: 'Evaluar receta' })).toBeDisabled()
    expect(screen.getByText('En tiempo · meta 2:40 – 3:00')).toBeInTheDocument()
  })
})
