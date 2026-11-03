import { fireEvent, render, screen } from '@testing-library/react'
import { Coffee } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { Chip } from '@/components'

describe('Chip', () => {
  it('alterna con aria-pressed', () => {
    const { rerender } = render(<Chip selected={false}>Lavado</Chip>)
    expect(screen.getByRole('button', { name: 'Lavado' })).toHaveAttribute('aria-pressed', 'false')
    rerender(<Chip selected>Lavado</Chip>)
    expect(screen.getByRole('button', { name: 'Lavado' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('semántica radio usa role=radio y aria-checked', () => {
    render(
      <Chip semantics="radio" selected>
        Dulce
      </Chip>,
    )
    expect(screen.getByRole('radio', { name: 'Dulce' })).toHaveAttribute('aria-checked', 'true')
  })

  it('selected usa el fondo inverso y disabled no responde', () => {
    const onClick = vi.fn()
    render(
      <Chip selected disabled onClick={onClick} icon={Coffee}>
        Natural
      </Chip>,
    )
    const chip = screen.getByRole('button', { name: 'Natural' })
    expect(chip).toHaveClass('bg-inverse')
    fireEvent.click(chip)
    expect(onClick).not.toHaveBeenCalled()
  })
})
