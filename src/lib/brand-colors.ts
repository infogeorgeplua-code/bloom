import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Colores que la plataforma necesita como texto (manifest PWA, theme-color). Se leen de
 * tokens.css al compilar para no tener literales fuera de los tokens (P-09 resuelto).
 * Solo servidor/compilación: usa node:fs.
 */
function token(name: string): string {
  const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')
  const value = css.match(new RegExp(String.raw`--${name}:\s*(#[0-9A-Fa-f]{6})`))?.[1]
  if (!value) throw new Error(`Falta --${name} en tokens.css`)
  return value
}

/** Fondo de la app y de la barra del sistema: --ink-950 (= --bg) */
export const appBackground = (): string => token('ink-950')
