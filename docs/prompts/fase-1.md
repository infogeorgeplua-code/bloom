===========================================
CLAUDE CODE — PROMPT DE ARRANQUE
Proyecto: Bloom · Fase 1 · Fundaciones
===========================================

Eres el lead developer de Bloom. Esta fase **no tiene backend, ni datos, ni pantallas de producto**: solo el sistema de diseño en código y la ruta `/ds` que lo prueba.

**Primero muéstrame el plan** (lista de archivos, orden, riesgos, dudas) y espera mi aprobación. Luego construye. Lee antes, completos: `CLAUDE.md`, `docs/SDD.md` (§0–2, §8.1, §8.4, §9.1), `docs/bloom-design-system.md` (todo) y `docs/bloom_decisions.md`.

## Qué es el producto
Bloom es un copiloto de café de especialidad: PWA para Android (Chrome), en español, con Brew Mode offline-first como pantalla principal. Estética "Instrumento": monocromo oscuro, un solo acento cálido (`crema`), el número como héroe. La fase 1 deja listo el cimiento visual para construir Brew Mode en la fase 2.

## Stack (versiones exactas en `docs/SDD.md` §1.1; instalar con `--save-exact`)
- Next.js 16.4.4 (App Router) · React 19.3.1 · TypeScript 6.0.3 `strict` (no 7.x, ver S-01)
- Tailwind CSS 4.3.4 con `@theme inline` (D-13) · `@tailwindcss/postcss`
- `lucide-react` 1.66.0 · `@radix-ui/react-dialog` 1.3.1 (solo headless, solo `BottomSheet`)
- Fuentes Geist y Geist Mono autoalojadas con `@font-face` propio (S-06)
- Vitest 5.1.0 + Testing Library · Playwright 1.64.1 (perfil Pixel) · axe · Lighthouse CI
- Node 24, npm. **Sin** Dexie, Zustand, Serwist, Supabase, Zod ni LLM: no entran todavía.
- Variables de entorno: **ninguna**.

## Estructura a crear (SDD §2, solo lo de fase 1)
```
.nvmrc  .npmrc  .gitignore  .prettierrc  package.json  tsconfig.json  next.config.ts
eslint.config.mjs  postcss.config.mjs  vitest.config.ts  playwright.config.ts
public/fonts/{Geist-Variable.woff2,GeistMono-Variable.woff2,LICENSE.txt}
scripts/{check-hex.mjs,check-accent.mjs,check-copy.mjs}
src/app/{layout.tsx,page.tsx (placeholder),ds/page.tsx}
src/components/<26 componentes>.tsx + index.ts
src/lib/format.ts
src/styles/{tokens.css,fonts.css,base.css,tailwind.css}
tests/unit/{format.test.ts,tokens.test.ts,check-scripts.test.ts}
tests/components/<un archivo por componente>.test.tsx
tests/e2e/ds.spec.ts
```

## Pasos
1. **Scaffold manual** siguiendo SDD §8.1 (sin `create-next-app`). `git init`. Copia las fuentes de `node_modules/geist` a `public/fonts/`. `tsconfig` con `strict: true` y alias `@/*` → `src/*`. Scripts de `package.json` según SDD §8.4.
2. **`src/styles/tokens.css`**: copia **exacta** de DS §9.2 (primitivos, semánticos, tipografía, espaciado, radios, trazos, motion, layout, tema claro `[data-theme="light"]`, `[data-mode="brew"]`, `.num`, reduced-motion). Es el **único** archivo con hex. Test `tokens.test.ts`: parsea el CSS y comprueba los valores de DS §9.2.
3. **`src/styles/tailwind.css`**: copia exacta de DS §9.3 (`@theme inline`, `--color-*: initial`, `--font-*: initial`, `--radius-*: initial`). Comprueba que `bg-transparent`, `text-current` y `rounded-pill` compilan; si `--color-*: initial` rompe alguna utilidad necesaria, **no la resuelvas por tu cuenta**: regístralo como PENDIENTE en `docs/bloom_decisions.md` y pregúntame.
4. **`fonts.css`** (`@font-face` "Geist" y "Geist Mono", `font-display: swap`, pesos 300–600 / 300–500) y **`base.css`** (reset, tipografía base con los roles de la escala DS §2.2 como utilidades o clases, `:focus-visible` con anillo `--accent` 2 px offset 2 px, `.num`, `prefers-reduced-motion`). `layout.tsx`: `lang="es"`, `<meta viewport>` con `viewport-fit=cover`, contenedor `max-width: var(--app-max-width)` centrado con `--bg` extendido, precarga de Geist Mono, safe areas.
5. **Componentes** (uno por archivo, `src/components/`): los 26 de DS §9.1 — `Button, IconButton, SegmentedControl, Chip, ChipGrid, Stepper, Tile, Orb, DataPill, Gauge (+ variante DialInput), Slider, Toggle, TopBar, BottomNav, BottomSheet, ListRow, StockMeter, TrustBadge, SourceCard, RecipeParams, StepTimeline, TextField, Banner, ProgressDots, TimerRing, RatingScale`. Cada uno implementa **su** sección de DS §3 (anatomía, variantes, estados, tokens, a11y) y nada más. Props tipadas, sin lógica de negocio, sin estado global, sin importar de `features/`.
   - Todo color/espacio/radio/duración vía clases del tema o `var(--token)`.
   - Íconos solo de `lucide-react` (trazo 1.5, 24 px; 20 en chips; 28 en Brew Mode).
   - `TimerRing`: SVG + `requestAnimationFrame`; recibe `elapsedMs`/`durationMs` por props, sin `setInterval`; expone `data-elapsed-ms` en el nodo raíz; `aria-live="off"`.
   - `BottomSheet`: Radix Dialog headless (focus trap, Esc, swipe down, scrim). El cierre con el botón atrás de Android se cablea en fase 2.
   - `crema` solo donde permite DS §2.1.
6. **`/ds`** (`src/app/ds/page.tsx`): una sección por componente, con **todos sus estados** (matriz abajo) y una sección inicial de tokens (paleta con nombre y contraste, escala tipográfica, espaciado, radios, motion). Con un conmutador de tema (oscuro / claro "Papel") y otro de `data-mode="brew"` para ver Brew Mode oscuro. Datos de ejemplo **ficticios y locales a la página** (no se usan después ni se guardan). Los textos de ejemplo siguen DS §7 (tuteo, sin emojis, números en mono).
7. **Scripts de reglas** `check-hex.mjs`, `check-accent.mjs`, `check-copy.mjs` + `check-scripts.test.ts` (cada uno debe fallar con un archivo de prueba que viole la regla). Para el manifest de la fase 2 hay un PENDIENTE (P-01): no lo resuelvas aquí.
8. **Tests**: `format.test.ts` (DS §7), un test de componente por cada uno (roles ARIA, estados, teclado), `ds.spec.ts` (Playwright Pixel: carga `/ds`, comprueba que existe una sección por componente y corre axe).
9. **Lighthouse CI** (`npm run lhci`) sobre `/ds`, umbral Accessibility ≥ 95.

## Matriz de estados que `/ds` debe mostrar (DS §3)
| Componente | Estados / variantes obligatorios en `/ds` |
|---|---|
| Button | primary, secondary, tertiary, danger × `md` 48, `lg` 56, `xl` 64 × default, pressed, disabled, loading (ancho fijo), focus-visible; con ícono; con dato en mono |
| IconButton | `md` 48 y `xl` 64 × `surface` y `ghost` × default, pressed, disabled, focus-visible; con `aria-label` |
| SegmentedControl | 2 y 3 segmentos; cada uno activo; disabled; foco; thumb animado `dur-fast` |
| Chip | default, selected, disabled, con ícono 20, focus-visible |
| ChipGrid | 2 y 3 columnas; selección única (`radiogroup`) y múltiple (`aria-pressed`); alto 48 |
| Stepper | valor central `num-md`; − y + deshabilitados en los límites; long-press acelerado; foco |
| Tile | `static`, `interactive` (pressed), `alert` (warning y danger); 1x1 y 2x1; con gauge, ícono y sin visual |
| Orb | `sm` 96, `md` 160, `lg` 220; sólido, `outline`, `action` (play); demo de "un solo orb sólido por vista" |
| DataPill | ejemplos "TUESTE · 12 días / En ventana ideal" y "STOCK · 145 g / ~9 preparaciones" |
| Gauge | arco 180° y 270°; valores mín, medio, máx; temperatura 80–100 °C; `DialInput` arrastrable + alternativa con `Stepper`; `role="slider"` y flechas ±1 |
| Slider | simple y `range`; escala con ≥ 3 marcas; header título + valor; disabled; foco |
| Toggle | off, on, disabled, foco; fila completa clicable de 48 px con label a la izquierda |
| TopBar | con back, con título centrado, con acción derecha, raíz sin back; safe area |
| BottomNav | cada uno de los 5 ítems activo; Lab con "PRONTO" deshabilitado; orb central elevado 12 px; safe-area inferior |
| BottomSheet | `default` e `inverse`; abrir/cerrar con botón, Esc y swipe down; scrim; focus trap; handle 36×4 |
| ListRow | normal; con `StockMeter` en ok, bajo y crítico; thumb sobre `--surface-photo` |
| StockMeter | compacto (6×12) y perfil (10×20); ok, bajo (`triangle-alert`), crítico (`circle-alert`), agotado (con acción "Marcar como terminado"); siempre con valor numérico y "~N preparaciones" |
| TrustBadge | observado, verificado, inferido (borde punteado) × completo e `inline` con tooltip al tocar |
| SourceCard | verificada, adaptada (~), variante "historial" con `star` crema |
| RecipeParams | lista normal; con `TrustBadge inline`; variante `diff` (antes tachado `--text-3`, después `--text-1`); en fila (Home) |
| StepTimeline | con paso de preparación (`list-checks`, "Preparación") y pasos con tiempo (meta acumulada + ventana); barra vertical 1,5 px |
| TextField | default, foco (borde 2 px `--accent`), error (mensaje `--danger`), numérico con sufijo de unidad, disabled, multilínea (usado por DS §4.4; si no está definido en §3.21, déjalo como `TODO(ds):` y avísame) |
| Banner | neutral, warning, danger, success; con y sin acción `tertiary` |
| ProgressDots | 6 dots con el actual en cada posición (completado / actual 20 px / pendiente), con "PASO N DE 6" |
| TimerRing | progreso 0 %, 50 %, 100 %; últimos 3 s con segundos en `--accent`; paso `wait` sin gramos (tiempo restante en el centro); pausado; `prefers-reduced-motion` |
| RatingScale | sin selección; cada nivel 1–5 seleccionado (nivel 5 con `star` crema); navegación con ↑↓; sin números visibles |

## Reglas del proyecto
- DS §0 completo. Jerarquía Tokens → Componentes → Patrones → Pantallas. Prohibido hardcodear.
- 0 hex fuera de `tokens.css`. `crema` solo en la lista cerrada de DS §2.1. Números en mono tabular. Español con tuteo, sin emojis.
- No inventes componentes ni variantes que no estén en DS §3. Si falta algo: `TODO(ds):` y me lo cuentas.
- Una contradicción nueva entre documentos va a `docs/bloom_decisions.md` § PENDIENTES (P-xx) y me preguntas.
- No instales paquetes fuera de la lista; no cambies versiones sin avisar.
- No escribas código de fases 2+ (sin Dexie, sin máquina de brew, sin PWA).

## Criterio de éxito de esta fase
- `npm run check` pasa (typecheck, lint, hex, accent, copy, tests).
- `/ds` muestra todos los componentes con todos sus estados, en tema oscuro, claro y `data-mode="brew"`.
- `npm run lhci` → Accessibility ≥ 95 en `/ds`; axe sin violaciones graves.
- DS §9.4 puntos 1–4 comprobados y reportados uno por uno (el 5 es de la fase 2).
- Te explico cómo abrir `/ds` en el teléfono Android (misma red Wi-Fi: `npm run dev -- --hostname 0.0.0.0` y la IP del PC; o un túnel/preview si lo prefieres) y qué revisar a mano: contraste a pleno sol, tamaños táctiles, fuentes cargadas, TalkBack.

Empieza por el plan. Luego crea, en este orden: scaffold + `tokens.css` + `tailwind.css` + `fonts.css` + `base.css` + `layout.tsx`, después los componentes (de los simples a los compuestos), después `/ds`, y al final los scripts de reglas y las pruebas.
===========================================

---

## Registro · Re-alineación a DS v1.2 + Figma (3 nov 2026)

La fase 1 se construyó primero con DS v1.1 (prompt de arriba). El 3 nov se re-alineó al DS v1.2 y a Figma (D-14), con el prompt 3 de `docs/bloom_claude_code_kickoff.md`:

- Tokens: escala nueva de DS §2.2 y §9.2 (`num-countdown`, `num-time`, `num-window`, `num-sm`, `title-md`). Texto mínimo 11 px.
- Modificados: `TopBar` (home · flow · brew), `Tile` (meter · orb · bar), `ListRow` v1.2 (solo proceso, sin `StockMeter`, ícono en stock bajo), `BottomNav` v1.2 (Inicio · Stock · Hacer café · Diario deshabilitado · Setup), `TimerRing` v1.2 (sin ticks, "Vierte hasta", tiempo total), `ProgressDots` centrable, `BottomSheet` (padding 12 24 24).
- Nuevos: `InfoList`, `MethodIllustration` (V60 exportado de Figma como SVG), `StatRow`, `CoffeeHero`, `BrewSummarySheet`. Wordmark con placeholder (P-08: en Figma es raster).
- Eliminado: Lab en la nav, tiles Tueste y Última taza, "acumulado de 240 g", "Siguiente".
- `/ds` muestra todos los estados nuevos, incluido el `TimerRing` en vertido, espera, últimos 3 s ("Cambia en 3 s", P-06) y pausado.
- Nodos consultados: `7:13`, `8:87`, `8:171`, `8:211`, `9:158`, `16:1755`, `9:259`, `9:324`, `9:375`, `9:442`, `6:2`.
