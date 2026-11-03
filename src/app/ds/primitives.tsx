import type { ReactNode } from 'react'

/** Contenedor de una sección de /ds. `name` lo usan las pruebas e2e para contar cobertura. */
export function Section({
  name,
  note,
  children,
}: {
  name: string
  note?: string
  children: ReactNode
}) {
  const id = `ds-${name.toLowerCase()}`
  return (
    <section data-ds-component={name} aria-labelledby={id} className="flex flex-col gap-4 py-8">
      <header className="flex flex-col gap-1">
        <h2 id={id} className="t-title text-fg">
          {name}
        </h2>
        {note ? <p className="t-caption text-fg-3">{note}</p> : null}
      </header>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  )
}

/** Un estado con su etiqueta. */
export function State({
  label,
  children,
  row = false,
}: {
  label: string
  children: ReactNode
  row?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="t-label text-fg-3">{label}</p>
      <div className={row ? 'flex flex-wrap items-center gap-3' : 'flex flex-col gap-3'}>
        {children}
      </div>
    </div>
  )
}
