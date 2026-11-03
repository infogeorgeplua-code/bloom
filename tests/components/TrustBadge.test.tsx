import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TrustBadge } from '@/components'

describe('TrustBadge', () => {
  it('observado, verificado e inferido con su texto', () => {
    const { rerender } = render(<TrustBadge status="observado" />)
    expect(screen.getByText('Observado')).toHaveClass('text-fg-2')
    rerender(<TrustBadge status="verificado" />)
    expect(screen.getByText('Verificado')).toHaveClass('text-success')
    rerender(<TrustBadge status="inferido" />)
    expect(screen.getByText('Inferido')).toHaveClass('text-warning')
  })

  it('inferido lleva borde punteado y glifo ≈', () => {
    render(<TrustBadge status="inferido" />)
    const badge = screen.getByText('Inferido')
    expect(badge).toHaveClass('border-dashed')
    expect(badge).toHaveTextContent('≈')
  })

  it('verificado e observado llevan borde sólido', () => {
    const { rerender } = render(<TrustBadge status="verificado" />)
    expect(screen.getByText('Verificado')).toHaveClass('border-solid')
    rerender(<TrustBadge status="observado" />)
    expect(screen.getByText('Observado')).toHaveClass('border-solid')
  })

  it('inline: solo ícono con aria-label y tooltip al tocar', () => {
    render(<TrustBadge status="verificado" inline />)
    const btn = screen.getByRole('button', { name: 'Verificado' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Verificado')
    fireEvent.keyDown(btn, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('el badge completo mide 24 px', () => {
    render(<TrustBadge status="observado" />)
    expect(screen.getByText('Observado')).toHaveClass('h-6', 'rounded-pill')
  })
})
