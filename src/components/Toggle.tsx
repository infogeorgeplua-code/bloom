import { cn } from '@/lib/cn'

export interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

/** Fila completa clicable de 48 px, label a la izquierda (DS §3.11). */
export function Toggle({ label, checked, onChange, disabled, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex min-h-12 w-full items-center justify-between gap-4 text-left disabled:cursor-not-allowed',
        className,
      )}
    >
      <span className={cn('t-body-lg', disabled ? 'text-fg-disabled' : 'text-fg')}>{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-block h-8 w-[52px] shrink-0 rounded-pill transition-colors duration-(--dur-fast) ease-(--ease-standard)',
          checked ? 'bg-inverse' : 'bg-line',
          disabled && 'opacity-40',
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 size-6 rounded-pill transition-transform duration-(--dur-fast) ease-(--ease-standard)',
            checked ? 'translate-x-5 bg-fg-inverse' : 'translate-x-0 bg-fg',
          )}
        />
      </span>
    </button>
  )
}
