// Regla de copy: sin emojis en la UI (DS §0.6). Uso: node scripts/check-copy.mjs [raíz]
import { walk, readLines } from './lib/walk.mjs'

const root = process.argv[2] ?? process.cwd()
const EMOJI = /\p{Extended_Pictographic}/u

const hits = []
for (const rel of walk(root, ['.ts', '.tsx', '.css'])) {
  if (!rel.startsWith('src/')) continue
  readLines(root, rel).forEach((line, i) => {
    if (EMOJI.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`)
  })
}

if (hits.length) {
  console.error(`check:copy — emojis en src/:\n${hits.join('\n')}`)
  process.exit(1)
}
console.log('check:copy — sin emojis en src/')
