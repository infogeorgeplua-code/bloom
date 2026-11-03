import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChipGrid } from '@/components'

const options = [
  { value: 'a', label: 'Equilibrado' },
  { value: 'b', label: 'Brillante' },
  { value: 'c', label: 'Dulce' },
]

describe('ChipGrid', () => {
  it('selección única: radiogroup con una sola opción marcada', () => {
    const onChange = vi.fn()
    render(<ChipGrid aria-label="Objetivo" options={options} value="b" onChange={onChange} />)
    expect(screen.getByRole('radiogroup', { name: 'Objetivo' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Brillante' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: 'Dulce' }))
    expect(onChange).toHaveBeenCalledWith('c')
  })

  it('selección única: las flechas mueven la selección', () => {
    const onChange = vi.fn()
    render(<ChipGrid aria-label="Objetivo" options={options} value="a" onChange={onChange} />)
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Equilibrado' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('selección múltiple: aria-pressed y alternancia', () => {
    const onChange = vi.fn()
    render(<ChipGrid aria-label="Síntomas" columns={3} multiple options={options} value={['a']} onChange={onChange} />)
    expect(screen.getByRole('group', { name: 'Síntomas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Equilibrado' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Dulce' }))
    expect(onChange).toHaveBeenCalledWith(['a', 'c'])
    fireEvent.click(screen.getByRole('button', { name: 'Equilibrado' }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('los chips de la grilla miden 48 px', () => {
    render(<ChipGrid aria-label="Objetivo" options={options} value={null} onChange={() => {}} />)
    expect(screen.getByRole('radio', { name: 'Dulce' })).toHaveClass('h-12')
  })
})
