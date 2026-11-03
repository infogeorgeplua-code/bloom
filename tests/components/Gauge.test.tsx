import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DialInput, Gauge } from '@/components'

describe('Gauge', () => {
  it('expone la lectura como imagen con nombre y valor', () => {
    render(<Gauge aria-label="Temperatura" min={80} max={100} value={92} valueText="92 °C" />)
    expect(screen.getByRole('img', { name: 'Temperatura: 92 °C' })).toBeInTheDocument()
    expect(screen.getByText('92 °C')).toHaveClass('t-num-lg')
  })

  it('acepta arcos de 180° y 270°', () => {
    const { container, rerender } = render(<Gauge aria-label="T" min={0} max={10} value={5} sweep={180} />)
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 200 130')
    rerender(<Gauge aria-label="T" min={0} max={10} value={5} sweep={270} />)
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 200 200')
  })
})

describe('DialInput', () => {
  it('es un slider accesible con valuemin, valuemax y valuenow', () => {
    render(<DialInput aria-label="Temperatura" min={80} max={100} value={92} onChange={() => {}} />)
    const slider = screen.getByRole('slider', { name: 'Temperatura' })
    expect(slider).toHaveAttribute('aria-valuemin', '80')
    expect(slider).toHaveAttribute('aria-valuemax', '100')
    expect(slider).toHaveAttribute('aria-valuenow', '92')
  })

  it('las flechas cambian el valor ±step y se acota al rango', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <DialInput aria-label="Temperatura" min={80} max={100} step={0.5} value={92} onChange={onChange} />,
    )
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Temperatura' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith(92.5)
    rerender(<DialInput aria-label="Temperatura" min={80} max={100} step={1} value={100} onChange={onChange} />)
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Temperatura' }), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith(100)
  })

  it('incluye la alternativa obligatoria con Stepper', () => {
    render(<DialInput aria-label="Temperatura" min={80} max={100} value={92} onChange={() => {}} />)
    expect(screen.getByRole('group', { name: 'Temperatura (ajuste fino)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aumentar' })).toBeInTheDocument()
  })
})
