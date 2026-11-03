import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const scripts = join(process.cwd(), 'scripts')
let dir = ''

function fixture(files: Record<string, string>) {
  dir = mkdtempSync(join(tmpdir(), 'bloom-check-'))
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, content)
  }
  return dir
}

function run(script: string, root: string) {
  return spawnSync(process.execPath, [join(scripts, script), root], { encoding: 'utf8' })
}

// Los literales se arman en tiempo de ejecución para que este archivo no dispare check:hex
const HEX = '#' + '0E0E0F'
const EMOJI = String.fromCodePoint(0x1f4a7)
const RGBA = 'rgb' + 'a(0,0,0,.5)'

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
  dir = ''
})

describe('check:hex', () => {
  it('falla con un hex fuera de tokens.css', () => {
    const r = run('check-hex.mjs', fixture({ 'src/a.tsx': `const c = '${HEX}'` }))
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('src/a.tsx:1')
  })

  it('falla con funciones de color (rgb con alfa)', () => {
    expect(run('check-hex.mjs', fixture({ 'src/a.css': `a { color: ${RGBA} }` })).status).toBe(1)
  })

  it('permite hex dentro de src/styles/tokens.css', () => {
    const r = run('check-hex.mjs', fixture({ 'src/styles/tokens.css': `:root { --x: ${HEX}; }` }))
    expect(r.status).toBe(0)
  })

  it('no confunde anclas ni palabras con hex', () => {
    expect(run('check-hex.mjs', fixture({ 'src/a.tsx': 'href="#main" // #fase' })).status).toBe(0)
  })
})

describe('check:accent', () => {
  it('falla con text-accent fuera de la lista cerrada', () => {
    const r = run('check-accent.mjs', fixture({ 'src/components/Button.tsx': 'className="text-accent"' }))
    expect(r.status).toBe(1)
  })

  it('falla con var(--accent) en un componente', () => {
    const r = run('check-accent.mjs', fixture({ 'src/components/Tile.tsx': 'style={{color:"var(--accent)"}}' }))
    expect(r.status).toBe(1)
  })

  it('permite accent solo en el foco', () => {
    const r = run('check-accent.mjs', fixture({ 'src/components/TextField.tsx': 'className="focus-within:border-accent"' }))
    expect(r.status).toBe(0)
  })

  it('permite accent en TimerRing', () => {
    const r = run('check-accent.mjs', fixture({ 'src/components/TimerRing.tsx': 'className="stroke-accent"' }))
    expect(r.status).toBe(0)
  })
})

describe('check:copy', () => {
  it('falla con un emoji en src/', () => {
    const r = run('check-copy.mjs', fixture({ 'src/a.tsx': `const t = "Bloom ${EMOJI}"` }))
    expect(r.status).toBe(1)
  })

  it('acepta texto en español con tildes y símbolos', () => {
    const r = run('check-copy.mjs', fixture({ 'src/a.tsx': 'const t = "Café · 92 °C → ≈ CO₂"' }))
    expect(r.status).toBe(0)
  })
})
