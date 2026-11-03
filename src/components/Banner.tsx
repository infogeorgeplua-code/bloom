import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export type BannerTone = 'neutral' | 'warning' | 'danger' | 'success'

export interface BannerProps {
  tone?: BannerTone
  children: ReactNode
  /** Acción opcional, un Button tertiary */
  action?: ReactNode
  className?: string
}

const TONE: Record<BannerTone, { border: string; text: string; icon: LucideIcon }> = {
  neutral: { border: 'border-l-line-strong', text: 'text-fg-2', icon: Info },
  warning: { border: 'border-l-warning', text: 'text-warning', icon: TriangleAlert },
  danger: { border: 'border-l-danger', text: 'text-danger', icon: CircleAlert },
  success: { border: 'border-l-success', text: 'text-success', icon: CircleCheck },
}

/** Alertas inline: stock bajo, calibración, dato no encontrado, sin conexión (DS §3.22). */
export function Banner({ tone = 'neutral', children, action, className }: BannerProps) {
  const { border, text, icon: Icon } = TONE[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-field border-l-[3px] bg-surface-2 p-4',
        border,
        className,
      )}
    >
      <Icon size={20} strokeWidth={1.5} className={cn('mt-0.5 shrink-0', text)} aria-hidden="true" />
      <div className="t-body flex-1 text-fg">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
