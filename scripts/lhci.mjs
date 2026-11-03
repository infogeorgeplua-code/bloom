// Lighthouse CI sobre /ds, el Home y Brew Mode (accesibilidad ≥ 95; P-12).
// Navegador: CHROME_PATH si existe; si no, Chrome del sistema; si no, el Chromium de Playwright.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { chromium } from '@playwright/test'

const run = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit', shell: true, env: process.env })

if (!existsSync('.next/BUILD_ID')) {
  const build = run('npm', ['run', 'build'])
  if (build.status !== 0) process.exit(build.status ?? 1)
}

const candidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  chromium.executablePath(),
]
process.env.CHROME_PATH = candidates.find((p) => p && existsSync(p))
console.log(`lhci — navegador: ${process.env.CHROME_PATH}`)

const lhci = run('npx', ['lhci', 'autorun'])
process.exit(lhci.status ?? 1)
