import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Toggle } from '@/components'

describe('Toggle', () => {
  it('es un switch con aria-checked', () => {
    const { rerender } = render(<Toggle label="Vibración" checked={false} onChange={() => {}} />)
    expect(screen.getByRole('switch', { name: 'Vibración' })).toHaveAttribute('aria-checked', 'false')
    rerender(<Toggle label="Vibración" checked onChange={() => {}} />)
    expect(screen.getByRole('switch', { name: 'Vibración' })).toHaveAttribute('aria-checked', 'true')
  })

  it('toda la fila es clicable y alterna el valor', () => {
    const onChange = vi.fn()
    render(<Toggle label="Sonido" checked={false} onChange={onChange} />)
    fireEvent.click(screen.getByText('Sonido'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('la fila mide al menos 48 px', () => {
    render(<Toggle label="Sonido" checked={false} onChange={() => {}} />)
    expect(screen.getByRole('switch')).toHaveClass('min-h-12')
  })

  it('disabled no cambia', () => {
    const onChange = vi.fn()
    render(<Toggle label="Sonido" checked={false} onChange={onChange} disabled />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
