// Regla DS §2.1: crema (--accent) solo en la lista cerrada. Uso: node scripts/check-accent.mjs [raíz]
import { walk, readLines } from './lib/walk.mjs'

const root = process.argv[2] ?? process.cwd()

/** Archivos donde crema está permitido y por qué (DS §2.1). */
const ALLOWED = new Map([
  ['src/components/TimerRing.tsx', 'anillo de progreso y tiempo restante del paso activo'],
  ['src/components/ProgressDots.tsx', 'dot del paso actual'],
  ['src/features/brew-mode/screens/Countdown.tsx', 'número de la cuenta regresiva 3-2-1'],
  ['src/components/RatingScale.tsx', 'ícono star del nivel 5'],
  ['src/components/SourceCard.tsx', 'star de receta bloqueada'],
  ['src/components/CoffeeHero.tsx', 'star de receta bloqueada en el hero de Home'],
  ['src/styles/base.css', 'anillo de foco :focus-visible'],
  ['src/styles/tokens.css', 'definición de los tokens'],
  ['src/styles/tailwind.css', 'puente de tokens a Tailwind'],
  ['src/app/ds/TokensSection.tsx', 'muestra de la paleta en /ds'],
])

// Utilidad de Tailwind que usa el color accent: text-accent, bg-accent/50, hover:border-accent…
const UTIL = /(?:^|[\s"'`])((?:[a-z0-9-]+:)*)(?:text|bg|border|ring|stroke|fill|outline|decoration|caret|shadow|from|via|to|divide|accent)-(?:accent|accent-pressed)(?:\/\d+)?(?![\w-])/g
const VAR = /var\(--(?:accent|accent-pressed|crema-\d+)\)/
const PRIMITIVE = /\bcrema-\d{3}\b/

const hits = []
for (const rel of walk(root, ['.ts', '.tsx', '.css'])) {
  // La regla es del código de la app; las pruebas necesitan nombrar las clases para verificarlas
  if (!rel.startsWith('src/') || ALLOWED.has(rel)) continue
  readLines(root, rel).forEach((line, i) => {
    let bad = false
    for (const m of line.matchAll(UTIL)) {
      // El foco es parte de la lista cerrada (anillo/borde de foco)
      if (!/(^|:)focus(-visible|-within)?(:|$)/.test(m[1].replace(/:$/, ''))) bad = true
    }
    if (VAR.test(line) || PRIMITIVE.test(line)) bad = true
    if (bad) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`)
  })
}

if (hits.length) {
  console.error(`check:accent — crema fuera de la lista cerrada de DS §2.1:\n${hits.join('\n')}`)
  process.exit(1)
}
console.log('check:accent — crema solo en la lista cerrada')
