// Genera el wordmark y los íconos de la app a partir del logo de George (P-08, parcial).
// Uso: node scripts/generate-brand-assets.mjs "<ruta al PNG del logo>"
// El color de fondo de los íconos sale de --ink-950 en tokens.css (sin literales).
// Usa `sharp`, que llega como dependencia de Next; se corre a mano, no en el build.
import { readFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const require = createRequire(join(process.cwd(), 'package.json'))
const sharp = require('sharp')

const src = process.argv[2]
if (!src) {
  console.error('Falta la ruta del logo')
  process.exit(1)
}

const tokens = readFileSync('src/styles/tokens.css', 'utf8')
const bgHex = tokens.match(/--ink-950:\s*(#[0-9A-Fa-f]{6})/)?.[1]
if (!bgHex) throw new Error('No se encontró --ink-950 en tokens.css')
const bg = {
  r: parseInt(bgHex.slice(1, 3), 16),
  g: parseInt(bgHex.slice(3, 5), 16),
  b: parseInt(bgHex.slice(5, 7), 16),
  alpha: 1,
}

/** Caja de los píxeles claros dentro de una región del logo. */
async function lightBox(region) {
  const { data, info } = await sharp(src).extract(region).greyscale().raw().toBuffer({ resolveWithObject: true })
  let minX = info.width, minY = info.height, maxX = 0, maxY = 0
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] > 128) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x)
        minY = Math.min(minY, y); maxY = Math.max(maxY, y)
      }
    }
  }
  return { left: region.left + minX, top: region.top + minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

/** Recorta y vuelve transparente el fondo negro: la luminancia pasa a ser el alfa. */
async function transparent(box, height) {
  const { data, info } = await sharp(src).extract(box).resize({ height }).raw().toBuffer({ resolveWithObject: true })
  const ch = info.channels
  const out = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * ch], g = data[i * ch + 1], b = data[i * ch + 2]
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const a = Math.max(0, Math.min(255, Math.round(((lum - 40) / (235 - 40)) * 255)))
    out[i * 4] = Math.min(255, Math.round(r / Math.max(a / 255, 0.01)))
    out[i * 4 + 1] = Math.min(255, Math.round(g / Math.max(a / 255, 0.01)))
    out[i * 4 + 2] = Math.min(255, Math.round(b / Math.max(a / 255, 0.01)))
    out[i * 4 + 3] = a
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png()
}

const meta = await sharp(src).metadata()
// Zona central del logo (wordmark + símbolo grande); el símbolo chico de la esquina queda fuera
const word = await lightBox({ left: 250, top: 250, width: 1150, height: Math.min(450, meta.height - 250) })
const symbol = await lightBox({ left: word.left - 5, top: word.top - 5, width: Math.round(word.height * 1.6), height: word.height + 10 })

mkdirSync('src/assets/brand', { recursive: true })
mkdirSync('public/icons', { recursive: true })

// Wordmark para la barra del Home: 3× del alto de uso (20 px)
await (await transparent(word, 60)).toFile('src/assets/brand/bloom-wordmark.png')

/** Ícono cuadrado: símbolo centrado sobre --ink-950 ocupando `ratio` del lado. */
async function icon(size, ratio, file) {
  const glyphH = Math.round(size * ratio)
  const glyph = await (await transparent(symbol, glyphH)).toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: glyph, gravity: 'center' }])
    .png()
    .toFile(file)
}

await icon(192, 0.42, 'public/icons/icon-192.png')
await icon(512, 0.42, 'public/icons/icon-512.png')
// Maskable: el símbolo dentro de la zona segura (círculo del 80 %)
await icon(512, 0.3, 'public/icons/icon-maskable-512.png')
await icon(180, 0.42, 'src/app/apple-icon.png')
await icon(48, 0.5, 'src/app/icon.png')

console.log('wordmark', word, 'símbolo', symbol)
