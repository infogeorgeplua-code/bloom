===========================================
CLAUDE CODE — PROMPT Y PLAN DE ARRANQUE
Proyecto: Bloom · Fase 3 · Recetas + Setup (+ inventario local, P-25)
(v1.0 · 4 nov 2026 · aprobado por George: "Arranca con la fase 3")
===========================================

La fase 2 está construida (Brew Mode offline, Home, PWA en Vercel) y se cierra con los 7 días
de uso (`docs/qa/fase-2-dispositivo.md`). La fase 3 corre en paralelo. Todo sigue **sin backend**:
IndexedDB es la fuente de verdad hasta la fase 5.

Lee antes: `CLAUDE.md`, `docs/SDD.md` §3.1–3.2, §5.3, §5.5, §5.9; `docs/bloom_product.md` §6, §11,
§13, §18–21; `docs/bloom_decisions.md` (P-03, P-14, P-17, P-25 y "Resueltos 4 nov").

## Alcance

### A. Ajustes de diseño de Figma 7:12 (el Figma manda en lo visual)
1. TimerRing: "Vierte agua hasta" sobre los gramos (frames 05/06).
2. Home = frame 01 con datos reales: hero del café habitual elegido por el sistema, Stock, Este mes,
   tiles por método (P-03: `--text-1` / `--text-2`, nunca crema), "Tengo un café nuevo", Cafés recientes.
   "Recetas base" sale del Home: las recetas sin café siguen en Hacer café.
3. BottomNav navega: Stock → `/stock`, Hacer café → `/hacer-cafe`, Setup → `/setup`. Diario sigue
   deshabilitado (P-01) con ícono `notebook` (P-17).

### B. Datos locales (Dexie v2, migración sin perder v1)
| Store | Fila | Índices |
|---|---|---|
| `coffees` | `{ id, name, roaster, originCountry, process, variety, roastLevel, roastDateISO, altitudeM, createdAtEpochMs, archived }` (campo vacío = `null`, nunca "N/A") | `id, createdAtEpochMs` |
| `bags` | `{ id, coffeeId, number, initialG, openedAtEpochMs, status: 'active'\|'finished', finishedAtEpochMs }` | `id, coffeeId, status` |
| `stockAdjustments` | `{ id, bagId, deltaG, createdAtEpochMs, reason: 'manual' }` (P-11 adelantado) | `id, bagId` |
| `meta` | `setup = { grinder: GrinderSetup \| null, brewAltitudeM: number \| null }` | — |

Gramos actuales = inicial − Σ brews de la bolsa + Σ ajustes (derivado, nunca guardado).
Cada brew terminado se vincula a la receta (`coffeeId`) y a la bolsa activa de ese café (`bagId`).

### C. Lógica pura con tests (`src/features/*`)
- `inventory` (SDD §5.5, D-09): `stockStatus`, `currentGrams`, `meterFill` + todos los casos límite.
- `recipe-engine` (SDD §5.3): `generateRecipe`, `applyObjective`, `roastWindow`, `brewAltitudeCap`,
  `grindFor`. Tablas en `engine-tables.ts` (P-14, propuesta en decisions). Un test por fila.
- `habitual` (SDD §5.9): qué café muestra el hero.
- `grinders`: preset LEBURRY 38 posiciones (rangos del fabricante; AeroPress inferido).

### D. Pantallas (sin frame en Figma: DS §3–4, patrones existentes, UX móvil)
| Ruta | Qué hace |
|---|---|
| `/cafe/nuevo` | "Tengo un café nuevo": solo el nombre es obligatorio; el resto opcional y agrupado (Café · Origen · Proceso y tueste · Bolsa). Chips para enums, fecha nativa, gramos con atajos 250/340/500/1000. CTA fija "Guardar café". También sirve para editar (`?id=`). |
| `/stock` | Biblioteca: cafés con bolsa activa (gramos y alerta), terminados aparte, "Tengo un café nuevo". |
| `/cafe?id=` | Perfil: ficha con estado de cada dato (observado), ventana de tueste, bolsa activa con `StockMeter`, ajustar gramos, marcar terminada, bolsa nueva, brews del café, "Preparar". |
| `/hacer-cafe` | Flujo 1: café (o "sin café registrado") → método → objetivo (y preferencia si es "para alguien más") → receta con trazabilidad y "Esta receta prioriza…" → "Preparar ahora". R1: si ya existe la receta café+método+objetivo, se reutiliza su versión activa. |
| `/brew?v=` | Brew Mode para recetas guardadas en IndexedDB (las del motor). Precacheado, abre sin conexión. |
| `/setup` | Molino (LEBURRY u otro con su rango), punto de partida por método, altitud donde preparas, vibración. |

## Fuera de alcance
Evaluación 1–5 y motor de ajuste (fase 4), backend y sync (fase 5), escaneo y búsqueda (fase 6),
recetas propias/encontradas y discurso (fase 7), perfil de agua y variedad en el motor (sin tabla).

## Listo cuando
- Tests unitarios de **todas** las tablas de mapeo del motor (criterio de tech §0) + inventario + habitual.
- `npm run check` verde; e2e (Pixel) de: alta de café → Hacer café → Brew → stock descontado; modo avión en `/brew?v=`.
- Capturas 390×844 del Home comparadas con el frame 01.
- George confirma o corrige las tablas de P-14 en el uso real.

## Registro
- 4 nov 2026: plan aprobado; decisiones P-03, P-17, P-25, molino LEBURRY y Home demo registradas.
- 4 nov 2026: construida. Dexie v2, inventario, motor + tablas (P-14 por confirmar), 6 pantallas nuevas, Home = frame 01 con datos reales. `npm run check` (322 tests) y 21 e2e en verde, axe sin violaciones en las pantallas nuevas. Corrección de paso: `reloadOnOnline={false}` en `SerwistProvider`.
- Falta: George confirma las tablas de P-14 y prueba el flujo en el teléfono.
