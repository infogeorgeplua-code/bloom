import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RatingScale } from '@/components'

const LABELS = ['No me gustó', 'Le falta algo', 'Quedó bien', 'Muy rica', 'De campeonato']

describe('RatingScale', () => {
  it('radiogroup con los 5 niveles en orden de 1 a 5', () => {
    render(<RatingScale value={null} onChange={() => {}} />)
    expect(screen.getByRole('radiogroup', { name: '¿Qué tal esta receta?' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(LABELS)
  })

  it('al seleccionar notifica el nivel (avanza solo, sin botón Enviar)', () => {
    const onChange = vi.fn()
    render(<RatingScale value={null} onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Quedó bien' }))
    expect(onChange).toHaveBeenCalledWith(3)
    expect(screen.queryByRole('button', { name: /enviar/i })).not.toBeInTheDocument()
  })

  it.each([1, 2, 3, 4, 5] as const)('nivel %i seleccionado: aria-checked e inverso', (level) => {
    render(<RatingScale value={level} onChange={() => {}} />)
    const radios = screen.getAllByRole('radio')
    expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1)
    expect(radios[level - 1]).toHaveClass('bg-inverse')
  })

  it('sin números visibles', () => {
    render(<RatingScale value={null} onChange={() => {}} />)
    expect(screen.queryByText(/^[1-5]$/)).not.toBeInTheDocument()
  })

  it('el nivel 5 lleva una estrella en crema', () => {
    const { container } = render(<RatingScale value={null} onChange={() => {}} />)
    const stars = container.querySelectorAll('svg.lucide-star')
    expect(stars).toHaveLength(1)
    expect(stars[0]).toHaveClass('fill-accent')
  })

  it('las flechas ↑↓ mueven la selección y se acotan', () => {
    const onChange = vi.fn()
    render(<RatingScale value={3} onChange={onChange} />)
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Quedó bien' }), { key: 'ArrowDown' })
    expect(onChange).toHaveBeenLastCalledWith(4)
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Quedó bien' }), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith(2)
  })

  it('cada fila mide 56 px', () => {
    render(<RatingScale value={null} onChange={() => {}} />)
    for (const r of screen.getAllByRole('radio')) expect(r).toHaveClass('h-14')
  })
})
