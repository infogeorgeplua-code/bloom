import type { ReactNode } from 'react'
import { Coffee, House, Notebook, Play, Settings2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export type NavKey = 'home' | 'stock' | 'make' | 'diario' | 'setup'

export interface BottomNavProps {
  active: NavKey
  /** Enlaces opcionales por ítem; sin href el ítem es un botón con onSelect */
  hrefs?: Partial<Record<NavKey, string>>
  onSelect?: (key: NavKey) => void
  /** Ítems deshabilitados además de Diario (p. ej. Stock y Setup antes de su fase) */
  disabled?: NavKey[]
  className?: string
}

const SIDE: Array<{ key: Exclude<NavKey, 'make'>; label: string; icon: LucideIcon }> = [
  { key: 'home', label: 'Inicio', icon: House },
  { key: 'stock', label: 'Stock', icon: Coffee },
  // Diario: ícono `notebook` (DS §2.8). En Figma es el matraz de Lab (P-17)
  { key: 'diario', label: 'Diario', icon: Notebook },
  { key: 'setup', label: 'Setup', icon: Settings2 },
]

interface NavItemProps {
  itemKey: NavKey
  active: NavKey
  /** Solo si el nombre accesible debe diferir del texto visible */
  label?: string
  href?: string
  disabled?: boolean
  onSelect?: (key: NavKey) => void
  className?: string
  children: ReactNode
}

function NavItem({ itemKey, active, label, href, disabled, onSelect, className, children }: NavItemProps) {
  const common = {
    'aria-current': active === itemKey ? ('page' as const) : undefined,
    'aria-label': label,
    className,
  }
  if (disabled) {
    return (
      <button type="button" disabled {...common}>
        {children}
      </button>
    )
  }
  if (href) {
    return (
      <a href={href} {...common}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" onClick={() => onSelect?.(itemKey)} {...common}>
      {children}
    </button>
  )
}

/** Inicio · Stock · Hacer café · Diario · Setup (DS §3.13 v1.2). Diario deshabilitado en V1 (P-01). */
export function BottomNav({ active, hrefs, onSelect, disabled = [], className }: BottomNavProps) {
  const side = (key: (typeof SIDE)[number]['key']) => {
    const def = SIDE.find((s) => s.key === key)!
    const Icon = def.icon
    const isDiario = key === 'diario'
    const off = isDiario || disabled.includes(key)
    return (
      <NavItem
        itemKey={key}
        active={active}
        label={isDiario ? 'Diario, disponible pronto' : undefined}
        href={hrefs?.[key]}
        onSelect={onSelect}
        disabled={off}
        className={cn(
          'flex min-h-12 flex-col items-center justify-center gap-1',
          off ? 'cursor-not-allowed text-fg-disabled' : 'pressable',
          !off && (active === key ? 'text-fg' : 'text-fg-3'),
        )}
      >
        <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
        <span className="t-nav">{def.label}</span>
      </NavItem>
    )
  }

  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        'grid h-[calc(var(--nav-height)+env(safe-area-inset-bottom))] grid-cols-5 items-center border-t border-line bg-bg pb-[env(safe-area-inset-bottom)]',
        className,
      )}
    >
      {side('home')}
      {side('stock')}
      <NavItem
        itemKey="make"
        active={active}
        href={hrefs?.make}
        onSelect={onSelect}
        disabled={disabled.includes('make')}
        className="pressable flex flex-col items-center gap-1 text-fg"
      >
        <span className="-mt-3 flex size-14 items-center justify-center rounded-pill bg-inverse text-fg-inverse">
          <Play size={24} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <span className="t-nav">Hacer café</span>
      </NavItem>
      {side('diario')}
      {side('setup')}
    </nav>
  )
}
