import { fireEvent, render, screen } from '@testing-library/react'
import { Pause } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { IconButton } from '@/components'

describe('IconButton', () => {
  it('expone aria-label y es un botón nativo', () => {
    render(<IconButton label="Pausar" icon={Pause} />)
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  })

  it('md = 48 px y xl = 64 px', () => {
    const { rerender } = render(<IconButton label="Pausar" icon={Pause} />)
    expect(screen.getByRole('button')).toHaveClass('size-12')
    rerender(<IconButton label="Pausar" icon={Pause} size="xl" />)
    expect(screen.getByRole('button')).toHaveClass('size-16')
  })

  it('soporta variantes y disabled', () => {
    const onClick = vi.fn()
    render(<IconButton label="Cerrar" icon={Pause} variant="ghost" disabled onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
