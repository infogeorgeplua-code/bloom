import { render, screen } from '@testing-library/react'
import { Droplet } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { StepTimeline } from '@/components'

const steps = [
  { id: 'a', kind: 'prep' as const, name: 'Prepara' },
  { id: 'b', kind: 'timed' as const, name: 'Bloom', icon: Droplet, goal: '45', windowText: '0:00 – 0:40' },
]

describe('StepTimeline (Figma 02 · StepRow)', () => {
  it('lista ordenada con un ítem por paso, filas de 56 px con divisor', () => {
    render(<StepTimeline steps={steps} />)
    expect(screen.getByRole('list', { name: 'Pasos de la receta' })).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveClass('h-14', 'border-b')
  })

  it('el paso de preparación dice "Preparación" y no tiene meta ni ventana', () => {
    render(<StepTimeline steps={steps} />)
    const prep = screen.getAllByRole('listitem')[0]!
    expect(prep).toHaveTextContent('Preparación')
    expect(prep).not.toHaveTextContent(/\d+\sg|\d:\d\d/)
  })

  it('el paso con tiempo muestra la meta en num-sm con "g" y la ventana en mono', () => {
    render(<StepTimeline steps={steps} />)
    expect(screen.getByText('45')).toHaveClass('t-num-sm')
    expect(screen.getByText('0:00 – 0:40')).toHaveClass('num')
  })
})
