'use client'

import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface TextFieldBase {
  label: string
  error?: string
  /** Unidad al final, para campos numéricos: "g", "°C" */
  suffix?: string
  className?: string
}

export interface TextFieldProps
  extends TextFieldBase,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'> {
  /** Activa inputMode="decimal" (DS §3.21) */
  numeric?: boolean
  multiline?: false
}

export interface TextAreaFieldProps
  extends TextFieldBase,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  multiline: true
}

const SHELL =
  'peer w-full bg-transparent px-4 text-fg outline-none placeholder-transparent disabled:cursor-not-allowed disabled:text-fg-disabled'

function Frame({
  id,
  label,
  error,
  suffix,
  className,
  children,
}: TextFieldBase & { id: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <div
        className={cn(
          'relative rounded-field border-2 bg-surface-2 transition-colors duration-(--dur-fast) ease-(--ease-standard)',
          error ? 'border-danger' : 'border-transparent focus-within:border-accent',
        )}
      >
        {children}
        <label
          htmlFor={id}
          className={cn(
            't-caption pointer-events-none absolute left-4 top-1.5 text-fg-3 transition-all duration-(--dur-fast) ease-(--ease-standard)',
            'peer-placeholder-shown:top-4 peer-placeholder-shown:text-[length:var(--fs-body)]',
            'peer-focus:top-1.5 peer-focus:text-[length:var(--fs-caption)]',
          )}
        >
          {label}
        </label>
        {suffix ? (
          <span className="t-body pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-fg-3">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="t-caption mt-1 px-1 text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Campo de texto con label flotante (DS §3.21).
 * TODO(ds): la variante multilínea no está en DS §3.21, pero DS §4.4 la usa para
 * "Agregar nota". Se implementa con los mismos tokens; George debe confirmarla.
 */
export function TextField(props: TextFieldProps | TextAreaFieldProps) {
  const id = useId()

  if (props.multiline) {
    const { label, error, suffix, className, multiline: _multiline, ...rest } = props
    void _multiline
    return (
      <Frame id={id} label={label} error={error} suffix={suffix} className={className}>
        <textarea
          id={id}
          placeholder=" "
          rows={3}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(SHELL, 't-body min-h-24 resize-none pt-6 pb-2', suffix && 'pr-12')}
          {...rest}
        />
      </Frame>
    )
  }

  const { label, error, suffix, className, numeric, multiline: _multiline, ...rest } = props
  void _multiline
  return (
    <Frame id={id} label={label} error={error} suffix={suffix} className={className}>
      <input
        id={id}
        placeholder=" "
        inputMode={numeric ? 'decimal' : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(SHELL, 't-body h-14 pt-5', numeric && 'num', suffix && 'pr-12')}
        {...rest}
      />
    </Frame>
  )
}
