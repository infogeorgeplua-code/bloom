import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl } from '@/components'

const options = [
  { value: 'v60', label: 'V60' },
  { value: 'aero', label: 'AeroPress' },
  { value: 'esp', label: 'Espresso' },
]

describe('SegmentedControl', () => {
  it('usa tablist/tab con aria-selected', () => {
    render(<SegmentedControl aria-label="Método" options={options} value="aero" onChange={() => {}} />)
    expect(screen.getByRole('tablist', { name: 'Método' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'AeroPress' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'V60' })).toHaveAttribute('aria-selected', 'false')
  })

  it('cambia con click y con flechas', () => {
    const onChange = vi.fn()
    render(<SegmentedControl aria-label="Método" options={options} value="v60" onChange={onChange} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Espresso' }))
    expect(onChange).toHaveBeenLastCalledWith('esp')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'V60' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith('aero')
  })

  it('salta los segmentos deshabilitados con el teclado', () => {
    const onChange = vi.fn()
    const opts = [options[0]!, { ...options[1]!, disabled: true }, options[2]!]
    render(<SegmentedControl aria-label="Método" options={opts} value="v60" onChange={onChange} />)
    fireEvent.keyDown(screen.getByRole('tab', { name: 'V60' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith('esp')
  })
})
