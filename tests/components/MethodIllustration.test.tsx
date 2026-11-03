import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MethodIllustration } from '@/components'

describe('MethodIllustration', () => {
  it('es decorativa y mide 126 × 94', () => {
    const { container } = render(<MethodIllustration method="v60" />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root).toHaveClass('h-[94px]', 'w-[126px]')
  })

  it('V60 usa los dos SVG exportados de Figma en sus posiciones', () => {
    const { container } = render(<MethodIllustration method="v60" />)
    const imgs = container.querySelectorAll('img')
    expect(imgs).toHaveLength(2)
    for (const img of imgs) {
      // Next sirve el archivo; Vite (tests) lo inlinea como data:image/svg+xml
      expect(img.getAttribute('src')).toMatch(/v60-(filtro|dripper)|^data:image\/svg\+xml/)
      expect(img).toHaveAttribute('alt', '')
    }
  })

  it('AeroPress y Espresso: placeholder sin imagen (P-08)', () => {
    const { container } = render(<MethodIllustration method="aeropress" />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.firstChild).toHaveAttribute('data-method', 'aeropress')
  })
})
