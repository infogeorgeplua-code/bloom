import { Section, State } from './primitives'

const INK = [
  ['ink-950', 'Fondo de la app'],
  ['ink-900', 'Superficie 1'],
  ['ink-850', 'Superficie 2'],
  ['ink-800', 'Superficie 3 · pressed'],
  ['ink-700', 'Bordes · tracks'],
  ['ink-600', 'Bordes fuertes'],
  ['ink-500', 'Deshabilitado'],
  ['ink-400', 'Texto terciario'],
  ['ink-300', 'Texto secundario'],
  ['ink-200', 'Banda de foto'],
  ['ink-100', 'Orbes'],
  ['ink-50', 'Texto primario · botón'],
] as const

const FEEDBACK = [
  ['crema-400', 'Acento único'],
  ['crema-300', 'Acento pressed'],
  ['crema-700', 'Acento tema claro'],
  ['green-300', 'Éxito · verificado'],
  ['amber-400', 'Advertencia · inferido'],
  ['red-400', 'Error · crítico'],
] as const

const CONTRASTS = [
  ['ink-50 / ink-950', '17,51:1', 'AAA'],
  ['ink-300 / ink-950', '9,80:1', 'AAA'],
  ['ink-400 / ink-950', '5,72:1', 'AA'],
  ['ink-400 / ink-850', '4,88:1', 'AA'],
  ['crema-400 / ink-950', '10,46:1', 'AAA'],
  ['green-300 / ink-950', '10,93:1', 'AAA'],
  ['amber-400 / ink-950', '9,45:1', 'AAA'],
  ['red-400 / ink-950', '7,57:1', 'AAA'],
] as const

const TYPE = [
  ['t-num-countdown', 'num-countdown · 160/160', '3'],
  ['t-num-hero', 'num-hero · 112/100', '45'],
  ['t-num-time', 'num-time · 80/80', '2:47'],
  ['t-num-xl', 'num-xl · 64/64', '2:52'],
  ['t-num-window', 'num-window · 48/56', '2:40 – 3:00'],
  ['t-num-lg', 'num-lg · 40/44', '145 g'],
  ['t-num-md', 'num-md · 24/28', '92,5 °C'],
  ['t-num-sm', 'num-sm · 22/28', '240 g'],
  ['t-display', 'display · 40/44', '¿Qué preparamos?'],
  ['t-title-lg', 'title-lg · 28/32', 'Bloom'],
  ['t-title-md', 'title-md · 24/28', 'El Paraíso Sidra'],
  ['t-title', 'title · 22/28', 'Encabezado de sección'],
  ['t-body-lg', 'body-lg · 17/24', 'Hidrata el café y libera CO₂.'],
  ['t-body', 'body · 15/22', 'Texto general de la interfaz.'],
  ['t-caption', 'caption · 13/18', 'Notas, ayudas y escalas.'],
  ['t-label', 'label · 11/14', 'Tueste · stock'],
  ['t-button', 'button · 16/20', 'Preparar ahora'],
  ['t-nav', 'nav · 11/14', 'Mis cafés'],
] as const

const SPACING = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
const RADII = [
  ['xs', '8'],
  ['sm', '12'],
  ['md', '16'],
  ['lg', '24'],
  ['xl', '32'],
  ['full', '9999'],
] as const
const MOTION = [
  ['dur-instant', '80 ms', 'Feedback de press'],
  ['dur-fast', '160 ms', 'Chips, toggles, segmented'],
  ['dur-base', '240 ms', 'Cambios de contenido'],
  ['dur-slow', '360 ms', 'Pasos del brew, sheets'],
  ['dur-countdown', '1000 ms', 'Cada número del 3-2-1'],
] as const

export function TokensSection() {
  return (
    <Section name="Tokens" note="Fuente de verdad: src/styles/tokens.css (DS §9.2). Cero hex fuera de ese archivo.">
      <State label="Neutros Carbón">
        <div className="grid grid-cols-3 gap-2">
          {INK.map(([name, use]) => (
            <div key={name} className="flex flex-col gap-1">
              <span
                className="block h-12 rounded-chip border border-line"
                style={{ background: `var(--${name})` }}
              />
              <span className="t-label text-fg">{name}</span>
              <span className="t-caption text-fg-3">{use}</span>
            </div>
          ))}
        </div>
      </State>

      <State label="Acento y feedback">
        <div className="grid grid-cols-3 gap-2">
          {FEEDBACK.map(([name, use]) => (
            <div key={name} className="flex flex-col gap-1">
              <span
                className="block h-12 rounded-chip border border-line"
                style={{ background: `var(--${name})` }}
              />
              <span className="t-label text-fg">{name}</span>
              <span className="t-caption text-fg-3">{use}</span>
            </div>
          ))}
        </div>
      </State>

      <State label="Contrastes verificados (WCAG 2.2, DS §2.1)">
        <table className="w-full">
          <caption className="sr-only-text">Contrastes de texto sobre fondo</caption>
          <thead>
            <tr className="t-label text-left text-fg-3">
              <th className="pb-2 font-medium">Texto / fondo</th>
              <th className="pb-2 font-medium">Ratio</th>
              <th className="pb-2 font-medium">Nivel</th>
            </tr>
          </thead>
          <tbody>
            {CONTRASTS.map(([pair, ratio, level]) => (
              <tr key={pair} className="border-t border-line">
                <td className="t-caption py-2 text-fg-2">{pair}</td>
                <td className="t-caption num py-2 text-fg">{ratio}</td>
                <td className="t-caption py-2 text-fg-2">{level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </State>

      <State label="Escala tipográfica">
        <div className="flex flex-col gap-4">
          {TYPE.map(([cls, spec, sample]) => (
            <div key={cls} className="flex flex-col gap-1 border-t border-line pt-3">
              <span className="t-label text-fg-3">{spec}</span>
              <span className={`${cls} text-fg`}>{sample}</span>
            </div>
          ))}
        </div>
      </State>

      <State label="Espaciado (base 4)">
        <div className="flex flex-col gap-2">
          {SPACING.map((n) => (
            <div key={n} className="flex items-center gap-3">
              <span className="t-label w-16 text-fg-3">space-{n}</span>
              <span
                className="block h-3 rounded-pill bg-fg-2"
                style={{ width: `var(--space-${n})` }}
              />
            </div>
          ))}
        </div>
      </State>

      <State label="Radios" row>
        {RADII.map(([name, px]) => (
          <div key={name} className="flex flex-col items-center gap-1">
            <span
              className="block size-14 border border-line-strong bg-surface-2"
              style={{ borderRadius: `var(--radius-${name})` }}
            />
            <span className="t-label text-fg-3">
              {name} · {px}
            </span>
          </div>
        ))}
      </State>

      <State label="Trazos">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="block w-24 bg-line" style={{ height: 'var(--stroke-hairline)' }} />
            <span className="t-label text-fg-3">hairline · 1 px</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="block w-24 bg-fg-2" style={{ height: 'var(--stroke-instrument)' }} />
            <span className="t-label text-fg-3">instrument · 1,5 px</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="block w-24 bg-accent" style={{ height: 'var(--stroke-progress)' }} />
            <span className="t-label text-fg-3">progress · 4 px</span>
          </div>
        </div>
      </State>

      <State label="Motion (el press escala a 0,97; prefers-reduced-motion respetado)">
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {MOTION.map(([name, ms, use]) => (
            <li key={name} className="flex items-baseline justify-between border-t border-line pt-2">
              <span className="t-label text-fg">{name}</span>
              <span className="t-caption text-fg-3">
                <span className="num text-fg-2">{ms}</span> · {use}
              </span>
            </li>
          ))}
        </ul>
      </State>
    </Section>
  )
}
