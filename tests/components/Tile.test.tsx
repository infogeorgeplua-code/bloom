import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Tile } from '@/components'

describe('Tile v1.2', () => {
  it('basic: label, valor y unidad', () => {
    render(<Tile label="Brews" value="9" unit="cafés" />)
    expect(screen.getByText('Brews')).toBeInTheDocument()
    expect(screen.getByText('9')).toHaveClass('t-num-lg')
  })

  it('meter (Stock): medidor de 10 segmentos, valor y caption', () => {
    render(<Tile content="meter" label="Stock" value="145" unit="g" caption="5 cafés en stock" level="ok" fill={6} />)
    expect(screen.getByRole('img', { name: /Stock: 6 de 10 segmentos\. 145 g, 5 cafés en stock/ })).toBeInTheDocument()
    expect(screen.getByText('145')).toHaveClass('t-num-lg')
    expect(screen.getByText('5 cafés en stock')).toBeInTheDocument()
  })

  it('orb (Este mes): orb outline de 115 px con el número', () => {
    render(<Tile content="orb" label="Este mes" value="20" caption="cafés" />)
    const value = screen.getByText('20')
    expect(value.parentElement).toHaveClass('size-[115px]')
    expect(screen.getByText('cafés')).toBeInTheDocument()
  })

  it('bar (método): barra en --text-1 (no crema, P-03) y porcentaje escrito', () => {
    const { container } = render(<Tile content="bar" label="V60" value="12" unit="brews" share={0.6} caption="60% del mes" />)
    const fill = container.querySelector('.bg-fg') as HTMLElement
    expect(fill).toHaveStyle({ width: '60%' })
    expect(container.querySelector('.bg-accent')).toBeNull()
    expect(screen.getByText('60% del mes')).toBeInTheDocument()
  })

  it('interactive es un botón completo', () => {
    const onClick = vi.fn()
    render(<Tile variant="interactive" label="Stock" value="145" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })

  it('alert: borde, valor en el color semántico e ícono (nunca solo color)', () => {
    const { container, rerender } = render(
      <Tile content="meter" variant="alert" tone="warning" label="Stock" value="62" unit="g" caption="x" level="low" fill={3} />,
    )
    expect(container.firstChild).toHaveClass('border-warning')
    expect(container.querySelector('svg.lucide-triangle-alert')).not.toBeNull()
    rerender(<Tile variant="alert" tone="danger" label="Stock" value="18" />)
    expect(container.firstChild).toHaveClass('border-danger')
    expect(screen.getByText('18').parentElement).toHaveClass('text-danger')
  })

  it('aspecto 1x1 y 2x1', () => {
    const { container, rerender } = render(<Tile label="A" />)
    expect(container.firstChild).toHaveClass('aspect-square')
    rerender(<Tile label="A" aspect="2x1" />)
    expect(container.firstChild).toHaveClass('aspect-[2/1]')
  })
})
