import { fireEvent, render, screen } from '@testing-library/react'
import { Play } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/components'

describe('Button', () => {
  it.each(['primary', 'secondary', 'tertiary', 'danger'] as const)('renderiza la variante %s', (variant) => {
    render(<Button variant={variant}>Preparar ahora</Button>)
    expect(screen.getByRole('button', { name: 'Preparar ahora' })).toBeInTheDocument()
  })

  it.each([
    ['md', 'h-12'],
    ['lg', 'h-14'],
    ['xl', 'h-16'],
  ] as const)('tamaño %s usa %s (48/56/64 px)', (size, cls) => {
    render(<Button size={size}>Ok</Button>)
    expect(screen.getByRole('button')).toHaveClass(cls)
  })

  it('dispara onClick y respeta disabled', () => {
    const onClick = vi.fn()
    const { rerender } = render(<Button onClick={onClick}>Ok</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(
      <Button onClick={onClick} disabled>
        Ok
      </Button>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('loading mantiene el texto, bloquea el click y marca aria-busy', () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Guardando
      </Button>,
    )
    const b = screen.getByRole('button', { name: 'Guardando' })
    expect(b).toBeDisabled()
    expect(b).toHaveAttribute('aria-busy', 'true')
    fireEvent.click(b)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('con dato lo muestra en mono tabular', () => {
    render(
      <Button datum="15 g" icon={Play}>
        Café
      </Button>,
    )
    expect(screen.getByText('15 g')).toHaveClass('num')
  })
})
