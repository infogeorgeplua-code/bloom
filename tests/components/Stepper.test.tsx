import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Stepper } from '@/components'

describe('Stepper', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('+ y − cambian el valor con el paso dado', () => {
    const onChange = vi.fn()
    render(<Stepper aria-label="Gramos" value={15} onChange={onChange} step={0.5} />)
    const plus = screen.getByRole('button', { name: 'Aumentar' })
    fireEvent.pointerDown(plus)
    fireEvent.pointerUp(plus)
    expect(onChange).toHaveBeenLastCalledWith(15.5)
  })

  it('deshabilita − en el mínimo y + en el máximo', () => {
    const { rerender } = render(<Stepper aria-label="Tazas" value={1} min={1} max={6} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Disminuir' })).toBeDisabled()
    rerender(<Stepper aria-label="Tazas" value={6} min={1} max={6} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Aumentar' })).toBeDisabled()
  })

  it('mantener pulsado acelera: espera 400 ms y repite cada 120 ms', () => {
    const onChange = vi.fn()
    render(<Stepper aria-label="Gramos" value={10} onChange={onChange} />)
    const plus = screen.getByRole('button', { name: 'Aumentar' })
    fireEvent.pointerDown(plus)
    expect(onChange).toHaveBeenCalledTimes(1)
    act(() => {
      vi.advanceTimersByTime(399)
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    act(() => {
      vi.advanceTimersByTime(1 + 120 * 3)
    })
    expect(onChange).toHaveBeenCalledTimes(4)
    fireEvent.pointerUp(plus)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(onChange).toHaveBeenCalledTimes(4)
  })

  it('muestra el texto formateado en el valor central', () => {
    render(<Stepper aria-label="Gramos" value={15} onChange={() => {}} display="15 g" />)
    expect(screen.getByRole('status')).toHaveTextContent('15 g')
  })
})
