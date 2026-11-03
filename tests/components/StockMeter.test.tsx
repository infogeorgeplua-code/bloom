import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StockMeter } from '@/components'

describe('StockMeter (D-09)', () => {
  it('ok: "145 g · ~9 preparaciones" en --text-1', () => {
    render(<StockMeter level="ok" gramsText="145 g" preparations={9} fill={6} />)
    expect(screen.getByText('145 g · ~9 preparaciones')).toHaveClass('text-fg')
  })

  it('bajo: copy de aviso, color warning e ícono', () => {
    const { container } = render(<StockMeter level="low" gramsText="42 g" preparations={3} fill={2} />)
    expect(screen.getByText('Te queda poco: ~3 preparaciones')).toHaveClass('text-warning')
    expect(container.querySelector('svg.lucide-triangle-alert')).not.toBeNull()
  })

  it('crítico: "Alcanza para 1 preparación más" en danger con ícono', () => {
    const { container } = render(<StockMeter level="critical" gramsText="22 g" preparations={1} fill={1} />)
    expect(screen.getByText('Alcanza para 1 preparación más')).toHaveClass('text-danger')
    expect(container.querySelector('svg.lucide-circle-alert')).not.toBeNull()
  })

  it('agotado: copy y acción "Marcar como terminado"', () => {
    const onMarkFinished = vi.fn()
    render(<StockMeter level="depleted" gramsText="9 g" preparations={0} fill={0} onMarkFinished={onMarkFinished} />)
    expect(screen.getByText('No alcanza para otra taza. ¿Lo marcamos como terminado?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como terminado' }))
    expect(onMarkFinished).toHaveBeenCalled()
  })

  it('10 segmentos; los llenos dependen de fill y el estado no depende solo del color', () => {
    const { container } = render(<StockMeter level="low" gramsText="42 g" preparations={3} fill={4} />)
    const segments = container.querySelectorAll('[role="img"] > span')
    expect(segments).toHaveLength(10)
    expect([...segments].filter((s) => s.classList.contains('bg-warning'))).toHaveLength(4)
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Te queda poco')
  })

  it('compacto: segmentos de 6 × 12 px y sin texto visible', () => {
    const { container } = render(<StockMeter size="compact" level="ok" gramsText="145 g" preparations={9} fill={6} />)
    expect(container.querySelector('[role="img"] > span')).toHaveClass('h-3', 'w-1.5')
    expect(screen.queryByText('145 g · ~9 preparaciones')).not.toBeInTheDocument()
  })
})
