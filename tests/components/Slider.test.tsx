import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Slider } from '@/components'

describe('Slider', () => {
  it('muestra título, valor actual y escala', () => {
    render(
      <Slider title="Ratio" min={12} max={20} value={16} onChange={() => {}} valueText="1:16" scale={['1:12', '1:16', '1:20']} />,
    )
    expect(screen.getByText('Ratio')).toBeInTheDocument()
    expect(screen.getByText('1:16', { selector: 'span.t-num-md' })).toBeInTheDocument()
    expect(screen.getByText('1:20')).toBeInTheDocument()
  })

  it('usa un input range nativo y notifica el cambio', () => {
    const onChange = vi.fn()
    render(<Slider title="Ratio" min={12} max={20} value={16} onChange={onChange} valueText="1:16" scale={['a', 'b', 'c']} />)
    const input = screen.getByRole('slider', { name: 'Ratio' })
    fireEvent.change(input, { target: { value: '18' } })
    expect(onChange).toHaveBeenCalledWith(18)
  })

  it('range: dos thumbs que no se cruzan', () => {
    const onChange = vi.fn()
    render(
      <Slider range title="Temperatura" min={80} max={100} value={[85, 92]} onChange={onChange} valueText="85 – 92 °C" scale={['80', '90', '100']} />,
    )
    const [lo, hi] = [
      screen.getByRole('slider', { name: 'Temperatura, mínimo' }),
      screen.getByRole('slider', { name: 'Temperatura, máximo' }),
    ]
    fireEvent.change(lo, { target: { value: '95' } })
    expect(onChange).toHaveBeenLastCalledWith([92, 92])
    fireEvent.change(hi, { target: { value: '83' } })
    expect(onChange).toHaveBeenLastCalledWith([85, 85])
  })

  it('disabled deshabilita el input', () => {
    render(<Slider title="Molienda" min={0} max={30} value={18} onChange={() => {}} valueText="18" scale={['0', '15', '30']} disabled />)
    expect(screen.getByRole('slider')).toBeDisabled()
  })
})
