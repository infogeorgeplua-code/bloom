import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Banner } from '@/components'

describe('Banner', () => {
  it.each([
    ['neutral', 'border-l-line-strong'],
    ['warning', 'border-l-warning'],
    ['danger', 'border-l-danger'],
    ['success', 'border-l-success'],
  ] as const)('tono %s tiene su borde izquierdo semántico', (tone, cls) => {
    const { container } = render(<Banner tone={tone}>Mensaje</Banner>)
    expect(container.firstChild).toHaveClass(cls, 'border-l-[3px]')
  })

  it('danger se anuncia como alert y el resto como status', () => {
    const { rerender } = render(<Banner tone="danger">Error</Banner>)
    expect(screen.getByRole('alert')).toHaveTextContent('Error')
    rerender(<Banner tone="neutral">Info</Banner>)
    expect(screen.getByRole('status')).toHaveTextContent('Info')
  })

  it('muestra un ícono de 20 px y la acción opcional', () => {
    const { container } = render(
      <Banner tone="warning" action={<button type="button">Agregar</button>}>
        Falta información
      </Banner>,
    )
    expect(container.querySelector('svg')).toHaveAttribute('width', '20')
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument()
  })
})
