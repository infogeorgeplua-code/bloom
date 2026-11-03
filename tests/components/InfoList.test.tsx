import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InfoList } from '@/components'

const items = [
  { label: 'Propósito', value: 'Hidrata el café y libera el CO₂.', emphasis: 'primary' as const },
  { label: 'Técnica', value: 'Vierte en espiral rápida.' },
  { label: 'Después', value: 'Primer vertido → 140 g de agua' },
]

describe('InfoList', () => {
  it('es una lista de definición con label = tipo de dato', () => {
    render(<InfoList items={items} />)
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['Propósito', 'Técnica', 'Después'])
    expect(screen.getAllByRole('definition')).toHaveLength(3)
  })

  it('Propósito en body-lg --text-1; Técnica y Después en body --text-2', () => {
    render(<InfoList items={items} />)
    expect(screen.getByText('Hidrata el café y libera el CO₂.')).toHaveClass('t-body-lg', 'text-fg')
    expect(screen.getByText('Vierte en espiral rápida.')).toHaveClass('t-body', 'text-fg-2')
  })

  it('divisor entre filas, no después de la última; columna de label fija', () => {
    const { container } = render(<InfoList items={items} />)
    const rows = container.querySelectorAll('dl > div')
    expect(rows[0]).toHaveClass('border-b')
    expect(rows[2]).not.toHaveClass('border-b')
    expect(screen.getByText('Técnica')).toHaveClass('w-18', 't-label')
  })

  it('las filas sin contenido no se renderizan; sin filas no hay lista', () => {
    const { container, rerender } = render(<InfoList items={[...items.slice(0, 2), { label: 'Después', value: null }]} />)
    expect(screen.queryByText('Después')).not.toBeInTheDocument()
    rerender(<InfoList items={[{ label: 'Después', value: '' }]} />)
    expect(container.querySelector('dl')).toBeNull()
  })
})
