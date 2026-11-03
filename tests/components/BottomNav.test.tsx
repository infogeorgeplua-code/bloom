import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BottomNav, type NavKey } from '@/components'

describe('BottomNav v1.2', () => {
  it('Inicio · Stock · Hacer café · Diario · Setup', () => {
    render(<BottomNav active="home" />)
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Inicio',
      'Stock',
      'Hacer café',
      'Diario',
      'Setup',
    ])
    expect(screen.queryByText(/Lab|Mis cafés|Pronto/)).not.toBeInTheDocument()
  })

  it.each(['home', 'stock', 'make', 'setup'] as NavKey[])('marca %s como página actual', (key) => {
    render(<BottomNav active={key} />)
    expect(screen.getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page')).toHaveLength(1)
  })

  it('Diario está deshabilitado, en text-disabled y con aria-label "disponible pronto" (P-01)', () => {
    render(<BottomNav active="home" />)
    const diario = screen.getByRole('button', { name: 'Diario, disponible pronto' })
    expect(diario).toBeDisabled()
    expect(diario).toHaveClass('text-fg-disabled')
  })

  it('se pueden deshabilitar otros ítems hasta su fase', () => {
    render(<BottomNav active="home" disabled={['stock', 'setup']} />)
    expect(screen.getByRole('button', { name: 'Stock' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Setup' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Inicio' })).toBeEnabled()
  })

  it('el ítem central es "Hacer café" y llama a onSelect', () => {
    const onSelect = vi.fn()
    render(<BottomNav active="home" onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Hacer café' }))
    expect(onSelect).toHaveBeenCalledWith('make')
  })

  it('con hrefs renderiza enlaces', () => {
    render(<BottomNav active="home" hrefs={{ home: '/', setup: '/setup' }} />)
    expect(screen.getByRole('link', { name: 'Setup' })).toHaveAttribute('href', '/setup')
  })
})
