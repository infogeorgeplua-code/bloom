import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CoffeeHero } from '@/components'

const params = [
  { value: '15', unit: 'g', label: 'Café' },
  { value: '240', unit: 'g', label: 'Agua' },
  { value: '92', unit: '°C', label: 'Temp.' },
  { value: '1:16', label: 'Ratio' },
]

describe('CoffeeHero', () => {
  it('eyebrow en label (11 px), nombre en title-md y subtítulo', () => {
    render(<CoffeeHero name="El Paraíso Sidra" method="v60" subtitle="V60 · Receta V3" params={params} />)
    expect(screen.getByText('Tu café habitual')).toHaveClass('t-label')
    expect(screen.getByRole('heading', { name: 'El Paraíso Sidra' })).toHaveClass('t-title-md')
    expect(screen.getByText('V60 · Receta V3')).toBeInTheDocument()
  })

  it('receta bloqueada: estrella con aria-label', () => {
    render(<CoffeeHero name="X" method="v60" subtitle="V60 · Receta V3" locked params={params} />)
    expect(screen.getByRole('img', { name: 'Receta bloqueada' })).toBeInTheDocument()
  })

  it('parámetros en num-sm con su rótulo y la ilustración del método', () => {
    const { container } = render(<CoffeeHero name="X" method="v60" subtitle="s" params={params} />)
    expect(screen.getByText('240')).toHaveClass('t-num-sm')
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['Café', 'Agua', 'Temp.', 'Ratio'])
    expect(container.querySelector('[data-method="v60"]')).not.toBeNull()
  })

  it('"Preparar ahora" llama a onPrepare', () => {
    const onPrepare = vi.fn()
    render(<CoffeeHero name="X" method="v60" subtitle="s" params={params} onPrepare={onPrepare} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preparar ahora' }))
    expect(onPrepare).toHaveBeenCalled()
  })

  it('vacío: "Prepara tu primer café" + botón', () => {
    render(<CoffeeHero empty />)
    expect(screen.getByText('Prepara tu primer café')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Preparar ahora' })).toBeInTheDocument()
  })
})
