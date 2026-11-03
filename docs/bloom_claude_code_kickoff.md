# Bloom — Arranque en Claude Code
> v1.1 · 3 nov 2026 · Prompts para Claude Code.
> - **Prompt 1**: genera el SDD y las reglas del repo.
> - **Prompt 2**: ejecuta la fase 1.
> - **Prompt 3**: re-alinea el SDD y la fase 1 ya construida al diseño de Figma (DS v1.2). Úsalo **ahora**, porque la fase 1 ya se ejecutó con DS v1.1.

## Antes de pegar cualquier prompt

1. Crea la carpeta del repo (`bloom/`) y ábrela en Claude Code.
2. Crea `bloom/docs/` y copia ahí estos 5 archivos del proyecto. Si ya existen, reemplázalos:
   `bloom_decisions.md` (v1.1), `bloom_product.md` (v0.5), `bloom_tech_architecture.md` (v2.1), `bloom-design-system.md` (v1.2), `bloom_seed_champions.json` (v1.1).
3. Conecta el Figma MCP en Claude Code. Desde la fase 1, Figma es la fuente visual (D-14).
   - Opción recomendada (incluye las skills de Figma): `claude plugin install figma@claude-plugins-official`. Reinicia Claude Code y entra con `/plugin`.
   - Opción manual: `claude mcp add --transport http figma https://mcp.figma.com/mcp`.
   - Fuente: [Figma — Remote server installation](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation).
4. Pega el prompt que toque.

---

## Prompt 1 — SDD + reglas del repo (sin código de la app)

```
Vamos a construir Bloom, mi app de café de especialidad: una PWA para Android con Brew Mode offline primero. En esta sesión NO escribas código de la app. Quiero el Software Design Document y las reglas del repo, para que cada fase posterior arranque sin preguntas abiertas.

## Fuentes (léelas completas antes de hacer nada)
En docs/ están los 5 documentos fuente:
1. docs/bloom_decisions.md: log de decisiones D-01 a D-17 y tabla de PENDIENTES. Manda sobre todo lo demás.
2. docs/bloom_tech_architecture.md: v2.1 (stack, fases, flujo con Figma, esquema, offline, seguridad).
3. docs/bloom-design-system.md: v1.2 (tokens, componentes, patrones de pantalla, mapa de nodos de Figma en §12).
4. docs/bloom_product.md: v0.5. Hace de PRD.
5. docs/bloom_seed_champions.json: seed curado. Nunca se modifica ni se completa con datos generados.
Precedencia cuando algo choque: decisions → tech → design system (+ Figma) → product.
Figma (archivo b6fW2A40LxfXyqHOloXxnv, sección 7:12) es la fuente visual. Usa el Figma MCP para ver los frames que lista DS §12.

## Tarea
Usa la skill `sdd` con docs/bloom_product.md como PRD y el resto como restricciones ya decididas. Si la skill no está disponible en esta sesión, avísame y sigue igual con su misma estructura: header técnico, stack y decisiones, estructura del proyecto, modelo de datos, API, módulos de lógica, IA, variables de entorno, setup, tests críticos y prompts de arranque.

Ajustes a la plantilla de la skill (lo ya decidido manda sobre sus defaults):
- Auth y datos: Supabase Auth + @supabase/ssr + supabase-js con el JWT del usuario, migraciones SQL con Supabase CLI y tipos con `supabase gen types`. Nada de Prisma, Auth.js, AUTH_SECRET ni DATABASE_URL directa en el cliente (D-03).
- IA: claude-haiku-5-5, con un reintento en claude-sonnet-5-5 si la extracción falla la validación. Búsqueda: Exa como principal y Perplexity Search API de respaldo, detrás de las interfaces LLMProvider y SearchProvider (D-05, D-06). No uses claude-sonnet-4.
- Frontend: Next.js App Router, TypeScript strict, Tailwind v4 con `@theme inline`, componentes propios del DS (sin shadcn; Radix solo headless para BottomSheet), Dexie, Zustand y Serwist (D-07, D-13).
- Diseño: flujo de tech §0.1. Antes de cada pantalla o componente, get_design_context + get_screenshot del nodo de DS §12; la salida es referencia, se traduce a tokens y componentes propios.
- Versiones: consulta en npm la última versión estable de cada paquete y fíjala en el SDD. No inventes números de versión.
- Modelo de datos: las fases 1–4 no tienen backend. Documenta primero el esquema de IndexedDB (Dexie, con brewSessions desde la fase 2) y la máquina de estados del brew (estados, eventos, transiciones, persistencia, retomar, último paso manual "Terminar brew"). El SQL de Postgres + RLS y el diseño de API aplican desde la fase 5, tal como están en tech §3.
- Sección de IA: salida estructurada con esquemas Zod, campo desconocido = null, afirmación sin URL devuelta por la búsqueda = descartada, y el LLM nunca decide parámetros de receta (solo redacta).
- Lógica de negocio: especifica con firmas TypeScript recipe-engine, brew-adjust (reglas R1–R8 de product §10.3), inventory (umbrales D-09), monthly-stats (tech §4), confidence y brew-machine.
- Tests críticos: incluye el criterio de "listo" de cada fase (tech §0), el ejemplo V1 → V2 revertida → V3 ⭐ de product §10.3, la deriva del timer < 100 ms en 3 min, retomar tras cerrar la app y el aislamiento de RLS entre dos usuarios.
- Variables de entorno: completas, por fase. Las de fases 1–4 deben ser cero o casi cero.
- Prompts de arranque: uno completo para la fase 1 (tokens.css, tailwind.css, todos los componentes del DS §3 y la ruta /ds con todos sus estados) y uno para la fase 2 (Brew Mode offline con las 3 recetas seed de product §9). Ninguno más por ahora.

## Entregables
1. docs/SDD.md: el SDD completo.
2. CLAUDE.md en la raíz, con menos de 150 líneas. Son las reglas permanentes que vas a leer en cada sesión:
   - Qué es Bloom en 3 líneas y la fase actual (fase 1).
   - Precedencia de docs, Figma como fuente visual y dónde está cada cosa.
   - Comandos (dev, test, lint, typecheck).
   - Reglas del DS: Tokens → Componentes → Patrones → Pantallas; 0 hex fuera de tokens.css; no inventar componentes ni tokens (si falta uno, `TODO(ds-pendiente):` y fila en PENDIENTES); crema solo en la lista cerrada de DS §2.1; todo número en mono tabular; texto mínimo 11 px; copy en español con tuteo, "g" y nunca "gr", sin emojis en la UI.
   - Reglas de Brew Mode: offline siempre, timer por timestamps, wake lock, tocar la pantalla no pausa, estado en IndexedDB.
   - Reglas de datos e IA: el seed de campeones no se toca; el LLM no decide parámetros; nunca presentar dato inferido como hecho.
   - Definición de "listo" por fase y prueba final en Chrome Android (Playwright con perfil Pixel + mi teléfono).
   - Cómo trabajar: plan antes de cada fase; una fase a la vez; si encuentras una contradicción nueva, la agregas a docs/bloom_decisions.md como PENDIENTE y me preguntas, no la resuelves solo.
3. docs/prompts/fase-1.md y docs/prompts/fase-2.md: los prompts de arranque.

## Cómo trabajar en esta sesión
- Antes de escribir los archivos, muéstrame un plan corto: índice del SDD, decisiones que vas a tomar que no estén en los docs y dudas.
- No inventes datos de campeones, precios ni versiones.
- Al terminar, resume en 10 líneas como máximo: qué decidiste que no estaba en los docs, qué quedó PENDIENTE y qué necesito tener listo yo antes de la fase 1 (cuentas o claves; para la fase 1 debería ser nada).

Empieza leyendo docs/bloom_decisions.md.
```

---

## Prompt 2 — cuando apruebes el SDD

```
SDD y CLAUDE.md aprobados. Ejecuta docs/prompts/fase-1.md. Primero muéstrame el plan; luego construye. Al terminar, corre los criterios de aceptación de DS §9.4 y dime cómo abrir /ds en mi teléfono Android.
```

---

## Prompt 3 — Re-alinear SDD y fase 1 a Figma (DS v1.2)

Úsalo en el repo donde ya corriste los prompts 1 y 2. Antes, reemplaza los 5 archivos de `docs/` por las versiones nuevas y conecta el Figma MCP (pasos 2 y 3 de arriba).

```
Cambió la fuente visual de Bloom. Diseñé y definí en Figma el Home y el flujo completo de Brew Mode, y los documentos se actualizaron a partir de ese diseño. La fase 1 que construiste usa DS v1.1, que ya no vale. En esta sesión vas a re-alinear el SDD, CLAUDE.md, los prompts de fase y el código de la fase 1 al diseño nuevo. No avances a la fase 2.

## Qué cambió en docs/ (léelos completos, en este orden)
1. docs/bloom_decisions.md v1.1: D-14 a D-17 nuevas y una tabla de PENDIENTES (P-01 a P-08), cada uno con su "mientras tanto".
2. docs/bloom-design-system.md v1.2: §11 lista los cambios; §12 es el mapa de nodos de Figma.
3. docs/bloom_tech_architecture.md v2.1: §0.1 flujo con Figma, §4 brewSessions desde la fase 2 y métricas del Home, §9 src/assets/, §12 checklist.
4. docs/bloom_product.md v0.5: §8 Brew Mode, §18–19 IA y navegación, §27 cambios.

## Figma
- Archivo: b6fW2A40LxfXyqHOloXxnv. Sección de pantallas: 7:12. Componentes: 6:2.
- Para cada componente o pantalla que toques: get_design_context + get_screenshot del nodeId que indica DS §12.
- La salida del MCP es una referencia. Tradúcela a nuestros tokens y componentes: nada de hex sueltos, px arbitrarios ni nombres de capa como clases.
- Si Figma y el DS v1.2 no coinciden en algo que no esté ya en las PENDIENTES, no lo resuelvas tú. Agrégalo como P-09, P-10… y pregúntame.
- El wordmark y las ilustraciones de método van como SVG en src/assets/ (P-08). Si en Figma están como imagen raster, deja un placeholder con TODO(ds-pendiente) y avísame. No los redibujes.

## Tarea
1. Diff de docs: compara las versiones anteriores (las que usaste: tech v2.0, DS v1.1, product v0.4, decisions sin D-14..17) con las nuevas, y lista qué cambia en el SDD y en el código.
2. Actualiza docs/SDD.md: estructura (stock/, diario/, assets/, features/home/), esquema Dexie (brewSessions en fase 2), máquina de estados del brew (countdown con texto del primer paso, último paso manual "Terminar brew" → resumen → "Evaluar receta" / "Más tarde"), módulo monthly-stats con su firma, y tests nuevos. Agrega al SDD un changelog corto.
3. Actualiza CLAUDE.md: Figma como fuente visual con el flujo de tech §0.1, `TODO(ds-pendiente)`, texto mínimo 11 px, "g" nunca "gr". Mantenlo por debajo de 150 líneas.
4. Actualiza docs/prompts/fase-1.md (para que quede como registro) y docs/prompts/fase-2.md (anatomía nueva del paso, Fin, brewSessions, métricas del Home).
5. Código de la fase 1:
   - Tokens: tokens.css y tailwind.css con la escala nueva de DS §2.2 y §9.2 (num-countdown, num-time, num-window, num-sm, title-md y sus line-heights).
   - Componentes modificados: TopBar (home · flow · brew), Tile (meter · orb · bar), ListRow v1.2, BottomNav v1.2 (Inicio · Stock · Hacer café · Diario deshabilitado · Setup), TimerRing v1.2 y dots centrados.
   - Componentes nuevos: InfoList, MethodIllustration, StatRow, CoffeeHero y BrewSummarySheet.
   - /ds: todos los estados nuevos, incluido el TimerRing en pour, wait, últimos 3 s y pausado.
   - Lo que esté en PENDIENTES se construye según su "mientras tanto". Por ejemplo: la barra del tile V60 va en --text-1 y no en crema (P-03), y el estado de los últimos 3 s se implementa como dice DS §3.24 (P-06).
   - Elimina o renombra lo que ya no existe (Lab en la nav, tiles Tueste y Última taza, "acumulado", "Siguiente"). No dejes código muerto.

## Cómo trabajar
- Primero muéstrame un plan: el diff de docs del paso 1, la lista de archivos que vas a tocar, los nodeId de Figma que vas a consultar y tus dudas. Espera mi OK.
- Después, en este orden: SDD → CLAUDE.md → prompts → tokens → componentes → /ds.
- Al terminar:
  - Corre typecheck, lint, tests y los criterios de DS §9.4 (0 hex fuera de tokens.css, Lighthouse a11y ≥ 95).
  - Captura /ds en 390×844 junto a los frames de Figma de cada componente.
  - Resume en 10 líneas como máximo: qué cambió, qué PENDIENTES siguen abiertas y si hay algo nuevo que deba decidir yo.

Empieza leyendo docs/bloom_decisions.md.
```

---

## Prompt 4 — fase 2 (cuando apruebes el Prompt 3)

```
Fase 1 re-alineada y aprobada. Ejecuta docs/prompts/fase-2.md. Consulta en Figma los frames de Brew Mode de DS §12 antes de cada pantalla. Primero muéstrame el plan; luego construye.
```
