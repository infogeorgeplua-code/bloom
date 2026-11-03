import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Orb } from '@/components'

describe('Orb', () => {
  it.each([
    ['sm', 'size-24'],
    ['md', 'size-40'],
    ['lg', 'size-[220px]'],
  ] as const)('tamaño %s', (size, cls) => {
    const { container } = render(<Orb size={size} value="9" />)
    expect(container.firstChild).toHaveClass(cls)
  })

  it('sólido usa el relleno orb y outline no', () => {
    const { container, rerender } = render(<Orb value="9" />)
    expect(container.firstChild).toHaveClass('bg-orb')
    rerender(<Orb variant="outline" value="9" />)
    expect(container.firstChild).not.toHaveClass('bg-orb')
  })

  it('action es un botón "Hacer café"', () => {
    const onClick = vi.fn()
    render(<Orb variant="action" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Hacer café' }))
    expect(onClick).toHaveBeenCalled()
  })
})
