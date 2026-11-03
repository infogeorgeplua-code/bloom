'use client'

import { useId, type CSSProperties } from 'react'
import { cn } from '@/lib/cn'

interface SliderBase {
  title: string
  min: number
  max: number
  step?: number
  /** Texto del valor actual en el header (ya formateado) */
  valueText: string
  /** Marcas de la escala debajo del track; mínimo 3 (DS §3.10) */
  scale: string[]
  disabled?: boolean
  className?: string
}

export interface SingleSliderProps extends SliderBase {
  range?: false
  value: number
  onChange: (value: number) => void
}

export interface RangeSliderProps extends SliderBase {
  range: true
  value: [number, number]
  onChange: (value: [number, number]) => void
}

export type SliderProps = SingleSliderProps | RangeSliderProps

const pct = (v: number, min: number, max: number) => ((v - min) / (max - min)) * 100

export function Slider(props: SliderProps) {
  const { title, min, max, step = 1, valueText, scale, disabled, className } = props
  const id = useId()

  const style = (lo: number, hi: number): CSSProperties =>
    ({ '--pct-lo': `${lo}%`, '--pct-hi': `${hi}%` }) as CSSProperties

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={`${id}-a`} className="t-title text-fg">
          {title}
        </label>
        <span className="t-num-md text-fg">{valueText}</span>
      </div>

      {props.range ? (
        <div className="relative h-7" role="group" aria-label={title}>
          <input
            id={`${id}-a`}
            type="range"
            aria-label={`${title}, mínimo`}
            className="bloom-range bloom-range-pair"
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            value={props.value[0]}
            style={style(pct(props.value[0], min, max), pct(props.value[1], min, max))}
            onChange={(e) =>
              props.onChange([Math.min(Number(e.target.value), props.value[1]), props.value[1]])
            }
          />
          <input
            type="range"
            aria-label={`${title}, máximo`}
            className="bloom-range bloom-range-pair"
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            value={props.value[1]}
            style={style(pct(props.value[0], min, max), pct(props.value[1], min, max))}
            onChange={(e) =>
              props.onChange([props.value[0], Math.max(Number(e.target.value), props.value[0])])
            }
          />
        </div>
      ) : (
        <input
          id={`${id}-a`}
          type="range"
          className="bloom-range"
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          value={props.value}
          aria-valuetext={valueText}
          style={style(0, pct(props.value, min, max))}
          onChange={(e) => props.onChange(Number(e.target.value))}
        />
      )}

      <div className="t-caption num flex justify-between text-fg-3" aria-hidden="true">
        {scale.map((mark, i) => (
          <span key={`${mark}-${i}`}>{mark}</span>
        ))}
      </div>
    </div>
  )
}
