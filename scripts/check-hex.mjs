// Regla DS §9.4 punto 1: 0 colores literales fuera de src/styles/tokens.css.
// Uso: node scripts/check-hex.mjs [raíz]
import { walk, readLines } from './lib/walk.mjs'

const root = process.argv[2] ?? process.cwd()
const ALLOWED = new Set(['src/styles/tokens.css'])
const HEX = /#[0-9a-fA-F]{3,8}\b/
const FUNC = /\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch)\(/

const hits = []
for (const rel of walk(root, ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.json', '.html'])) {
  if (ALLOWED.has(rel)) continue
  readLines(root, rel).forEach((line, i) => {
    if (HEX.test(line) || FUNC.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`)
  })
}

if (hits.length) {
  console.error(`check:hex — ${hits.length} color(es) literal(es) fuera de tokens.css:\n${hits.join('\n')}`)
  process.exit(1)
}
console.log('check:hex — 0 colores literales fuera de tokens.css')
