import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n')

/** Extrae el primer bloque ```css que sigue a un encabezado del documento del DS. */
function cssBlockAfter(doc: string, heading: string): string {
  const start = doc.indexOf(heading)
  expect(start, `no se encontró "${heading}" en el DS`).toBeGreaterThan(-1)
  const open = doc.indexOf('```css\n', start)
  const close = doc.indexOf('\n```', open + 7)
  return doc.slice(open + 7, close)
}

const ds = read('docs/bloom-design-system.md')

describe('tokens.css y tailwind.css (DS §9.2 y §9.3)', () => {
  it('tokens.css es idéntico al bloque de DS §9.2', () => {
    const expected = cssBlockAfter(ds, '### 9.2 Tokens CSS').trim()
    expect(read('src/styles/tokens.css').trim()).toBe(expected)
  })

  it('tailwind.css es idéntico al bloque de DS §9.3', () => {
    const expected = cssBlockAfter(ds, '### 9.3 Tailwind v4').trim()
    expect(read('src/styles/tailwind.css').trim()).toBe(expected)
  })

  it('tokens.css declara todos los tokens clave con valores válidos', () => {
    const css = read('src/styles/tokens.css')
    for (const name of ['ink-950', 'ink-400', 'ink-50', 'crema-400', 'crema-300', 'crema-700', 'green-300', 'amber-400', 'red-400']) {
      expect(css).toMatch(new RegExp(String.raw`--${name}:\s*#[0-9A-Fa-f]{6};`))
    }
    for (const decl of ['--target-brew:64px', '--target-min:48px', '--font-ui:"Geist"', '--font-num:"Geist Mono"']) {
      expect(css).toContain(decl)
    }
  })

  it('tailwind.css usa @theme inline y no define fuentes circulares', () => {
    const css = read('src/styles/tailwind.css')
    expect(css).toContain('@theme inline')
    expect(css).not.toMatch(/--font-sans:\s*var\(--font-sans\)/)
    expect(css).toContain('--color-*: initial')
  })
})
