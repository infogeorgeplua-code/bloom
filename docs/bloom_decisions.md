# Bloom — Log de decisiones (ADR)
> v1.1 · 3 nov 2026 · Fuente de verdad cuando dos documentos se contradicen.
> Orden de precedencia: **este log → bloom_tech_architecture.md v2.1 → bloom-design-system.md v1.2 (+ Figma `7:12` en lo visual) → bloom_product.md v0.5**.
> Cada decisión: contexto · decisión · por qué · consecuencias. Si Claude Code encuentra una contradicción nueva, la agrega aquí como `PENDIENTE` y no la resuelve solo.

---

## Resumen

| # | Tema | Decisión | Estado |
|---|---|---|---|
| D-01 | Orden de construcción | Brew Mode offline primero (walking skeleton) | ✅ Cerrada |
| D-02 | Plataforma MVP | PWA para Android (Chrome). iOS fuera del MVP | ✅ Cerrada |
| D-03 | Auth y seguridad de datos | Supabase Auth + RLS. Se elimina Auth.js y Prisma | ✅ Cerrada |
| D-04 | Datos de clientes | Fuera del MVP (pasa a V2) | ✅ Cerrada |
| D-05 | Proveedor de búsqueda | Exa (principal) + Perplexity Search API (respaldo). Bing retirado | ✅ Cerrada (validar con eval E-02) |
| D-06 | LLM | Claude Haiku 5.5 por defecto, con capa de proveedor intercambiable | ✅ Cerrada (validar con eval E-01) |
| D-07 | Stack frontend | Next.js + Tailwind v4 + componentes propios del DS (sin shadcn) + Serwist | ✅ Cerrada |
| D-08 | Persistencia del brew en curso | IndexedDB (Dexie), no `sessionStorage` | ✅ Cerrada |
| D-09 | Umbrales de stock | Aviso < 50 g · crítico < 2 dosis · agotado < 1 dosis | ✅ Cerrada |
| D-10 | Pasos de preparación | Los pasos de preparación cuentan como pasos; el bloom puede ser el paso 2 | ✅ Cerrada |
| D-11 | Evaluación y aprendizaje | Escala de 5 niveles + motor de ajuste determinista que aprende de tu historial | ✅ Cerrada |
| D-12 | Campeones y trazabilidad | Seed curado a mano con fuente por fila. El LLM nunca genera campeones | ✅ Cerrada |
| D-13 | `@theme` de Tailwind | Usar `@theme inline` y nombres sin referencia circular | ✅ Cerrada |
| D-14 | Fuente visual | Figma (sección `7:12`) manda en lo visual; el DS manda en tokens y reglas | ✅ Cerrada |
| D-15 | Home y navegación | Métricas de uso en Home (Stock, Este mes, por método); nav Inicio · Stock · Hacer café · Diario · Setup | ✅ Cerrada (P-01 abierto) |
| D-16 | Anatomía del paso con tiempo | Barra `brew` (✕ a la derecha), bloque centrado, anillo sin ticks, `InfoList` | ✅ Cerrada |
| D-17 | Cierre del brew | El último paso lo terminas tú ("Terminar brew"); resumen con "Evaluar receta" | ✅ Cerrada |

---

## D-01 · Brew Mode offline primero

**Contexto.** El MVP v0.3 listaba 16 funcionalidades. Para uso personal eso retrasa semanas el primer café preparado con la app.
**Decisión.** Construir por fases (ver `bloom_tech_architecture.md` §0). Hasta la fase 4 la app funciona sin backend, sin auth y sin LLM: recetas en JSON local + IndexedDB.
**Por qué.** Brew Mode es la pantalla de mayor uso y la de mayor riesgo técnico (wake lock, timer sin deriva, haptics, offline). Validarla primero abarata los cambios. Patrón *walking skeleton* (Alistair Cockburn): la porción más delgada que funciona de punta a punta.
**Consecuencias.** Escaneo, investigación y narrativa llegan en las fases 6–7. La app es útil desde la fase 2.

## D-02 · Android primero

**Decisión.** PWA instalable desde Chrome Android. El dispositivo de prueba es el teléfono Android de George. Publicación en Play Store (Trusted Web Activity) queda para V2.
**Por qué.** Chrome Android soporta Screen Wake Lock y `navigator.vibrate`, que Brew Mode necesita. Ver [MDN · Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) y [MDN · Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API).
**Consecuencias.** Las pruebas e2e emulan un Android de gama media (Playwright, perfil Pixel). Los haptics pasan de "opcional" a parte de la experiencia. El aviso visual se mantiene igual de completo.

## D-03 · Supabase Auth + RLS

**Contexto.** v1.0 combinaba Auth.js con políticas `auth.uid() = user_id`. `auth.uid()` solo funciona con sesiones de Supabase Auth, y Prisma se conecta con un rol que ignora RLS.
**Decisión.** Supabase Auth (Google OAuth + magic link). Acceso a datos con `supabase-js` / `@supabase/ssr` usando el JWT del usuario, para que RLS aplique siempre. Esquema y migraciones con Supabase CLI (SQL). Tipos con `supabase gen types`. La `service_role` key solo existe en jobs de servidor y nunca llega al cliente.
**Consecuencias.** Se eliminan Auth.js y Prisma del stack.

## D-04 · Sin datos de clientes en el MVP

**Decisión.** Se elimina el registro de cliente (nombre + celular), la tabla y el almacenamiento local. El objetivo de taza "Para alguien más" se mantiene, pero solo traduce preferencias ("le gusta dulce") a parámetros, sin guardar a la persona.
**Por qué.** Quita datos personales de terceros del alcance y simplifica la privacidad.
**Consecuencias.** El registro de clientes pasa a V2, con consentimiento explícito como requisito.

## D-05 · Proveedor de búsqueda: Exa + Perplexity Search API

**Contexto.** Microsoft retiró todas las Bing Search APIs el 11 de agosto de 2025 ([Neowin](https://www.neowin.net/news/microsoft-pulls-plug-on-bing-search-apis/), [Firecrawl](https://firecrawl.dev/blog/bing-search-api-alternatives)).

**Datos comparados (1 nov 2026).**

| Proveedor | Precio / 1.000 búsquedas | Crédito gratis | Precisión en búsqueda factual* | Latencia media* |
|---|---|---|---|---|
| **Exa** (fast) | $7 (hasta 10 resultados) | $10/mes | **99,3 %** | 652 ms |
| **Perplexity Search API** (low) | $5 | No | 97,3 % | 1,38 s |
| Brave (LLM context) | $5 | $5/mes | 94,0 % | 601 ms |
| Tavily (advanced) | $16 (2 créditos) | 1.000 créditos/mes | 93,0 % | 4,29 s |
| Tavily (basic) | $8 | 1.000 créditos/mes | 87,7 % | 1,88 s |
| Web search nativo de Claude | $10 + tokens del contenido | No | sin dato comparable | — |

\* Benchmark independiente de búsqueda factual de OpenBenchmarks, medido el 21 oct 2026 ([openbenchmarks.com/web-search](https://openbenchmarks.com/web-search)). Precios: [beri.net](https://www.beri.net/article/tavily-vs-exa-vs-brave-vs-perplexity-search-api-agent-cost-2026), [devtoollab](https://devtoollab.com/blog/best-ai-search-apis), [Exa](https://exa.ai/blog/best-web-search-tools-for-ai-agents). Claude web search: [docs.claude.com · pricing](https://docs.claude.com/ko/docs/about-claude/pricing).

**Decisión.** Exa como principal y Perplexity Search API (resultados crudos, no Sonar) como respaldo, detrás de una interfaz `SearchProvider`. El LLM sintetiza **solo** a partir de los resultados devueltos, con URL por afirmación.
**Por qué.**
1. A tu escala el costo no decide: ~8 escaneos/mes × 4 consultas = ~32 búsquedas/mes. Eso cabe en el crédito gratis de Exa ($10 ≈ 1.400 búsquedas).
2. Lo que decide es no inventar. Exa y Perplexity lideran la precisión factual en el benchmark independiente.
3. Usar resultados crudos (y no un buscador que entrega la respuesta redactada) permite clasificar cada fuente como ✓ o ~ según su dominio, que es el corazón del sistema de confianza.

**Límite honesto.** Los benchmarks usan preguntas generales. Tostadores pequeños de Ecuador o fincas poco documentadas son *long tail*. Por eso la decisión queda sujeta al eval **E-02**.

## D-06 · LLM: Claude Haiku 5.5 por defecto

> **Conflicto de interés declarado:** esta comparación la hizo Claude. Por eso la decisión queda atada a un eval propio (E-01) y la integración es intercambiable.

**Precios de lista (por millón de tokens, entrada / salida).**

| Nivel | Anthropic | OpenAI |
|---|---|---|
| Económico | Claude Haiku 5.5 · $0,10 / $0,50 (prompts ≤ 100K) | GPT-6 Luna · $0,10 / $0,50 |
| Intermedio | Claude Sonnet 5.5 · $2 / $10 | GPT-6.1 Sol · $2 / $10 |
| Tope | Claude Opus 5.5 · $4 / $20 | GPT-6 Astra · $10 / $50 |
| Más barato del catálogo | — | GPT-5 nano · $0,05 / $0,40 |

Fuentes: [platform.claude.com · Sonnet 5.5](https://platform.claude.com/docs/zh-CN/models/sonnet-5-5/overview), [aifreeapi · Claude pricing oct 2026](https://www.aifreeapi.com/en/posts/claude-api-pricing-per-million-tokens), [UsagePricing · página de precios de OpenAI, 5 oct 2026](https://www.usagepricing.com/blueprint/activity/openai-2026-10-05-gpt-6-api-launch), [spendlint · OpenAI](https://spendlint.dev/pricing/openai-api).

**Benchmarks relevantes para Bloom (nivel económico).**

| Qué mide | Por qué importa en Bloom | Haiku 5.5 | GPT-6 Luna | Fuente |
|---|---|---|---|---|
| Visión (6 tareas: OCR, extracción, etc.) | Leer la bolsa | 77,2 % | 77,2 % | [Roboflow Vision Evals](https://playground.roboflow.com/models/anthropic/claude-haiku-5-5) |
| Tasa de alucinación (AA-Omniscience) | "No encontrado — no inventar" | ~40 % | ~77 % | [CodingFleet](https://codingfleet.com/blog/claude-haiku-5-5-vs-gpt-6-luna/), [Suprmind](https://suprmind.ai/hub/ai-hallucination-rates-and-benchmarks/) |
| Respuestas correctas (AA-Omniscience) | Cuánto sabe sin buscar | ~36 % | ~44 % | [CodingFleet](https://codingfleet.com/blog/claude-haiku-5-5-vs-gpt-6-luna/) |
| Intelligence Index (Artificial Analysis) | Capacidad general | 43 | 38 | [Emergent](https://emergent.sh/learn/claude-haiku-5-5-vs-gpt-6-luna) |
| Costo por tarea del índice (máx. esfuerzo) | Factura real | $0,21 | $0,07 | [Orcarouter](https://www.orcarouter.ai/blog/claude-haiku-5-5-vs-gpt-6-luna) |
| Mediana de tiempo de respuesta (test de 160 respuestas) | Espera en el escaneo | 6,8 s | 2,9 s | [Kingy AI](https://kingy.ai/blog/claude-haiku-5-5-vs-gpt-6-luna-benchmark/) |

Cómo leer la tasa de alucinación de AA-Omniscience: de las preguntas que el modelo no sabe, qué porcentaje responde algo incorrecto en lugar de decir "no sé". Más bajo es mejor.

**Decisión.** Claude Haiku 5.5 para todas las llamadas del MVP (visión y texto). Si la extracción de la bolsa falla la validación de esquema, un único reintento con Sonnet 5.5.
**Por qué.**
1. En visión empatan. En precio de lista empatan.
2. La diferencia que importa para un producto cuyo principio es "nunca presentar inferido como hecho" es la alucinación: Haiku 5.5 dice "no sé" con mucha más frecuencia.
3. Luna es ~3× más barato por tarea y ~2× más rápido. A tu escala eso son centavos (ver tabla de costo abajo). A 1.000 usuarios la diferencia sería real y habría que revisarla.

**Costo estimado, uso personal** (8 escaneos, 40 recetas, 30 diagnósticos, 15 discursos, 8 narrativas al mes ≈ 160K tokens de entrada + 60K de salida):

| Modelo | Precio de lista | Con la verbosidad medida (×3 en Haiku) |
|---|---|---|
| Haiku 5.5 | ~$0,05/mes | ~$0,14/mes |
| GPT-6 Luna | ~$0,05/mes | ~$0,05/mes |

Nota: Anthropic indica que desde los modelos 4.7 el tokenizador cuenta ~30 % más tokens por el mismo texto ([T-Minus AI](https://www.tminusai.com/blog/claude-sonnet-5-5-haiku-5-5-what-changed)). Ya está absorbido en el margen.

**Consecuencias.** Interfaz `LLMProvider` con dos implementaciones (Anthropic, OpenAI). Cambiar de modelo es una variable de entorno, no un refactor.

## D-07 · Stack frontend

Ver `bloom_tech_architecture.md` §1. Puntos que cambian respecto a v1.0:
- **Sin shadcn/ui.** Los componentes se construyen desde el DS. Se permiten primitivas *headless* sin estilos (Radix) para accesibilidad de diálogos y sheets.
- **Serwist** reemplaza a `next-pwa`, que dejó de mantenerse para App Router.
- **Sin librería de animación** en fases 1–2. Transiciones CSS con los tokens de motion. El anillo del timer es SVG + `requestAnimationFrame`.
- **Upstash y Cloudflare R2 salen del MVP.** Fotos en Supabase Storage. Límites de uso con contadores diarios en Postgres.

## D-08 · Persistencia del brew en curso en IndexedDB

**Decisión.** El estado del brew se guarda en IndexedDB (Dexie) cada segundo y en cada cambio de paso. Al abrir la app con un brew a medias: "Retomar brew en 1:12".
**Por qué.** `sessionStorage` se borra al cerrar la pestaña o la PWA. Justo el caso que "Retomar" debe cubrir.

## D-09 · Umbrales de stock

| Estado | Regla | Copy | Estilo |
|---|---|---|---|
| OK | ≥ 50 g | "145 g · ~9 preparaciones" | `--text-1` |
| Bajo | < 50 g | "Te queda poco: ~3 preparaciones" | `--warning` |
| Crítico | < 2 × dosis de la receta activa | "Alcanza para 1 preparación más" | `--danger` |
| Agotado | < 1 dosis | "No alcanza para otra taza. ¿Lo marcamos como terminado?" | `--danger` + acción |

Sin receta activa, la dosis por defecto es 15 g (crítico < 30 g). Las preparaciones restantes se calculan con `floor(stock / dosis)`.
**Por qué.** 50 g es tu umbral. "Crítico" se ata a la dosis real, porque 30 g no significa lo mismo con 15 g de V60 que con 18 g de espresso.

## D-10 · Los pasos de preparación son pasos

**Decisión.** Una receta tiene pasos de tipo `prep` (enjuagar filtro, tarar) y pasos con tiempo (`pour`, `wait`, `press`, `extract`). Los `prep` avanzan con un botón "Listo" de 64 px, no tienen temporizador y sí cuentan en el progreso. El tiempo total empieza con el primer paso con tiempo, después del 3-2-1. Por eso el bloom puede ser "Paso 2 de 6".
**Por qué.** Refleja cómo preparas de verdad. En los `prep` todavía no tienes las manos ocupadas, así que tocar la pantalla está bien.

## D-11 · Evaluación de 5 niveles + motor de ajuste que aprende

**Pregunta:** "¿Qué tal esta receta?"

| Nivel | Copy | Qué pasa después |
|---|---|---|
| 1 | No me gustó | Pide síntoma (recomendado, se puede saltar) → propone Vn+1 con hasta 2 cambios |
| 2 | Le falta algo | Igual que 1 |
| 3 | Quedó bien | "¿Qué le faltó?" opcional. Con síntoma → Vn+1 con 1 cambio pequeño. Sin síntoma → se mantiene |
| 4 | Muy rica | Se mantiene. Un síntoma opcional queda como "pista" |
| 5 | De campeonato ★ | Propone bloquear la receta ⭐ |

El motor es determinista y explicable (detalle en `bloom_product.md` §10). Aprende de tu historial con estas reglas: partir siempre de tu mejor versión, cambiar de 1 a 2 variables por vez, revertir si un cambio empeoró la taza y probar la otra variable candidata, y avisar cuando una receta bloqueada empieza a fallar (posible café fuera de su ventana de tueste).
**Por qué.** Aprender de 5–30 tazas por café no necesita ML: con un historial pequeño, reglas explícitas y reversibles son más confiables y puedes auditarlas. El Personal Taste Engine entre cafés distintos queda en V2, pero el modelo de datos ya guarda lo necesario.

## D-12 · Campeones: seed curado, nunca generado

**Decisión.** La tabla de referentes vive en `bloom_seed_champions.json`, con fuente por fila. Todas las filas están verificadas al 2 nov 2026 (WBC 2026 en Sprudge, WBrC 2026 en wcc.coffee, recetas WAC en worldaeropresschampionship.com / aeropress.com). Las recetas WAC distinguen `publicada_por_ganador` de `adaptacion_oficial` (la de 2019 es una adaptación; la de 2021 no se carga). Una fila nueva entra solo con fuente.
**Por qué.** La tabla de v0.3 tenía 7 errores (campeones inexistentes, años y países equivocados). En un producto cuyo diferenciador es la trazabilidad, ese dato no puede venir de un modelo.

## D-13 · `@theme inline`

**Decisión.** Los colores del DS se exponen a Tailwind con `@theme inline` (variables de runtime que cambian con el tema). Las familias tipográficas se definen directo en `@theme` con su valor final, sin `--font-sans: var(--font-sans)`, que es una referencia circular. Ver DS v1.1 §9.3.

---

## Evals pendientes (se corren al iniciar la fase 6, antes de cablear producción)

**E-01 · LLM.** 20 fotos reales de bolsas (10 buenas, 10 difíciles: poca luz, letra pequeña, bolsas metálicas) + 10 fichas para narrativa. Métricas: campos extraídos correctos, campos inventados (debe ser 0), costo y latencia por llamada. Se corre con Haiku 5.5 y GPT-6 Luna. Gana el que no invente; si empatan, el más barato.

**E-02 · Búsqueda.** 10 cafés reales (al menos 5 de tostadores ecuatorianos). Métricas: ¿encontró la web oficial del tostador?, ¿encontró la finca o el productor?, fuentes basura por consulta. Se corre con Exa y Perplexity Search.

---

## D-14 · Figma como fuente visual

**Contexto.** George rediseñó Home y el Brew Mode en Figma (archivo `bloom`, sección `7:12`) después de que Claude Code ejecutara la fase 1 con el DS v1.1.
**Decisión.** Figma manda en layout, jerarquía, composición y copy de pantalla. `bloom-design-system.md` v1.2 manda en tokens, accesibilidad, voz y comportamiento. Un valor de Figma que no existe como token no se hardcodea: se usa el token más cercano y se anota aquí como PENDIENTE.
**Consecuencias.** Claude Code lee los frames con el MCP de Figma antes de construir cada pantalla (mapa de nodos en DS §12). Lo construido en la fase 1 se actualiza a v1.2 (prompt 3 del kickoff).

## D-15 · Home orientada a uso y navegación renombrada

**Decisión.** Home muestra: hero del café habitual con ilustración del método; Stock total + "N cafés en stock"; brews del mes; uso por método (V60 y AeroPress, con % del mes). Se quitan los tiles Tueste y Última taza. Nav: **Inicio · Stock · Hacer café · Diario · Setup** ("Mis cafés" → Stock, "Lab" → Diario).
**Por qué.** Prioriza lo que George mira al abrir la app: cuánto café le queda y cómo lo está preparando.
**Consecuencias.** El modelo de datos necesita agregados mensuales por método (consulta sobre `brew_sessions`, sin tabla nueva). La señal "la app aprendió de tu última taza" necesita otro lugar (P-04).

## D-16 · Anatomía del paso con tiempo

**Decisión.** Patrón canónico = Figma 05: barra `brew` (meta a la izquierda, tiempo total centrado, ✕ a la derecha); progreso y título centrados; anillo de 300 px sin ticks, con "Vierte hasta" encima del número; tiempo restante en crema bajo el anillo; `InfoList` con Propósito / Técnica / Después; pausa centrada.
**Consecuencias.** Pausado, Fin y Salir usan la misma barra aunque en Figma aún tengan la anterior.

## D-17 · El último paso lo terminas tú

**Decisión.** Decantación, presión y extracción no avanzan solas: botón **"Terminar brew"**. El resumen se titula "Tu café está listo", muestra el tiempo total y café/agua/temperatura, y su CTA es **"Evaluar receta"**.
**Por qué.** El tiempo real de caída es el dato que más dice de la molienda; "Terminar brew" y "Evaluar receta" siguen la regla verbo + objeto.

---

## PENDIENTES (necesitan aprobación de George)

| # | Tema | Situación en Figma | Propuesta | Mientras tanto, Claude Code… |
|---|---|---|---|---|
| P-01 | Qué es **Diario** | Ítem de nav deshabilitado | Definir contenido. Si es el historial de brews y evaluaciones, el modelo de datos ya lo soporta | Lo deja deshabilitado con `aria-label` |
| P-02 | **"Blooming" vs "Bloom"** | El paso dice "Blooming"; la vista previa, "Bloom" | Un solo nombre: "Bloom" | Usa "Bloom" en ambos y deja `TODO(ds-pendiente): P-02` |
| P-03 | **Crema en la barra del tile V60** (✅ resuelto 4 nov) | V60 en crema, AeroPress en blanco | Ambas en `--text-1`: crema solo significa "ahora" | Usa `--text-1` |
| P-04 | **Señal de aprendizaje en Home** | Se quitó "Última taza / V2 lista" | Subtítulo del hero: "V60 · V4 lista · +0,5 °C" cuando hay propuesta | Implementa el subtítulo estándar y deja el estado listo para P-04 |
| P-05 | **Datos del brew en el resumen** | Se quitaron "En tiempo" y "Stock: 145 → 130 g" | Línea `caption` bajo el tiempo: "En tiempo · meta 2:40 – 3:00" (+ stock desde fase 5) | Implementa Figma; deja el slot preparado |
| P-06 | **Estado "últimos 3 s"** | El frame 06 repite Bloom con datos mezclados | Línea de tiempo restante: "Cambia en 3 s" + vibración corta | Implementa la propuesta (es comportamiento, no estética) |
| P-07 | **Propósito de la decantación en verde mono** | Quedó con el estilo de "En la ventana objetivo" | Propósito en `body-lg` blanco como en los demás pasos; "En la ventana objetivo" como línea de estado | Implementa la propuesta (consistencia de `InfoList`) |
| P-08 | **Assets raster** | Logo `bloom` e `image 4` (fila de datos del Fin) son imágenes | Exportar logo e ilustraciones como SVG; la fila de datos es `StatRow` en código | Usa SVG si está en `src/assets/`; si no, placeholder con `TODO` |

Correcciones aplicadas sin pedir aprobación, porque son errores y no decisiones de diseño:
- Eyebrow del hero a 11 px (Figma: 8,8 px, bajo el mínimo legible).
- "vertir 45 gr" → "vierte 45 g".
- Label "PRIMER VERTIDO" junto al propósito del bloom → "PROPÓSITO".
- "Agua a" (cortado) → "Temp." en el resumen.
- Stock bajo en `ListRow`: además del color, ícono de alerta.
- Estrella sola del hero con `aria-label="Receta bloqueada"`.

Claude Code agrega aquí cualquier contradicción nueva que encuentre.

### Pendientes agregados por Claude Code (3 nov 2026)

Los pendientes P-09 a P-16 venían del log v1.0 (antes numerados P-01 a P-08, hallados al escribir el SDD y en la fase 1) y se renumeran para no chocar con la tabla de arriba. P-17 a P-19 salen de comparar Figma con el DS v1.2.

| # | Tema | Qué choca | Propuesta | Mientras tanto, Claude Code… | Bloquea |
|---|---|---|---|---|---|
| P-09 | **Hex en manifest PWA** (✅ resuelto, ver abajo) | DS §9.4 pide 0 hex fuera de `tokens.css`; `theme_color`/`background_color` del manifest necesitan literales | Script que lee `--bg` de `tokens.css` al construir | No crea el manifest | Fase 2 |
| P-10 | **Fuentes del seed de campeones** | D-12 habla de fuentes oficiales; las filas WBrC 2016–2025 citan `grokipedia.com` y las WBC 2019–2025, `en.wikipedia.org` | George reemplaza las URL por wcc.coffee u otra fuente primaria | No toca el seed | Fase 7 |
| P-11 | **`stock_adjustments` y FKs** | Tech §4 dice que el ajuste manual es "un evento más", pero §3 no tiene tabla; un FK ignora RLS | Tabla `stock_adjustments`, FKs compuestas `(id, user_id)` (SDD §3.6) | Nada hasta la fase 5 | Fase 5 |
| P-12 | **Rutas medidas por Lighthouse** | DS §9.4 pide Home, Brew Mode y Perfil de café; en la fase 1 solo existe `/ds` | Medir cada ruta cuando exista | Mide `/ds` | No |
| P-13 | **Propósitos de AeroPress** (✅ resuelto, ver abajo) | Product §8–9 no define el propósito de "Vertido principal", "Espera" ni "Presiona" | George escribe los 3 textos | Los deja `null` y `InfoList` omite la fila | No |
| P-14 | **Tablas numéricas del motor de recetas** (✅ reemplazada por P-14.1, 4 nov) | Product §11 da dirección y límites, no valores por objetivo, tueste, proceso, variedad, altitud ni agua | Claude propone valores en el plan de la fase 3 y George confirma | Nada hasta la fase 3 | Fase 3 |
| P-15 | **Tema claro sin `--danger`/`--warning`** | Con los valores del tema oscuro no llegan a 4,5:1 sobre `#FAFAF7` (axe lo marca) | Agregar ambos tokens al tema claro del DS | El e2e del tema claro omite solo `color-contrast` | Antes de activar "Automático" |
| P-16 | **`eslint-plugin-jsx-a11y` y ESLint 10** | El plugin declara peer `eslint ≤ 9`; instalarlo suelto falla | Usar el que trae `eslint-config-next` (hecho) o fijar ESLint 9 | Usa el de `eslint-config-next` | No |
| P-17 | **Ícono de Diario** (✅ resuelto 4 nov) | Figma 01 usa el matraz (`flask-conical`) de Lab; DS §2.8 dice `notebook` | `notebook`: Diario ya no es Lab | Usa `notebook` | No |
| P-18 | **Colores sobre el sheet claro** | Figma 09 usa un botón "Oscuro" y un verde "success-light" que no existen como variante de `Button` ni como token | Dentro de una superficie inversa los tokens semánticos se invierten (`.inverse-scope`), así `primary` se ve oscuro y `--success` usa `green-700` | Usa `.inverse-scope` en `BrewSummarySheet` | No |
| P-20 | **Ventanas de la receta V60** | Figma 02 muestra ventanas contiguas (Bloom 0:00–0:45, Primer vertido 0:45–1:30, Segundo 1:30–2:10, Final 2:10–2:40, Decantación 2:40–3:00); product §9 da 0:00–0:40, 0:45–1:10, 1:30–1:50, 2:10–2:30 y "hasta 3:00" con huecos entre pasos | ✅ **Resuelto por George (3 nov 2026): mandan las ventanas de product §9.** Figma 02 debe actualizar los textos de `StepRow` | Seed y `/ds` usan product §9; entre ventanas se mantiene el estado "Siguiente en N s" (SDD S-04) | No (resuelto) |
| P-21 | **Tamaños de Figma sin token** | Botón xl con texto de 18 px; gramos de `ListRow` en mono 14 px; barras con radio 2 y 4 px; orb de pausa de 180 px (DS: 160); columna de `InfoList` de 52 px, donde "PROPÓSITO" no cabe (se usa 72 px) | Agregar tokens o ajustar Figma a `button` 16, `body` 15 y `radius-xs/2` | Usa el token más cercano con `TODO(ds-pendiente): P-21` | No |
| P-22 | **`StepTimeline` sin barra ni número** | DS §3.20 pide número de paso y barra vertical de 1,5 px; Figma 02 (`StepRow`) usa filas de 56 px con divisor, sin barra ni número | Actualizar DS §3.20 a la anatomía de Figma | Sigue Figma (D-14) | No |
| P-23 | **Serwist con Turbopack** (✅ resuelto, ver abajo) | Tech §1 pide `@serwist/next`, que según su documentación es solo para webpack; Next 16.4 compila con Turbopack por defecto (visto en la fase 1) | Usar `@serwist/turbopack` 9.5.13 (+ `esbuild` 0.28.2 como dependencia de desarrollo), que sirve el service worker desde un route handler. Alternativa: mantener `@serwist/next` y compilar con `next build --webpack` | Nada hasta la aprobación | Fase 2 |
| P-24 | **PWA en el teléfono necesita HTTPS** (✅ resuelto, ver abajo) | El service worker y la instalación solo funcionan en contexto seguro (HTTPS o `localhost`); `http://192.168.1.104` no sirve para la prueba de 7 días | Desplegar en Vercel (Hobby) con la URL protegida; alternativa: depurar por USB con `chrome://inspect` (reenvío de puerto a `localhost`) | Nada hasta la aprobación | Cierre de la fase 2 |
| P-25 | **Inventario antes del backend** (✅ resuelto, ver abajo) | Figma 01 muestra Stock y gramos en "Cafés recientes"; tech §0 pone bolsas y stock en la fase 5 | Inventario local en IndexedDB desde la fase 3; la fase 5 lo sincroniza | Nada hasta la aprobación | Fase 3 |
| P-26 | **R5 mueve hasta 2 variables; P-14.1 pide una** | Product §10.3 R5: nivel 1–2 con síntomas → hasta 2 cambios. P-14.1 principio 1: un cambio por taza, porque con dos R6 no sabe cuál falló (lo escribe para la primera taza, pero el argumento vale igual para R5) | (a) dejar R5 como está; (b) **recomendado:** R5 también con 1 cambio (el del primer síntoma) y el segundo síntoma queda como pista | Implementa product §10.3 (2 cambios); pasar a (b) es una constante | Fase 4 |
| P-27 | **Tabla de diagnóstico §10.2 en espresso y AeroPress** | La tabla está escrita para filtrado: el espresso no tiene bloom ni vertidos y "±10 g de agua" sobre 36 g es un 28 %; el seed de AeroPress ya agita en sus dos vertidos; "agua ≥ 2 × dosis" bloquea cualquier shot más corto | Bloom y agitación no aplican en espresso (pasa a la candidata 2); agitación solo en V60; en espresso el paso de agua = 10 % de la bebida en taza (medio paso 5 %), igual que el paso relativo de P-14.1, y la bebida queda entre 1:1,5 y 1:3 | Implementa la propuesta (`adjust-tables.ts`) | Fase 4 |
| P-28 | **"Intensidad" como objetivo visible** | P-14.1 agrega el objetivo técnico `intensidad` (product §11 "Más intensidad") y deja a George decidir si se muestra | Mostrarlo en "¿Cómo quieres la taza?" como "Más intensidad" | Solo se alcanza con "Para alguien más · Intenso" | Fase 4 |
| P-19 | **Sección de componentes de Figma desactualizada** | `6:2` todavía muestra "Mis cafés", "Lab · PRONTO" y `ListRow` con `StockMeter` | Actualizar `6:2` a v1.2 | Sigue el DS v1.2 y el frame 01 | No |

### Resueltos por George (3 nov 2026, arranque de la fase 2)

| # | Resolución |
|---|---|
| P-09 | Los colores del manifest salen de `tokens.css` (el manifest lee `--bg` al compilar). Si hace falta un color nuevo, se suma a `tokens.css` dentro de la misma gama; nunca un literal suelto. |
| P-13 | Textos de propósito de AeroPress escritos por Claude a partir de guías públicas ([CoffeeGeek · inverted](https://coffeegeek.com/guides/aeropress-inverted-brew-method-how-to/), [Honest Coffee Guide](https://honestcoffeeguide.com/brew-recipes/basic-inverted-aeropress-recipe/), [The Barn](https://thebarn.de/blogs/the-barn-blog/aeropress)). Quedan en `recipes.seed.json`; George los valida en el uso real. |
| P-23 | `@serwist/turbopack` 9.5.13 + `esbuild` 0.28.2. Sin `--webpack`: el build queda en el bundler por defecto de Next 16 para escalar sin fricción. |
| P-24 | La app se publica en Vercel; George compra un dominio. Mientras tanto se usa la URL de Vercel. |
| P-08 (parcial) | El ícono de la app y el wordmark del Home salen del logo PNG de George (`logo bloom`), recortados y con fondo transparente. Sigue pendiente el SVG. |
| Fase 2 | "Tu café habitual": "Prepara tu primer café" hasta el primer brew; luego, la última receta usada. Sonido fuera de la fase 2. Sin Sentry. |

### Resueltos por George (4 nov 2026, arranque de la fase 3)

| # | Resolución |
|---|---|
| P-03 | La barra del tile de método **no usa crema**. Usa otro color del DS: el método más usado en `--text-1`, el segundo en `--text-2`. Crema sigue reservado a "ahora" (DS §2.1). |
| P-17 | Diario usa su propio ícono (`notebook`, DS §2.8), no el matraz de Lab. |
| P-25 | **Inventario local adelantado a la fase 3.** Bolsas, gramos y alertas (D-09) viven en IndexedDB desde la fase 3: el tile Stock, los gramos de "Cafés recientes" y el descuento por brew funcionan sin backend. En la fase 5 el mismo modelo se sube a Supabase (`bags`, `stock_adjustments`, vista `bag_stock`) con la sync idempotente; no cambia la lógica. |
| Fase 3 | Arranca en paralelo a los 7 días de uso de la fase 2 (que se cierra con su checklist). Las pantallas sin frame en Figma ("Tengo un café nuevo", Stock, perfil de café, Hacer café, Setup) las diseña Claude con componentes y patrones del DS. |
| Home | El contenido de Figma 01 es demo: "Tu café habitual" lo elige el sistema (regla en SDD §5.9), nunca un nombre fijo. |
| Molino | George usa un **LEBURRY** eléctrico de muelas cónicas, **38 posiciones** (1 = más fina). Rangos del fabricante (descripción del producto): espresso 1–5, moka 5–10, pour-over 10–20, prensa francesa 20–28, cold brew 28–38. AeroPress no aparece: se infiere entre moka y pour-over (8–14, `inferido`). [Ficha en Amazon](https://www.amazon.com/dp/B0D6QY9KFC) · [descripción con rangos](https://pacifiko.com/compras-en-linea/leburry-burr-coffee-grinder-portable-espresso-grinder-with-stainless-steel-conical-mill-for-travel-camping-cordless-rechargeable-electric-coffee-bean-grinders-with-38-adjustable-grind-settings-color-black&pid=ZDFiOGNhYm). |
| P-08 | El logo SVG se pide al final del proyecto; mientras tanto sigue el PNG recortado. |

### Resueltos por George (4–5 nov 2026, arranque de la fase 4)

| # | Resolución |
|---|---|
| P-14 | **Reemplazada por P-14.1**, entregada por George (`recipe-mapping.P-14.1.ts`, en `docs/Update 3-11/`, carpeta local fuera del repo) y copiada tal cual a `src/features/recipes/engine-tables.ts` (solo se quitó `PROCESS_TEMP_ADJUST`, que el archivo pedía quitar en fase 4). Resumen abajo. |
| Fase 4 | Aprobada ("Vamos con la siguiente fase", 4 nov). Corre mientras sigue la prueba de 7 días de la fase 2 y la prueba en el teléfono de la fase 3. |

### P-14.1 · Tablas del motor de recetas (vigente)

Principios: un objetivo mueve **una** variable en la primera taza; cada regla declara su evidencia (`mecanica` · `medida` · `heuristica` · `hipotesis`); el ratio se mueve en % relativo; la altitud de **cultivo** no mueve la temperatura y la de **preparación** pone un techo físico (ebullición local) en métodos con hervidor abierto; ningún texto promete un sabor.

| Objetivo | V60 | AeroPress | Espresso |
|---|---|---|---|
| Equilibrado | base + tueste | base + tueste | base + tueste |
| Dulce | agua +6 % (medida) | agua +6 % (heurística) | sin cambio |
| Brillante | −1 °C (hipótesis, apagada) | −1 °C (hipótesis, apagada) | −1 °C (hipótesis, apagada) |
| Con cuerpo | agua −6 % (hipótesis, apagada) | agua −6 % (hipótesis, apagada) | bebida −10 % (heurística) |
| Más claridad | agua +6 % (heurística) | agua +6 % (heurística) | bebida +10 % (hipótesis, apagada) |
| Intensidad (vía "Intenso") | agua −6 % (mecánica) | agua −6 % (mecánica) | bebida −10 % (mecánica) |

Preferencia → objetivo: dulce → dulce · intenso → intensidad · floral → claridad · suave → dulce · sorpréndeme → equilibrado. Tueste → °C (heurística): claro +1 · medio 0 · medio-oscuro −1 · oscuro −2. Límites por método: V60 85–96 · AeroPress 80–96 · espresso 88–96 °C; techo por ebullición local en V60 y AeroPress (Quito ~90,5 °C). Ventana de tueste orientativa (nunca bloquea): filtrado 7–21 d, espresso 14–30 d. Cada V1 guarda `engineVersion: "P-14.1"`; una V1 de P-14 sin evaluar se regenera.

### P-14 · Propuesta de tablas del motor de recetas (histórico · reemplazada por P-14.1)

Valores iniciales escritos por Claude a partir de la dirección y los límites de product §11. Viven en un solo archivo (`src/features/recipes/engine-tables.ts`), cada fila tiene test y cambiar un número no toca la lógica. Si George no está de acuerdo con alguno, se cambia ahí.

**Objetivo de la taza** (máximo 2 variables por objetivo, product §11):

| Objetivo | Variable 1 | Variable 2 |
|---|---|---|
| Equilibrado | — | — |
| Dulce | +1 °C | molienda 1 paso más fina |
| Brillante | −1 °C | bloom 5 s más corto (V60, AeroPress); espresso solo temperatura |
| Con cuerpo | molienda 1 paso más gruesa (product §11, literal) | técnica: más agitación en los vertidos |
| Claridad máxima | ratio +1 (espresso +0,5) | técnica: vertidos lentos y al centro |
| Para alguien más | preferencia → objetivo: dulce→Dulce · intenso→Con cuerpo · floral→Brillante · suave→Equilibrado · sorpréndeme→Dulce (product §11: "dulzor prioritario") | |

**Ajustes por café** (se suman al objetivo; temperatura final acotada a 80–100 °C y redondeada a 0,5):

| Tabla | Valores |
|---|---|
| Tueste → °C | claro +1 · medio 0 · medio-oscuro −1 · oscuro −2 |
| Proceso → °C | lavado 0 · honey 0 · natural −1 · anaeróbico −1 · otro 0 |
| Altitud del cultivo → °C | ≥ 1800 m +1 · 1200–1799 m 0 · < 1200 m −1 |
| Días desde el tueste | filtrado: < 7 reposo · 7–21 ideal · > 21 pasado; espresso: < 14 · 14–30 · > 30. Solo aviso, no mueve números |
| Altitud donde preparas | el agua hierve a ≈ 100 − altitud/300 °C: la temperatura se limita a 1 °C bajo ese punto (física, no gusto) |
| Variedad · perfil de agua | **sin efecto en V1**: no hay datos confiables para una tabla; se guardan para fases futuras |

**Molienda:** con molino configurado, clicks = punto de partida del método (Setup) ± pasos del objetivo; en el LEBURRY 1 paso = 2 posiciones y el punto de partida es V60 15 · AeroPress 11 · espresso 3, acotado a 1–38. Sin molino, solo el descriptor ("media-fina, un poco más fina").
