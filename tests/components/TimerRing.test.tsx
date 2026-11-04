import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TimerRing } from '@/components'

const progress = (container: HTMLElement) =>
  container.querySelector('circle.stroke-accent') as SVGCircleElement
const CIRC = 2 * Math.PI * 126

describe('TimerRing v1.2', () => {
  it('es un timer sin anuncios en vivo y expone el tiempo en data-elapsed-ms', () => {
    render(<TimerRing mode="grams" elapsedMs={12345.6} durationMs={40000} primary="45" />)
    const ring = screen.getByRole('timer')
    expect(ring).toHaveAttribute('aria-live', 'off')
    expect(ring).toHaveAttribute('data-elapsed-ms', '12346')
  })

  it('el anillo avanza linealmente con el tiempo transcurrido y se acota a 0–100 %', () => {
    const { container, rerender } = render(<TimerRing mode="grams" elapsedMs={0} durationMs={40000} primary="45" />)
    expect(Number(progress(container).getAttribute('stroke-dashoffset'))).toBeCloseTo(CIRC, 1)
    rerender(<TimerRing mode="grams" elapsedMs={20000} durationMs={40000} primary="45" />)
    expect(Number(progress(container).getAttribute('stroke-dashoffset'))).toBeCloseTo(CIRC / 2, 1)
    rerender(<TimerRing mode="grams" elapsedMs={99999} durationMs={40000} primary="45" />)
    expect(Number(progress(container).getAttribute('stroke-dashoffset'))).toBe(0)
  })

  it('sin ticks: solo track y progreso, con puntas redondas', () => {
    const { container } = render(<TimerRing mode="grams" elapsedMs={0} durationMs={1000} primary="1" />)
    expect(container.querySelectorAll('line')).toHaveLength(0)
    expect(container.querySelectorAll('circle')).toHaveLength(2)
    expect(progress(container)).toHaveAttribute('stroke-linecap', 'round')
  })

  it('modo gramos: "Vierte agua hasta" encima del número en num-hero, sin "acumulado"', () => {
    render(<TimerRing mode="grams" elapsedMs={0} durationMs={1000} primary="45" />)
    expect(screen.getByText('Vierte agua hasta')).toBeInTheDocument()
    expect(screen.getByText('45')).toHaveClass('t-num-hero')
    expect(screen.getByText('g')).toBeInTheDocument()
    expect(screen.queryByText(/acumulado/)).not.toBeInTheDocument()
  })

  it('modo tiempo: "tiempo total" + num-time', () => {
    render(<TimerRing mode="time" elapsedMs={0} durationMs={1000} primary="2:47" />)
    expect(screen.getByText('tiempo total')).toBeInTheDocument()
    expect(screen.getByText('2:47')).toHaveClass('t-num-time')
  })

  it('línea de estado: restantes en crema, "Cambia en N s" (P-06), siguiente, en ventana y sobre la meta', () => {
    const { rerender } = render(
      <TimerRing mode="grams" elapsedMs={0} durationMs={1000} primary="45" status={{ kind: 'remaining', seconds: 31 }} />,
    )
    expect(screen.getByText('31 s restantes')).toHaveClass('text-accent', 't-title')
    rerender(<TimerRing mode="grams" elapsedMs={0} durationMs={1000} primary="45" status={{ kind: 'changing', seconds: 3 }} />)
    expect(screen.getByText('Cambia en 3 s')).toHaveClass('text-accent')
    rerender(<TimerRing mode="grams" elapsedMs={0} durationMs={1000} primary="45" status={{ kind: 'next', seconds: 5 }} />)
    expect(screen.getByText('Siguiente en 5 s')).toBeInTheDocument()
    rerender(<TimerRing mode="time" elapsedMs={0} durationMs={1000} primary="2:47" status={{ kind: 'inWindow' }} />)
    expect(screen.getByText('En la ventana objetivo')).toHaveClass('text-success')
    rerender(<TimerRing mode="time" elapsedMs={0} durationMs={1000} primary="3:12" status={{ kind: 'over', text: '+0:12 sobre la meta' }} />)
    expect(screen.getByText('+0:12 sobre la meta')).not.toHaveClass('text-accent')
  })

  it('el diámetro se puede fijar; pausado se marca en el DOM', () => {
    render(<TimerRing mode="grams" elapsedMs={0} durationMs={1000} primary="1" diameter="200px" paused />)
    expect(screen.getByRole('timer')).toHaveStyle({ width: '200px' })
    expect(screen.getByRole('timer')).toHaveAttribute('data-paused', 'true')
  })
})
