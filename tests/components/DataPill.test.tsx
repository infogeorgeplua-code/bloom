import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataPill } from '@/components'

describe('DataPill', () => {
  it('muestra label, valor en mono y estado', () => {
    render(<DataPill label="Tueste" value="12 días" status="En ventana ideal" />)
    expect(screen.getByText('Tueste')).toBeInTheDocument()
    expect(screen.getByText('12 días')).toHaveClass('t-num-md')
    expect(screen.getByText('En ventana ideal')).toBeInTheDocument()
  })

  it('mide 88 px de alto y es una píldora', () => {
    const { container } = render(<DataPill label="Stock" value="145 g" status="~9 preparaciones" />)
    expect(container.firstChild).toHaveClass('h-22', 'rounded-pill')
  })
})
