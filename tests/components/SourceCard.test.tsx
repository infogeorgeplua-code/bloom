import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SourceCard } from '@/components'

describe('SourceCard', () => {
  it('muestra BASE, nombre, contexto, adaptación y enlace seguro', () => {
    render(
      <SourceCard
        name="Tetsu Kasuya · Método 4:6"
        context="World Brewers Cup 2016"
        adaptation="Adaptación: ratio 1:15"
        href="https://wcc.coffee"
        linkText="wcc.coffee"
        status="verificado"
      />,
    )
    expect(screen.getByText('BASE')).toBeInTheDocument()
    expect(screen.getByText('Verificado')).toBeInTheDocument()
    expect(screen.getByText('Tetsu Kasuya · Método 4:6')).toHaveClass('font-semibold')
    const link = screen.getByRole('link', { name: /wcc\.coffee/ })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('variante historial: estrella de receta bloqueada en lugar del TrustBadge', () => {
    render(<SourceCard history name="Tu V3 de este café" context="Bloqueada el 14 nov" />)
    expect(screen.getByText('HISTORIAL')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Receta bloqueada' })).toBeInTheDocument()
    expect(screen.queryByText('Verificado')).not.toBeInTheDocument()
  })

  it('estado inferido se comunica con texto', () => {
    render(<SourceCard name="Regla técnica" status="inferido" />)
    expect(screen.getByText('Inferido')).toBeInTheDocument()
  })
})
