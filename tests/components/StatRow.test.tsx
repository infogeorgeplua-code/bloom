import { render, screen } from '@testing-library/react'
import { Bean, Droplet, Thermometer } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { StatRow } from '@/components'

const stats = [
  { icon: Bean, label: 'Café', value: '15', unit: 'g' },
  { icon: Droplet, label: 'Agua', value: '240', unit: 'g' },
  { icon: Thermometer, label: 'Temp.', value: '92', unit: '°C' },
]

describe('StatRow', () => {
  it('3 columnas iguales con divisores verticales', () => {
    const { container } = render(<StatRow stats={stats} />)
    const dl = container.querySelector('dl')!
    expect(dl).toHaveClass('grid', 'divide-x')
    expect(dl).toHaveStyle({ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' })
  })

  it('cada columna: ícono + caption arriba, número en num-md + unidad', () => {
    render(<StatRow stats={stats} />)
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['Café', 'Agua', 'Temp.'])
    expect(screen.getByText('240')).toHaveClass('t-num-md')
    expect(screen.getByText('°C')).toHaveClass('t-caption')
  })
})
