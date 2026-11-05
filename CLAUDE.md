# Bloom — reglas permanentes

## Qué es
Bloom es un copiloto de café de especialidad: una PWA para Android (Chrome), en español, para uso personal que escala.
Su pantalla principal es Brew Mode, que acompaña cada preparación segundo a segundo y funciona sin conexión.
Aprende de cada taza con reglas deterministas; el LLM (fase 6+) solo extrae y redacta.

**Fase actual: 4 · Evaluación y aprendizaje** (aprobada el 4 nov 2026, `docs/prompts/fase-4.md`; motor de recetas con P-14.1). Siguen abiertas la prueba de 7 días de la fase 2 (`docs/qa/fase-2-dispositivo.md`) y la prueba en el teléfono de la fase 3. Fase 1 cerrada. Cambiar de fase solo cuando George lo apruebe.

## Precedencia y dónde está cada cosa
Si dos documentos chocan manda el de arriba:
1. `docs/bloom_decisions.md` v1.1 — decisiones D-01…D-17 y PENDIENTES (P-xx).
2. `docs/bloom_tech_architecture.md` v2.1 — stack, fases, flujo con Figma (§0.1), esquema, offline, seguridad.
3. `docs/bloom-design-system.md` v1.2 — tokens, componentes, patrones, `tokens.css` (§9.2), `tailwind.css` (§9.3), mapa de Figma (§12).
   **+ Figma** (`b6fW2A40LxfXyqHOloXxnv`, sección `7:12`, componentes `6:2`) manda en lo visual: layout, jerarquía, composición y copy (D-14).
4. `docs/bloom_product.md` v0.5 — PRD: flujos, recetas seed (§9), motor de ajuste (§10), inventario (§13).
- `docs/SDD.md` — cómo se construye todo: versiones fijadas, modelo de datos, máquina del brew, módulos, IA, tests.
- `docs/prompts/fase-N.md` — prompt de arranque de cada fase.
- `docs/bloom_seed_champions.json` — seed curado. **Solo lectura.**

## Comandos
```
npm run dev          # http://localhost:3000  (/ds = preview del DS)
npm run test         # Vitest
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run check        # typecheck + lint + check:hex + check:accent + check:copy + test
npm run e2e          # Playwright, perfil Pixel
npm run e2e:drift    # deriva real del timer, 3 min
npm run lhci         # Lighthouse a11y sobre /ds
```
Versiones fijadas en `docs/SDD.md` §1.1 (`save-exact`). No actualizar ni cambiar paquetes sin avisar.

## Flujo con Figma (tech §0.1)
- Antes de construir o tocar una pantalla o componente: `get_design_context` + `get_screenshot` del nodo de DS §12.
- La salida del MCP es referencia: tradúcela a tokens y componentes propios. Nada de hex sueltos, px arbitrarios ni nombres de capa como clases.
- Valor de Figma sin token: usa el token más cercano, marca `// TODO(ds-pendiente): <qué falta>` y agrega la fila a PENDIENTES.
- Logo e ilustraciones: SVG en `src/assets/` (P-08). Si en Figma son raster, placeholder con `TODO(ds-pendiente)`; no los redibujes.
- Al cerrar una pantalla: captura 390×844 y compárala con su frame.

## Reglas del design system
- Jerarquía: **Tokens → Componentes → Patrones → Pantallas.** Lo que no está definido en un nivel se resuelve con el nivel anterior.
- **0 hex fuera de `src/styles/tokens.css`.** Ni colores literales, ni tamaños, radios, espacios o duraciones sueltos: todo sale de tokens.
- `tokens.css` es idéntico a DS §9.2; `tailwind.css` a DS §9.3 (`@theme inline`, sin referencia circular de fuentes).
- **No inventar componentes ni tokens.** Si falta uno, compón con los existentes; si es imposible, deja `TODO(ds-pendiente): <justificación>` y agrega la fila a PENDIENTES. No improvises estilo.
- Componentes propios; sin shadcn. Radix solo headless, solo para `BottomSheet`.
- **`crema` (`--accent`) solo en la lista cerrada de DS §2.1:** progreso del paso activo, dot actual, tiempo restante del paso, número del 3-2-1, `:focus-visible`, badge ⭐ de receta bloqueada, ícono `star` del nivel 5. Nunca en botones, fondos ni barras de métricas (P-03).
- **Todo número en mono tabular** (clase `.num`: Geist Mono + `tabular-nums`). Formato DS §7: `15 g`, `92 °C`, `1:16`, `2:40`.
- **Texto mínimo 11 px** (`label`). Nada más chico, aunque Figma lo tenga.
- **Copy en español, tuteo, sin emojis en la UI** (los emojis del PRD se traducen a íconos Lucide, DS §2.8). Siempre "g", nunca "gr"; "vierte", nunca "vertir".
- Un solo `Orb` sólido por vista; targets ≥ 48 px (Brew Mode ≥ 64 px); sin sombras en tema oscuro; Brew Mode siempre oscuro.

## Reglas de Brew Mode
- **Funciona siempre sin conexión.** Nunca depende de la red ni muestra "Sin conexión".
- **Timer por timestamps**, nunca acumulando `setInterval`: `elapsed = (pausedAt ?? now) − t0 − totalPausedMs`. Deriva < 100 ms en 3 min.
- **Screen Wake Lock** al entrar, liberar al salir, re-solicitar en `visibilitychange`.
- **Tocar la pantalla no pausa.** Solo el botón de pausa (64 px). "Listo" existe solo en pasos `prep`. El botón atrás de Android = ✕ con confirmación ("¿Salir del brew?").
- **El último paso lo terminas tú** con "Terminar brew" (D-17); nunca avanza solo. Luego `BrewSummarySheet` → "Evaluar receta" / "Más tarde". La `BrewSession` se guarda al terminar (fase 2).
- **Estado en IndexedDB (Dexie)**, no `sessionStorage`: cada cambio y cada 1 s. Al reabrir ofrece "Retomar brew en m:ss".
- Los pasos `prep` cuentan en "Paso N de M" y no tienen temporizador; el tiempo total arranca en el primer paso con tiempo, tras el 3-2-1 (D-10).
- Aviso visual completo siempre: la vibración puede estar apagada o no existir.

## Reglas de datos e IA
- **El seed de campeones no se toca**: no se edita, no se completa, no se "corrige" con datos generados. Fila nueva solo con fuente y aprobación de George.
- **El LLM no decide parámetros** (gramos, °C, clicks, tiempos, qué ajuste aplicar). Solo extrae de la foto, resume resultados con URL y redacta.
- **Nunca presentar un dato inferido (`~`) como hecho.** Todo dato lleva su estado: observado / verificado / inferido. El discurso no recibe campos inferidos.
- Campo desconocido = `null` (nunca "N/A" ni adivinar). Afirmación sin URL devuelta por la búsqueda = descartada en código.
- Salidas del LLM siempre con esquema Zod. Modelos: `claude-haiku-5-5`, reintento `claude-sonnet-5-5`. No `claude-sonnet-4`.
- Datos y auth (fase 5+): Supabase Auth + RLS, `supabase-js`/`@supabase/ssr` con el JWT del usuario. Nada de Prisma, Auth.js, `AUTH_SECRET` ni `DATABASE_URL` en cliente. `service_role` solo en jobs de servidor.
- Sin datos de terceros (D-04). Todo número de receta sale del seed o de los motores deterministas, nunca de un modelo.

## Definición de "listo" por fase (tech §0)
| Fase | Listo cuando… |
|---|---|
| 1 | DS §9.4: 0 hex fuera de `tokens.css`; todos los componentes DS §3 en `/ds` con todos sus estados; Lighthouse a11y ≥ 95 en `/ds` |
| 2 | 7 días de uso real en el Android de George; timer < 100 ms de deriva en 3 min; retomar tras cerrar la app; PWA instalable y funcional en modo avión |
| 3 | Tests unitarios de todas las tablas de mapeo de `recipe-engine` |
| 4 | Tests que reproducen V1 → V2 revertida → V3 ⭐ (product §10.3) |
| 5 | Brews offline sincronizan sin duplicarse; test de RLS: B no ve ni toca datos de A |
| 6 | Evals E-01 y E-02 corridos; 0 campos inventados en el set del eval |
| 7 | El discurso no contiene ningún dato `~` |

**Prueba final de cada fase:** Chrome Android. Primero Playwright con perfil Pixel (emulación); después el teléfono de George (wake lock, vibración, instalación PWA, modo avión). Una fase no está cerrada hasta pasar las dos.

## Cómo trabajar
1. **Plan antes de cada fase.** Lee `docs/SDD.md` y el prompt de la fase; muestra el plan y espera aprobación antes de escribir código.
2. **Una fase a la vez.** No adelantes código de fases futuras ni dependencias que aún no tocan (ver tabla "Fase" en SDD §1.1).
3. **Contradicción nueva** (entre documentos, o entre un documento y la realidad): no la resuelvas sola. Agrégala a `docs/bloom_decisions.md` § PENDIENTES como `P-xx` (qué choca, opciones, tu recomendación), pregunta a George y espera.
4. No inventes datos de campeones, precios, versiones ni textos de producto faltantes: déjalos `null` y avísalo.
5. Ante duda de API o versión de un paquete, lee su documentación vigente; no la asumas de memoria.
6. Antes de dar algo por hecho corre `npm run check`. Informa fallos con la salida, no los ocultes.
7. TypeScript `strict`. Lógica de negocio pura y testeada en `src/lib` o `features/*`; componentes sin lógica de negocio.
