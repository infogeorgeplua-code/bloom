import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const SKIP_DIRS = new Set([
  'node_modules', '.next', '.git', '.claude', '.lighthouseci', 'coverage',
  'test-results', 'playwright-report', 'docs', 'public',
])
const SKIP_FILES = new Set(['package-lock.json'])

/** Devuelve las rutas relativas (con "/") de los archivos de texto bajo `root`. */
export function walk(root, exts) {
  const out = []
  const visit = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      const st = statSync(full)
      if (st.isDirectory()) {
        if (!SKIP_DIRS.has(name)) visit(full)
      } else if (!SKIP_FILES.has(name) && exts.some((e) => name.endsWith(e))) {
        out.push(relative(root, full).split(sep).join('/'))
      }
    }
  }
  visit(root)
  return out
}

export function readLines(root, rel) {
  return readFileSync(join(root, rel), 'utf8').split(/\r?\n/)
}
