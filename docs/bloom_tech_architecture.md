# Bloom — Arquitectura Técnica
> Documento técnico v2.1 · 3 nov 2026 · PWA para Android · Offline-first · Uso personal escalable
> Reemplaza a v2.0. Decisiones y fuentes en `bloom_decisions.md` (D-xx). La fuente visual es Figma (D-14); el mapa de nodos está en `bloom-design-system.md` §12.
> Cambios v2.1: flujo de trabajo con Figma MCP (§0.1), `brewSessions` desde la fase 2, métricas mensuales del Home (§4), carpeta `src/assets/` (§9), checklist actualizado a DS v1.2 (§12).

---

## PRINCIPIO TÉCNICO GENERAL

Bloom debe funcionar en tres condiciones:

1. **Con conexión:** investigación, LLM, sincronización.
2. **Con conexión lenta:** el brew mode no puede depender de la red.
3. **Sin conexión:** brew mode, recetas guardadas y evaluación funcionan siempre.

**El brew mode es offline-first y se construye primero.** Hasta la fase 4 la app no tiene backend.

---

## 0. FASES DE CONSTRUCCIÓN (orden obligatorio para Claude Code)

| Fase | Entregable | Backend | Criterio de "listo" |
|---|---|---|---|
| 1 · Fundaciones | `tokens.css`, componentes del DS, ruta `/ds` con todos los estados | No | Criterios DS §9.4 (0 hex fuera de tokens, Lighthouse a11y ≥ 95) |
| 2 · Brew Mode offline | `recipes.seed.json` (V60, AeroPress, Espresso), vista previa, pasos prep + con tiempo, pausa, retomar, wake lock, vibración, PWA instalable | No | 7 días de uso real en el Android de George. Timer < 100 ms de deriva en 3 min. Retomar funciona tras cerrar la app |
| 3 · Recetas + Setup | `recipe-engine` determinista, Setup de molino, cafés manuales, objetivo de taza | No | Tests unitarios de todas las tablas de mapeo |
| 4 · Evaluación y aprendizaje | Escala 1–5, síntomas, motor de ajuste (R1–R8), versiones, bloqueo | No | Tests que reproducen el ejemplo de `bloom_product.md` §10.3 |
| 5 · Backend + inventario | Supabase (Auth, Postgres, RLS, Storage), sync IndexedDB → nube, bolsas, alertas de stock | Sí | Brews hechos offline sincronizan sin duplicarse. Un usuario no ve datos de otro (test de RLS) |
| 6 · Escaneo + investigación | Evals E-01 y E-02 → `/api/scan`, `/api/research`, clasificación de confianza | Sí | 0 campos inventados en el set del eval |
| 7 · Capa narrativa | Discurso, tips, comparación, recetas propias/encontradas, seed de campeones | Sí | El discurso no contiene ningún dato ~ |

Cada fase arranca con `/plan` en Claude Code y termina con revisión en el teléfono.

### 0.1 Flujo de trabajo con Figma (D-14)

- **Fuentes:** Figma decide cómo se ve; `bloom-design-system.md` decide los tokens y las reglas. Si chocan, se usa Figma, se anota la diferencia en `bloom_decisions.md` y se actualiza el DS.
- **Antes de construir una pantalla o un componente:** Claude Code llama al Figma MCP (`get_design_context` y `get_screenshot`) con el `nodeId` de DS §12. Lo que devuelve es una referencia: se traduce a los tokens y componentes propios, nunca se pega tal cual (sin hex sueltos, sin `px` arbitrarios, sin nombres de capa como clases).
- **Si falta un token:** se usa el más cercano, se marca con `// TODO(ds-pendiente): <qué falta>` y se agrega a la tabla de PENDIENTES del log. No se inventan tokens.
- **Assets:** el wordmark y las ilustraciones de método se exportan desde Figma como SVG (no como imagen raster) a `src/assets/` (P-08).
- **Verificación visual:** al cerrar cada pantalla, captura en 390×844 y comparación con el frame de Figma.

---

## 1. STACK TECNOLÓGICO

### Frontend

| Capa | Tecnología | Fase | Por qué |
|---|---|---|---|
| Framework | **Next.js, App Router** (última versión estable al iniciar, fijada en `package.json`) | 1 | Rutas + API en el mismo repo, deploy en Vercel |
| Lenguaje | **TypeScript** (`strict: true`) | 1 | |
| Estilos | **Tailwind CSS v4** con `@theme inline` sobre los tokens del DS | 1 | D-13 |
| Componentes | **Propios, según el DS**. Primitivas *headless* de Radix solo para diálogo/sheet/focus trap | 1 | shadcn trae estilos propios y choca con "no inventar componentes" (D-07) |
| Íconos | **lucide-react** | 1 | Coincide con DS §2.8 |
| Estado del brew | **Zustand** | 2 | Máquina de estados del brew simple y testeable |
| Base local | **Dexie.js (IndexedDB)** | 2 | Recetas, brew en curso, brews, cola de sync (D-08) |
| PWA | **Serwist** (`@serwist/next`) | 2 | Sucesor mantenido de `next-pwa` |
| Formularios | **React Hook Form + Zod** | 3 | |
| Estado de servidor | **TanStack Query** | 5 | Cache y revalidación cuando existe backend |
| Animación | CSS + tokens de motion. Sin librería | 1–4 | El anillo del timer es SVG + `requestAnimationFrame` |

### Backend (desde fase 5)

| Capa | Tecnología | Por qué |
|---|---|---|
| API | **Next.js Route Handlers** | Mismo repo |
| Auth | **Supabase Auth** (Google OAuth + magic link) | Necesario para que `auth.uid()` y RLS funcionen (D-03) |
| Base de datos | **Supabase Postgres** con RLS en todas las tablas | |
| Acceso a datos | **`@supabase/ssr` + `supabase-js`** con el JWT del usuario | RLS aplica siempre. **Sin Prisma** (se conecta con un rol que ignora RLS) |
| Migraciones / tipos | **Supabase CLI** (SQL) + `supabase gen types typescript` | |
| Archivos | **Supabase Storage** (bucket privado `bag-photos`) | Un proveedor menos que R2 a esta escala |
| Validación | **Zod** compartido cliente/servidor | |
| Trabajo en segundo plano | `after()` de Next + polling. **Inngest** solo si hay timeouts | La investigación tarda 5–15 s; a escala personal no justifica una cola |
| Límites de uso | Contadores diarios en Postgres (`usage_counters`) | Upstash sale del MVP |

### IA y búsqueda (fase 6)

| Capa | Tecnología | Por qué |
|---|---|---|
| LLM | **Claude Haiku 5.5** (`claude-haiku-5-5`) vía SDK de Anthropic. Reintento con **Sonnet 5.5** si la extracción falla la validación | D-06 |
| Abstracción | `LLMProvider` con implementaciones `anthropic` y `openai` | Cambiar de modelo = variable de entorno |
| Búsqueda | **Exa** (`type: fast`) principal, **Perplexity Search API** respaldo | D-05 |
| Abstracción | `SearchProvider` con `exa` y `perplexity` | |

### Testing

| Tipo | Herramienta | Qué cubre |
|---|---|---|
| Unitario | **Vitest** | `recipe-engine`, `brew-adjust`, `inventory`, `confidence`, timer |
| e2e | **Playwright** con perfil de dispositivo Android (Pixel) | Brew Mode completo, retomar, offline |
| Real | Teléfono Android de George, Chrome | Wake lock, vibración, instalación PWA |

### Hosting

| Servicio | Plataforma | Costo uso personal |
|---|---|---|
| App | Vercel (Hobby) | $0 |
| Base de datos + Auth + Storage | Supabase (Free) | $0 |
| LLM | Anthropic API | ~$0,05–0,14/mes (D-06) |
| Búsqueda | Exa ($10/mes de crédito gratis) | $0 a ~32 búsquedas/mes |
| Dominio | Cualquier registrador | ~$10/año |

---

## 2. ARQUITECTURA DEL SISTEMA

```
┌──────────────────────────────────────────────────────────┐
│               ANDROID · Chrome · PWA instalada            │
│                                                          │
│  UI (Next.js) ── Zustand (máquina de estados del brew)   │
│        │                                                 │
│  ┌─────▼───────────────┐   ┌───────────────────────┐     │
│  │ IndexedDB (Dexie)   │   │ Service Worker        │     │
│  │ · recipes           │   │ (Serwist)             │     │
│  │ · activeBrew        │   │ · precache app shell  │     │
│  │ · brewSessions      │   │ · assets y fuentes    │     │
│  │ · syncQueue         │   └───────────────────────┘     │
│  └─────────────────────┘                                 │
│  Wake Lock API · Vibration API                           │
└──────────────────────────────────────────────────────────┘
            │  HTTPS (solo desde fase 5)
            ▼
┌──────────────────────────────────────────────────────────┐
│                     NEXT.JS (Vercel)                     │
│  /api/sync   /api/scan   /api/research   /api/narrative  │
│  Middleware: sesión Supabase · Zod · contadores de uso   │
└──────────────────────────────────────────────────────────┘
      │                  │                      │
      ▼                  ▼                      ▼
┌────────────┐   ┌───────────────┐   ┌────────────────────┐
│ Supabase   │   │ Anthropic     │   │ Exa                │
│ Auth · PG  │   │ Haiku 5.5     │   │ → Perplexity Search│
│ RLS ·      │   │ (Sonnet 5.5   │   │   (respaldo)       │
│ Storage    │   │  reintento)   │   │                    │
└────────────┘   └───────────────┘   └────────────────────┘
```

### Flujo de escaneo (fase 6)

```
1. Foto → el cliente la comprime (lado mayor 1600 px, ≤ 1 MB)
2. Subida a Supabase Storage (bucket privado)
3. POST /api/scan {photo_path}
4. Middleware: sesión válida + contador diario (máx. 10 escaneos/día)
5. Haiku 5.5 con salida estructurada (esquema Zod). Campo no legible = null.
   Si falla la validación → 1 reintento con Sonnet 5.5.
6. Se guarda el café con research_status = 'pending'
7. Respuesta inmediata: ficha con datos 👁
8. after(): 4 consultas a Exa → síntesis con URL por afirmación → clasificación por dominio
9. El cliente consulta cada 3 s hasta research_status = 'complete' | 'failed'
10. Por defecto la foto se borra del storage al terminar (el usuario puede conservarla)
```

---

## 3. BASE DE DATOS (fase 5)

```sql
-- Todas las tablas de usuario tienen user_id uuid references auth.users
-- y RLS activado con la política "dueño".

profiles          (id = auth.uid(), display_name, location_city, altitude_m, created_at)

grinders          (id, user_id, brand, model, min_clicks, max_clicks,
                   calibrations jsonb)          -- [{clicks, descriptor, fecha}]
brewers           (id, user_id, type, size, material, filter_type)
water_profiles    (id, user_id, name, type, tds, gh, kh, ph)

coffees           (id, user_id, name, roaster, lot,
                   country, region, farm, producer, station,
                   species, variety, altitude_m,
                   process_type, process_details jsonb,
                   roast_date, roast_level,
                   notes_roaster text[], notes_mine text[],
                   history_text,
                   confidence jsonb,            -- {campo: observado|verificado|inferido}
                   research_status text,        -- pending|complete|failed|manual
                   photo_path, created_at, updated_at)

research_sources  (id, user_id, coffee_id, url, domain, title, excerpt,
                   confidence text, retrieved_at)

coffee_bags       (id, user_id, coffee_id, bag_number, initial_grams,
                   opened_at, finished_at, status)
                   -- gramos actuales = vista derivada (ver abajo)

recipes           (id, user_id, coffee_id, method, objective,
                   recipe_type,                 -- generated|personal|found
                   traceability jsonb,          -- {source, url, year, champion_ref}
                   created_at)

recipe_versions   (id, user_id, recipe_id, number, parent_version_id,
                   params jsonb,                -- incluye steps[{type, ...}]
                   changes jsonb,               -- [{variable, before, after}]
                   reason text, based_on_brew_ids uuid[],
                   status text,                 -- active|locked|reverted
                   created_at)

brew_sessions     (id, user_id, coffee_id, recipe_version_id, bag_id,
                   client_uuid uuid unique,     -- idempotencia del sync
                   brewed_at, grams_used, duration_s,
                   rating smallint check (rating between 1 and 5),
                   symptoms text[], notes text,
                   created_at)

usage_counters    (user_id, day date, kind text, count int,
                   primary key (user_id, day, kind))

champion_refs     (id, competition, year, name, country, city,
                   recipe jsonb, status, source_url)
                   -- seed público de solo lectura (bloom_seed_champions.json)
```

### Stock derivado

```sql
create view bag_stock as
select b.id as bag_id, b.user_id,
       b.initial_grams - coalesce(sum(s.grams_used), 0) as current_grams
from coffee_bags b
left join brew_sessions s on s.bag_id = b.id
group by b.id;
-- La vista se crea con security_invoker = true para que respete RLS.
```

Guardar el stock como resta de eventos (y no como un número que se sobrescribe) evita conflictos cuando un brew hecho offline llega tarde. Un ajuste manual de stock se registra como un evento más.

### RLS

```sql
alter table coffees enable row level security;
create policy owner_all on coffees
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Igual para todas las tablas con user_id.

alter table champion_refs enable row level security;
create policy public_read on champion_refs for select using (true);
-- Sin políticas de escritura: solo migraciones.
```

Test obligatorio (fase 5): dos usuarios de prueba; el usuario B no puede leer, editar ni borrar nada del A.

---

## 4. OFFLINE Y SINCRONIZACIÓN

### IndexedDB (Dexie)

| Store | Contenido | Desde |
|---|---|---|
| `recipes` | Recetas y versiones disponibles para preparar | Fase 2 (seed) |
| `activeBrew` | Brew en curso: versión, índice de paso, `startedAt`, pausas acumuladas. Se escribe cada 1 s y en cada cambio de paso | Fase 2 |
| `brewSessions` | Brews terminados: método, versión, gramos, tiempo total, `finishedAt`. Se guarda al tocar "Terminar brew"; la calificación se agrega después | Fase 2 (calificación desde fase 4) |
| `syncQueue` | Operaciones pendientes de subir | Fase 5 |

### Métricas del Home (D-15)

Los tiles "Este mes" y uso por método se calculan en el teléfono a partir de `brewSessions`, con un índice por `finishedAt`. No se guarda ningún contador: un brew offline que se sincroniza tarde no puede dejar un número desactualizado.

```ts
// features/home/monthly-stats.ts
// brews del mes en curso, agrupados por método; los 2 métodos más usados van a los tiles
const from = startOfMonth(now);
const sessions = await db.brewSessions.where('finishedAt').aboveOrEqual(from).toArray();
```

Desde la fase 5 la misma consulta corre en Postgres sobre `brew_sessions` (agrupar por `method` y `date_trunc('month', finished_at)`) para mostrar las métricas en otros dispositivos. El tile Stock usa `bag_stock` y, antes de la fase 5, el stock local.

### Timer sin deriva

```ts
// El tiempo transcurrido nunca se acumula con setInterval.
elapsed = (pausedAt ?? performance.now()) - startedAt - totalPausedMs
// Al retomar tras cerrar la app se usa Date.now() persistido,
// porque performance.now() se reinicia con la página.
```

### Sincronización (fase 5)

1. Cada brew se crea offline con un `client_uuid`.
2. Al recuperar conexión (`online` + al abrir la app) se sube `syncQueue` a `/api/sync`.
3. El servidor hace `upsert` por `client_uuid`: reintentar nunca duplica.
4. Conflictos de edición (café, receta): gana el `updated_at` más reciente. Los brews nunca se editan, solo se crean, así que no entran en conflicto.

### Service Worker (Serwist)

| Recurso | Estrategia |
|---|---|
| App shell, JS, CSS, fuentes Geist, íconos | Precache |
| Fotos de bolsas | Cache-first |
| Datos de usuario (fase 5+) | Network-first con fallback a IndexedDB |
| `/api/scan`, `/api/research` | Network-only con mensaje claro si no hay conexión |

---

## 5. LLM — USO Y COSTO

| Función | Modelo | Cuándo | Tokens aprox. (entrada + salida) |
|---|---|---|---|
| Leer la bolsa | Haiku 5.5 (Sonnet 5.5 si falla) | Al escanear | 2.500 + 600 |
| Síntesis de investigación | Haiku 5.5 | Tras el escaneo | 3.000 + 600 |
| Razón de un ajuste | Haiku 5.5 | Al proponer Vn+1 | 800 + 150 |
| Narrativa / discurso / tips | Haiku 5.5 | La primera vez que se abre la sección (luego se guarda) | 1.500 + 600 |
| Insight de comparación | Haiku 5.5 | Al comparar | 1.200 + 300 |
| Preferencia → objetivo técnico | Haiku 5.5 | "Para alguien más" | 300 + 50 |

Precios de lista y benchmarks en D-06. Costo personal estimado: **$0,05–0,14/mes**.

### Reglas para no inventar

1. **Salida estructurada** con esquema Zod en todas las llamadas. Nada de texto libre que luego se parsea.
2. **Grounding obligatorio:** el prompt incluye solo los campos del café y los extractos con URL. Cada afirmación devuelta trae `source_field` o `source_url`. Una afirmación sin fuente se descarta en código.
3. **Campo desconocido = `null`.** El prompt lo dice explícitamente y la validación lo exige.
4. **El LLM no decide parámetros.** El motor de recetas y el de ajuste son deterministas; el LLM solo redacta.
5. **El discurso filtra en código** cualquier campo cuya confianza sea `inferido` antes de enviarlo al modelo.

### Límites diarios por usuario (`usage_counters`)

Escaneos 10 · investigaciones 10 · narrativas 20 · ajustes 50. Al superarlo: 429 con mensaje en español.

---

## 6. BÚSQUEDA

```ts
interface SearchProvider {
  search(query: string, opts: { numResults: number }): Promise<SearchHit[]>
}
type SearchHit = { url: string; domain: string; title: string; excerpt: string }

async function research(coffee: Coffee): Promise<Finding[]> {
  const queries = buildQueries(coffee)          // 4 consultas (bloom_product.md §17)
  const hits = await withFallback(exa, perplexity, queries)
  const findings = await llm.synthesize({ coffee, hits })  // cada finding con source_url
  return findings
    .filter(f => hits.some(h => h.url === f.source_url)) // descarta URLs no devueltas
    .map(f => ({ ...f, confidence: classifyDomain(f.source_url) }))
}
```

`classifyDomain` usa una lista blanca versionada en el repo (`lib/trusted-domains.ts`). El dominio del tostador se agrega a la lista cuando coincide con el nombre leído en la bolsa.

---

## 7. SEGURIDAD

### Autenticación
- Supabase Auth: Google OAuth + magic link. Sin contraseñas.
- Sesión en cookies HttpOnly vía `@supabase/ssr`.

### Datos
- RLS en todas las tablas. Acceso siempre con el JWT del usuario.
- La `service_role` key solo en jobs de servidor que la necesiten, nunca en el cliente ni en rutas que respondan datos de usuario.
- Fotos en bucket privado con URLs firmadas de corta duración. Se borran tras el escaneo por defecto.
- Sin datos de terceros en el MVP (D-04).

### API
- Zod en todos los endpoints.
- El texto del usuario que llega al LLM va delimitado como dato, nunca como instrucción.
- Headers: Content-Security-Policy, `X-Frame-Options: DENY`, HSTS, `X-Content-Type-Options: nosniff`.
- Claves (Anthropic, Exa, Perplexity, Supabase) solo en variables de entorno del servidor en Vercel.

---

## 8. ESCALABILIDAD

| Escala | Cambios | Costo estimado |
|---|---|---|
| Personal (1–10) | Ninguno. Free tiers | ~$1/mes |
| 10–500 | Supabase Pro ($25), Vercel Pro ($20) | ~$50–80/mes |
| 500+ | Revisar D-06 (a esta escala GPT-6 Luna es ~3× más barato por tarea), cola de jobs (Inngest), caché de fichas por tostador + nombre | Recalcular con datos reales |

El brew mode no tiene problema de escala: vive en el dispositivo.

---

## 9. ESTRUCTURA DEL REPOSITORIO

```
bloom/
├── CLAUDE.md                     # Reglas permanentes para Claude Code
├── docs/                         # Copia de los 4 documentos + seeds
├── src/
│   ├── app/
│   │   ├── (app)/                # Layout con bottom nav
│   │   │   ├── page.tsx          # Home
│   │   │   ├── brew/             # Flujo 1: café → método → objetivo → receta
│   │   │   ├── stock/  coffee/[id]/  setup/  diario/   # diario: deshabilitado en V1 (P-01)
│   │   ├── brew-mode/[versionId]/ # Pantalla completa, sin nav
│   │   ├── ds/                   # Preview del design system (fase 1)
│   │   └── api/  sync/  scan/  research/  narrative/   (fase 5+)
│   ├── assets/
│   │   ├── brand/                # bloom-wordmark.svg (exportado de Figma)
│   │   └── illustrations/        # v60.svg, aeropress.svg… (MethodIllustration)
│   ├── components/               # Uno por componente del DS §3
│   ├── features/
│   │   ├── home/                 # monthly-stats.ts

│   │   ├── brew-mode/            # brew-machine.ts, useBrewTimer, useWakeLock, useHaptics
│   │   └── evaluation/           # RatingScale flow, ajuste propuesto
│   ├── lib/
│   │   ├── recipe-engine.ts      # Objetivo → parámetros
│   │   ├── brew-adjust.ts        # Reglas R1–R8
│   │   ├── inventory.ts          # Umbrales D-09
│   │   ├── confidence.ts  trusted-domains.ts
│   │   ├── offline-db.ts         # Dexie
│   │   ├── supabase/             # clientes server/browser (fase 5)
│   │   ├── llm/                  # LLMProvider: anthropic.ts, openai.ts (fase 6)
│   │   └── search/               # SearchProvider: exa.ts, perplexity.ts (fase 6)
│   ├── data/
│   │   ├── recipes.seed.json     # V60, AeroPress, Espresso (bloom_product.md §9)
│   │   └── champions.seed.json   # = bloom_seed_champions.json
│   └── styles/  tokens.css  base.css  tailwind.css
├── supabase/  migrations/  seed.sql
└── tests/  unit/  e2e/
```

---

## 10. DECISIONES TÉCNICAS CLAVE

**¿Por qué Supabase y no Firebase?** Café → recetas → versiones → brews es relacional. Postgres lo modela bien, RLS da seguridad a nivel de base de datos y se puede migrar a Postgres propio.

**¿Por qué sin Prisma?** Prisma se conecta con un rol privilegiado que ignora RLS. Con `supabase-js` y el JWT del usuario, RLS aplica en cada consulta.

**¿Por qué el motor de ajuste no usa ML?** Con 5–30 tazas por café, reglas explícitas y reversibles son más confiables y auditables (D-11).

**¿Por qué stock derivado?** Un brew offline que llega tarde nunca pisa un valor: solo suma un evento.

**¿Por qué una capa de proveedor para LLM y búsqueda?** El mercado cambió dos veces en un año (Bing se retiró; los precios bajaron a la mitad). Cambiar de proveedor debe costar una variable de entorno.

---

## 11. MONITOREO

| Qué | Herramienta | Desde |
|---|---|---|
| Errores en el teléfono | Sentry (free tier) | Fase 2 |
| Rendimiento | Vercel Analytics | Fase 5 |
| Costo y errores de LLM | Consola de Anthropic + log propio de tokens por llamada | Fase 6 |
| Base de datos | Panel de Supabase | Fase 5 |

---

## 12. CHECKLIST POR FASE

```
Fase 1  (re-alineada a DS v1.2 + Figma 7:12)
  ☐ Next.js + TS strict + Tailwind v4 (@theme inline)
  ☐ tokens.css idéntico a DS §9.2 v1.2 (incluye num-countdown, num-time, num-window, num-sm, title-md)
  ☐ Todos los componentes del DS §3 en /ds con todos sus estados
  ☐ v1.2: TopBar (home · flow · brew), Tile (meter · orb · bar), ListRow v1.2,
    BottomNav v1.2, TimerRing v1.2, InfoList, MethodIllustration, StatRow,
    CoffeeHero, BrewSummarySheet
  ☐ Wordmark e ilustraciones como SVG en src/assets/
  ☐ Cada componente comparado con su nodo de Figma (DS §12)
  ☐ 0 hex fuera de tokens.css (grep en CI); texto mínimo 11 px

Fase 2
  ☐ recipes.seed.json con pasos tipados
  ☐ Máquina de estados del brew con tests (prep → countdown → con tiempo → último paso manual "Terminar brew" → resumen)
  ☐ brewSessions se guarda al terminar; Home lee las métricas del mes
  ☐ Wake lock + re-solicitud en visibilitychange
  ☐ Vibración en eventos de DS §2.7
  ☐ Retomar brew desde IndexedDB
  ☐ PWA instalable en Android, funciona en modo avión

Fase 3–4
  ☐ recipe-engine y brew-adjust con tests de tabla
  ☐ Escala 1–5 + síntomas + versiones + bloqueo + revertir

Fase 5
  ☐ Supabase Auth (Google + magic link)
  ☐ Migraciones SQL + RLS en todas las tablas + test de aislamiento
  ☐ Sync idempotente por client_uuid
  ☐ Vista bag_stock con security_invoker

Fase 6
  ☐ Evals E-01 y E-02 corridos y documentados en bloom_decisions.md
  ☐ LLMProvider y SearchProvider con fallback
  ☐ Validación Zod de toda salida del LLM; afirmación sin fuente = descartada

Fase 7
  ☐ champion_refs desde seed; filas pendientes se muestran como ~
  ☐ El discurso nunca recibe campos inferidos
```

---

*Bloom Coffee — Arquitectura Técnica v2.1 · 3 nov 2026*
*Stack: Next.js · TypeScript · Tailwind v4 · Dexie · Serwist · Supabase · Claude Haiku 5.5 · Exa / Perplexity Search · Vercel*
