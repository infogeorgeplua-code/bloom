import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressDots } from '@/components'

describe('ProgressDots', () => {
  it('cuenta todos los pasos y expone progressbar con texto', () => {
    render(<ProgressDots total={6} current={2} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '2')
    expect(bar).toHaveAttribute('aria-valuemax', '6')
    expect(bar).toHaveAttribute('aria-valuetext', 'Paso 2 de 6')
  })

  it('completado, actual (pill de 20 px) y pendiente', () => {
    const { container } = render(<ProgressDots total={5} current={3} />)
    const dots = container.querySelectorAll('[aria-hidden="true"] > span')
    expect(dots).toHaveLength(5)
    expect(dots[0]).toHaveClass('bg-fg', 'w-2')
    expect(dots[2]).toHaveClass('bg-accent', 'w-5')
    expect(dots[4]).toHaveClass('bg-track', 'w-2')
  })

  it('el actual es el primero cuando current = 1 (paso de preparación)', () => {
    const { container } = render(<ProgressDots total={6} current={1} />)
    expect(container.querySelectorAll('.bg-accent')).toHaveLength(1)
    expect(container.querySelectorAll('.bg-fg')).toHaveLength(0)
  })

  it('se puede centrar (Brew Mode con tiempo) con gap de 12 px hasta el texto', () => {
    const { rerender } = render(<ProgressDots total={6} current={2} />)
    expect(screen.getByRole('progressbar')).toHaveClass('gap-3')
    expect(screen.getByRole('progressbar')).not.toHaveClass('justify-center')
    rerender(<ProgressDots total={6} current={2} align="center" />)
    expect(screen.getByRole('progressbar')).toHaveClass('justify-center')
  })
})
