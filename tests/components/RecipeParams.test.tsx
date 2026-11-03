import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RecipeParams } from '@/components'

const rows = [
  { label: 'Café', value: '15 g' },
  { label: 'Temperatura', value: '92 °C' },
]

describe('RecipeParams', () => {
  it('lista: número en num-md y descripción en text-2', () => {
    render(<RecipeParams rows={rows} />)
    expect(screen.getByText('15 g').closest('dd')).toHaveClass('t-num-md')
    expect(screen.getByText('Café')).toHaveClass('text-fg-2')
  })

  it('usa una lista de definición con términos y valores', () => {
    render(<RecipeParams rows={rows} />)
    expect(screen.getAllByRole('term')).toHaveLength(2)
    expect(screen.getAllByRole('definition')).toHaveLength(2)
  })

  it('con trust muestra el TrustBadge inline', () => {
    render(<RecipeParams rows={[{ label: 'Molienda', value: '18 clicks', trust: 'inferido' }]} />)
    expect(screen.getByRole('button', { name: 'Inferido' })).toBeInTheDocument()
  })

  it('diff: antes tachado, flecha y valor nuevo', () => {
    const { container } = render(
      <RecipeParams variant="diff" rows={[{ label: 'Temperatura', value: '92,5 °C', before: '92 °C' }]} />,
    )
    expect(container.querySelector('s')).toHaveTextContent('92 °C')
    expect(screen.getByText('92,5 °C')).toBeInTheDocument()
    expect(screen.getByText('→')).toBeInTheDocument()
  })

  it('en fila: solo valores visibles, etiquetas para lectores de pantalla', () => {
    render(<RecipeParams variant="row" rows={rows} />)
    expect(screen.getByText('15 g')).toBeInTheDocument()
    expect(screen.getByText('Café')).toHaveClass('sr-only-text')
  })
})
