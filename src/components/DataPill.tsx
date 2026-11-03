import { cn } from '@/lib/cn'

export interface DataPillProps {
  /** "TUESTE" */
  label: string
  /** "12 días" */
  value: string
  /** "En ventana ideal" */
  status: string
  className?: string
}

/** Dato con estado en una píldora de 88 px (DS §3.8). */
export function DataPill({ label, value, status, className }: DataPillProps) {
  return (
    <div
      className={cn(
        'flex h-22 flex-col justify-center gap-1 rounded-pill bg-surface-2 px-6',
        className,
      )}
    >
      <p className="flex items-baseline gap-2">
        <span className="t-label text-fg-3">{label}</span>
        <span className="t-num-md text-fg">{value}</span>
      </p>
      <p className="t-caption text-fg-2">{status}</p>
    </div>
  )
}
