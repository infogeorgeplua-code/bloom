import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TextField } from '@/components'

describe('TextField', () => {
  it('asocia el label con el input', () => {
    render(<TextField label="Nombre del café" />)
    expect(screen.getByLabelText('Nombre del café')).toBeInTheDocument()
  })

  it('propaga el cambio de valor', () => {
    const onChange = vi.fn()
    render(<TextField label="Tostador" value="" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Tostador'), { target: { value: 'Altiplano' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('error: aria-invalid, mensaje enlazado y borde danger', () => {
    const { container } = render(<TextField label="Nombre" error="Escribe el nombre." />)
    const input = screen.getByLabelText('Nombre')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Escribe el nombre.')
    expect(container.querySelector('.border-danger')).not.toBeNull()
  })

  it('numérico: inputMode decimal, mono y sufijo de unidad', () => {
    render(<TextField label="Peso" numeric suffix="g" />)
    const input = screen.getByLabelText('Peso')
    expect(input).toHaveAttribute('inputmode', 'decimal')
    expect(input).toHaveClass('num')
    expect(screen.getByText('g')).toBeInTheDocument()
  })

  it('disabled', () => {
    render(<TextField label="Origen" disabled />)
    expect(screen.getByLabelText('Origen')).toBeDisabled()
  })

  it('multilínea usa textarea', () => {
    render(<TextField multiline label="Nota" />)
    expect(screen.getByLabelText('Nota').tagName).toBe('TEXTAREA')
  })

  it('el borde de foco usa accent solo en foco', () => {
    const { container } = render(<TextField label="Nombre" />)
    expect(container.querySelector('.focus-within\\:border-accent')).not.toBeNull()
  })
})
