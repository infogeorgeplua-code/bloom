===========================================
CLAUDE CODE — PROMPT DE ARRANQUE
Proyecto: Bloom · Fase 2 · Brew Mode offline
(v1.1 · 3 nov 2026 · alineado a DS v1.2 + Figma 7:12)
===========================================

Eres el lead developer de Bloom. La fase 1 está cerrada y re-alineada a DS v1.2: existen `tokens.css`, `tailwind.css`, los 31 componentes del DS (incluidos `InfoList`, `MethodIllustration`, `StatRow`, `CoffeeHero` y `BrewSummarySheet`) y `/ds`. Esta fase construye **Brew Mode offline** con las 3 recetas seed de product §9 y el Home de Figma 01 con lo que existe sin backend. Después de esta fase la app debe servir para preparar café real todos los días.

**Primero muéstrame el plan** y espera mi aprobación. Lee antes, completos: `CLAUDE.md`, `docs/SDD.md` (§1, §2, §3.1–3.5, §5.1–5.2, §5.8, §8.2, §9.3–9.6), `docs/bloom-design-system.md` §2.6–2.9, §3.12–3.14, §3.24, §3.26–3.29, §4.1 y §4.3, `docs/bloom_product.md` §8–9 y `docs/bloom_decisions.md` (D-01, D-02, D-08, D-10, D-14…D-17 y la tabla de PENDIENTES).

## Figma (D-14)
Archivo `b6fW2A40LxfXyqHOloXxnv`. Antes de cada pantalla: `get_design_context` + `get_screenshot` del nodo y comparación final en 390×844.

| Pantalla | Nodo |
|---|---|
| 01 Home | `7:13` |
| 02 Vista previa · 03 Preparación · 04 Cuenta regresiva | `8:87` · `8:171` · `8:211` |
| 05 Bloom (patrón canónico) · 06 Últimos 3 s | `9:158` · `16:1755` |
| 07 Pausado · 08 Decantación · 09 Fin · 10 Salir | `9:259` · `9:324` · `9:375` · `9:442` |

Pausado, Fin y Salir usan la barra `brew` (✕ a la derecha) aunque en Figma tengan la anterior (D-16). "Bloom", nunca "Blooming" (P-02). Las ventanas de cada paso salen de product §9 / SDD §3.5, no de los textos de Figma 02 (P-20, resuelto).

## Qué es el producto
Bloom es un copiloto de café de especialidad (PWA Android, español). Brew Mode es su pantalla principal: pantalla completa, sin navegación, siempre oscura, con el teléfono apoyado junto al dripper y las manos mojadas. Funciona **sin conexión**.

## Stack de esta fase (versiones en `docs/SDD.md` §1.1, `--save-exact`)
Lo de la fase 1 + `zustand` 5.0.16 · `dexie` 4.4.7 · `zod` 4.6.7 · `serwist` y `@serwist/next` 9.5.13 · `fake-indexeddb` 6.2.7 (dev). `@sentry/nextjs` 11.10.0 es **opcional** (S-11): solo si me confirmas que quiero Sentry. Variables de entorno obligatorias: **ninguna**.

## Antes de escribir código (bloqueantes: avísame y espera)
1. **Serwist + Next 16 (S-02).** Next 16.4 compila con Turbopack por defecto (visto en la fase 1). Lee la documentación vigente de Serwist y confirma si `@serwist/next` funciona o hay que usar `@serwist/turbopack` (9.5.13). Si cambia algo, regístralo como PENDIENTE; no improvises.
2. **P-09 (hex en manifest/íconos).** `manifest.ts` necesita `theme_color`/`background_color` literales y la regla es 0 hex fuera de `tokens.css`. Preséntame las opciones del PENDIENTE y espera mi respuesta antes de crear el manifest.
3. **P-13 (propósitos faltantes de AeroPress).** "Vertido principal", "Espera" y "Presiona" no tienen texto de propósito. Si no te los he dado, van `null` y `InfoList` omite la fila (no inventes texto).

## Modelo de datos (SDD §3)
- Dexie `BloomDB` v1: stores `recipes`, `activeBrew` (fila única `current`), `brewSessions` (con índice `finishedAtEpochMs` y campo `method`), `syncQueue` (vacío), `meta`. Tipos y esquema en SDD §3.2.
- `recipes.seed.json` (`src/data/`) con **exactamente** los números de SDD §3.5 (V60 15/240/92 °C; AeroPress 15/200/88 °C; Espresso 18/36/93 °C), validado con Zod (`src/lib/schemas/recipe-seed.ts`). Lo que product §9 no define va `null` (S-16).
- Carga idempotente del seed: `bulkPut` si `meta.seedVersion` cambió, sin tocar `brewSessions`.
- La `BrewSession` se guarda al tocar **"Terminar brew"** con `rating: null` (tech v2.1 §4).
- `features/home/monthly-stats.ts` (SDD §5.8): brews del mes por método, puro y testeado.

## Máquina de estados (SDD §3.3–3.4, §5.1)
Función pura `transition(state, event, ctx)` en `features/brew-mode/brew-machine.ts`; estados `idle · preview · prep · countdown · running · paused · finished · abandoned`; eventos del SDD §3.3 (incluido `CANCEL_COUNTDOWN`). `brew-clock.ts`: `elapsedMs = (pausedAt ?? now) − t0 − totalPausedMs`, reloj monótono con `performance.now()` anclado a epoch (S-05). Paso activo derivado del tiempo con espera entre ventanas (S-04, `activeStepAt`). **El último paso no termina solo (D-17):** `FINISH` es manual ("Terminar brew" o "Siguiente paso" desde la pausa). Store Zustand (`brew-store.ts`) con efectos: haptics, wake lock, persistencia, anuncios `aria-live`. Persistencia: cada evento y cada 1 s (`ActiveBrewRecord`); retomar según SDD §3.4.

## Pantallas (usa **solo** componentes del DS)
```
src/app/(app)/page.tsx            Home (Figma 01, S-08)
src/app/brew-mode/[versionId]/    Vista previa → prep → cuenta regresiva → pasos con tiempo → último paso → resumen
```
- **Home (DS §4.1, S-08):** `TopBar home` (wordmark, fecha, Setup) · "¿Qué preparamos?" · `Banner` "Retomar brew en m:ss" si hay `activeBrew` · `CoffeeHero` con la última receta usada (o empty state) · tiles **Este mes** (`orb`) y de método (`bar`, los 2 más usados, "N% del mes") desde `monthly-stats` · una `ListRow` por receta seed · `BottomNav` v1.2 (Inicio activo; Stock y Setup deshabilitados hasta su fase; Diario deshabilitado, P-01). El tile **Stock** y "Tengo un café nuevo" aparecen cuando existan cafés y bolsas.
- **Vista previa (02):** barra con back a la izquierda y método a la derecha · "TIEMPO OBJETIVO" + `num-window` "2:40 – 3:00" + "Desde el primer vertido hasta la última gota." · `StepTimeline` · línea con ícono `sun` "La pantalla se mantiene encendida mientras preparas." · `Button primary xl` "Empezar". Espresso: `Banner` warning de calibración.
- **Paso prep (03):** `ProgressDots` + "PASO N DE M" (cuentan los prep) · ícono + "Prepara" · instrucción · `RecipeParams` · "Al tocar Listo empieza una cuenta de 3 segundos." · `Button xl` "Listo" (vibra `[20]`). Sin `TimerRing` ni tiempo total.
- **Cuenta regresiva (04):** "EMPIEZA EN" · número `num-countdown` en crema (`dur-countdown`) · "Primer paso: vierte 45 g de agua a 92 °C" (sale de la receta) · "Cancelar" (`CANCEL_COUNTDOWN`).
- **Paso con tiempo (05, D-16):** `TopBar brew` (META + ventana · ícono `timer` + tiempo total · ✕) · `ProgressDots` centrado · ícono + nombre centrado (`title-lg`) · `TimerRing` v1.2 ("Vierte hasta" + gramos; en pasos sin meta, "tiempo total" + `num-time`) · línea de estado en crema "N s restantes" · `InfoList` Propósito / Técnica / Después ("Primer vertido → 140 g de agua") · pausa `IconButton xl` centrado. Jerarquía: meta de gramos > tiempo restante > nombre > propósito > técnica > después. Cambio de paso animado (`dur-slow`, `ease-enter`); en el hueco entre ventanas, la línea de estado dice "Siguiente en N s".
- **Últimos 3 s (06, P-06):** la línea pasa a "Cambia en 3 s" (2, 1) y vibra `[40]` una vez.
- **Último paso (08, D-17):** decantación, presión o extracción. Fila inferior: pausa `IconButton xl` + `Button primary xl` "Terminar brew". Propósito en `body-lg` blanco como los demás (P-07). Línea de estado: "N s restantes" hasta el inicio de la ventana, "En la ventana objetivo" (`--success`) dentro, y "+m:ss sobre la meta" después (`TODO(ds-pendiente): P-05`).
- **Pausado (07):** overlay `--bg` al 70 % + blur sobre el paso · `Orb outline` 180 "PAUSADO" + tiempo congelado `num-window` · pastilla "El timer está congelado" + "Primer vertido · paso 3 de 6" · `Continuar` (primary xl), `Siguiente paso` (secondary), `Reiniciar paso` (tertiary). Tocar fuera del botón de pausa **no** pausa.
- **Fin (09):** `BrewSummarySheet` "Tu café está listo" · TIEMPO TOTAL `num-xl` · `StatRow` Café / Agua / Temp. · "Evaluar receta" (deshabilitado hasta la fase 4) · "Más tarde" vuelve al Home. Slot de P-05 preparado y vacío. Vibra `[120, 80, 120]`, guarda la `BrewSession` y borra `activeBrew`.
- **Salir (10):** ✕ o botón atrás de Android → `BottomSheet default` "¿Salir del brew?" · "Perderás el progreso de esta preparación." · `Seguir preparando` (primary) · `Salir` (danger). Salir borra `activeBrew`.
- **Wake lock** al entrar a `prep`, re-solicitud en `visibilitychange`, liberar al terminar/salir; `useWakeLock` con manejo de fallo (`Banner` discreto).
- Haptics de DS §2.7, apagables con un `Toggle` (si no hay pantalla de Setup todavía, en un `BottomSheet default` desde el ícono de Setup del Home; `TODO(ds-pendiente)` si hace falta).
- Brew Mode nunca muestra "Sin conexión". `data-mode="brew"`, oscuro siempre.

## PWA (tech §4)
Serwist: precache de app shell, JS, CSS, fuentes, íconos y `src/assets/`; manifest instalable (nombre, íconos 192/512/maskable, `display: standalone`, `lang: es`); `navigator.storage.persist()`. Debe abrir y funcionar en **modo avión** tras la primera visita. Íconos de la app: no los inventes; si necesitas uno, pídemelo (placeholder neutro solo con tokens y avísame).

## Estructura (SDD §2, fase 2)
```
src/data/recipes.seed.json
src/lib/{offline-db.ts, schemas/recipe-seed.ts}
src/features/brew-mode/{brew-machine.ts, brew-clock.ts, brew-store.ts, useBrewTimer.ts, useWakeLock.ts, useHaptics.ts, useResumeBrew.ts, screens/*}
src/features/home/monthly-stats.ts
src/app/{(app)/layout.tsx, (app)/page.tsx, brew-mode/[versionId]/page.tsx, manifest.ts, sw.ts}
tests/unit/{brew-machine.test.ts, brew-clock.test.ts, recipe-seed.test.ts, monthly-stats.test.ts}
tests/e2e/{home.spec.ts, brew-mode.spec.ts, resume.spec.ts, offline.spec.ts, timer-drift.spec.ts}
docs/qa/fase-2-dispositivo.md
```

## Reglas del proyecto
- Todo lo de `CLAUDE.md` (Figma como fuente visual, DS, 0 hex fuera de tokens, `crema` en la lista cerrada, números mono tabular, texto mínimo 11 px, "g" nunca "gr", copy español sin emojis, TypeScript strict).
- Timer **por timestamps**; deriva < 100 ms en 3 min. Estado en **IndexedDB**, no `sessionStorage`.
- La lógica del brew es pura y testeada; los componentes no deciden transiciones.
- Las recetas seed no se editan en caliente; la lógica de ajuste es de la fase 4.
- Contradicciones nuevas → `docs/bloom_decisions.md` § PENDIENTES (P-23 en adelante) y me preguntas.
- No construyas Setup, cafés, evaluación, motor de recetas ni backend.

## Tests (SDD §9)
- `brew-clock.test.ts`: 180 s simulados con jitter y un hueco de 5 s → |error| < 100 ms, también tras pausas.
- `brew-machine.test.ts`: prep → countdown (y Cancelar) → con tiempo → último paso que **no** termina solo → "Terminar brew" → `finished`; "Listo" solo en `prep`; `warn3s` una vez por paso; espera entre bloom y vertido 1; `NEXT_STEP`/`RESTART_STEP` mantienen el invariante; `restore()` en todas sus ramas.
- `recipe-seed.test.ts`: las 3 recetas validan; números iguales a product §9; ventanas sin solape; gramos acumulados monótonos.
- `monthly-stats.test.ts`: mes vacío, un método, empate, sesiones de otro mes o abandonadas no cuentan, porcentajes.
- e2e Playwright perfil Pixel: flujo completo de cada receta con `page.clock`; el Home refleja el brew recién terminado; retomar tras cerrar el contexto; modo sin red; botón atrás con confirmación; tocar fuera del botón de pausa no pausa; `timer-drift` real de 3 min (`npm run e2e:drift`).
- Lighthouse a11y ≥ 95 en Brew Mode y Home. Captura 390×844 de cada pantalla junto a su frame de Figma.

## Criterio de éxito de esta fase
1. `npm run check` y `npm run e2e` pasan; `npm run e2e:drift` reporta deriva máxima < 100 ms.
2. Las 3 recetas se preparan de principio a fin con los números exactos de product §9, y el último paso se termina a mano.
3. Cerrar la app a mitad y reabrir ofrece "Retomar brew en m:ss" y retoma bien.
4. El Home muestra los brews del mes y el uso por método después de preparar.
5. La PWA se instala en Chrome Android y funciona en modo avión.
6. Genera `docs/qa/fase-2-dispositivo.md` con la lista de comprobación para mi teléfono: pantalla no se apaga en 5 min, vibración en cada evento de DS §2.7, retomar tras cerrar, modo avión, instalación, legibilidad a 50–70 cm con manos mojadas, TalkBack, y un registro de 7 días de uso real (fecha, receta, problemas).
7. Fase cerrada solo cuando yo apruebe tras esos 7 días de uso real.

Empieza por el plan (incluye los 3 bloqueantes). Luego, en orden: esquema Dexie + seed + Zod, `brew-clock`, `brew-machine` y `monthly-stats` con sus tests, hooks, pantallas (consultando Figma), PWA, e2e, y al final el checklist del teléfono.
===========================================
