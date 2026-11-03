import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ListRow } from '@/components'

describe('ListRow v1.2', () => {
  it('muestra título y solo el proceso como subtítulo', () => {
    render(<ListRow title="El Paraíso Sidra" subtitle="Natural anaeróbico" />)
    expect(screen.getByText('El Paraíso Sidra')).toBeInTheDocument()
    expect(screen.getByText('Natural anaeróbico')).toHaveClass('t-label')
  })

  it('gramos en mono con "g" en caption, sin StockMeter', () => {
    render(<ListRow title="Café" grams="145" />)
    expect(screen.getByText('145')).toHaveClass('num')
    expect(screen.getByText('g')).toHaveClass('t-caption')
    expect(screen.queryByRole('img', { name: /Stock:/ })).not.toBeInTheDocument()
  })

  it('stock bajo: color warning y además ícono (nunca solo color)', () => {
    render(<ListRow title="Etiopía" grams="42" low />)
    expect(screen.getByText('42').parentElement).toHaveClass('text-warning')
    expect(screen.getByRole('img', { name: 'Stock bajo' })).toBeInTheDocument()
  })

  it('con onClick es un botón; con href es un enlace', () => {
    const onClick = vi.fn()
    const { rerender } = render(<ListRow title="Café" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
    rerender(<ListRow title="Café" href="/coffee/1" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/coffee/1')
  })

  it('alto 72 con divisor inferior', () => {
    const { container } = render(<ListRow title="Café" />)
    expect(container.firstChild).toHaveClass('h-[72px]', 'border-b', 'border-line')
  })
})
