# Bloom — Design System v1.2
> Nombre interno: **"Instrumento"** · PWA para Android · Dark-first · Español
> Complementa a `bloom_product.md` v0.5 y `bloom_tech_architecture.md` v2.1. Si hay contradicción, manda `bloom_decisions.md`.
> **Fuente visual:** archivo Figma `bloom` → sección **"Bloom · Home + Brew Mode"** (`node-id=7-12`), diseñada por George. Cambios vs v1.1 al final (§11).

---

## 0. CÓMO USAR ESTE DOCUMENTO (para el agente que implementa)

0. **Dos fuentes, un reparto claro (D-14).**
   - **Figma manda en lo visual:** layout, jerarquía, composición y copy de cada pantalla. Lee los frames con el MCP de Figma (`get_design_context` sobre los node-id de §12) antes de construir una pantalla.
   - **Este documento manda en tokens y reglas:** colores, tipografía, espaciado, accesibilidad, voz, comportamiento.
   - Si Figma usa un valor que no existe como token (ej. un tamaño de texto suelto), **no lo hardcodees**: usa el token más cercano de §2 y anótalo como `PENDIENTE` en `docs/bloom_decisions.md`.
   - Los ítems marcados **⏳ PENDIENTE** en este documento están propuestos pero no aprobados: implementa la versión de Figma y deja `TODO(ds-pendiente):` con el código del pendiente.
1. **Jerarquía de decisiones:** Tokens → Componentes → Patrones → Pantallas. Si algo no está definido en un nivel, se resuelve con el nivel anterior. Nunca al revés.
2. **Prohibido hardcodear** colores, tamaños de fuente, radios, espacios o duraciones. Todo sale de los tokens de la sección 2 (implementados como CSS custom properties en la sección 9).
3. **No inventar componentes.** Si una pantalla necesita algo que no existe aquí, se compone con los existentes. Si es imposible, se deja un `TODO(ds):` en el código con la justificación, no se improvisa un estilo.
4. **Un solo acento.** El color `crema` solo aparece donde la sección 2.1 lo permite. Si dudas, usa neutros.
5. **Números siempre en mono tabular.** Gramos, tiempos, temperaturas, ratios, stock.
6. **Copy en español, tuteo, sin emojis en la UI.** Los emojis del documento de producto se traducen a iconos (sección 2.8).
7. **Dispositivo de referencia:** Android, Chrome, viewport de 360–412 px de ancho.

---

## 1. ADN VISUAL

### 1.1 Qué tomamos de las referencias

| Referencia | Qué extraemos | Cómo lo usa Bloom |
|---|---|---|
| Detalle de producto (Yirga Santos) | Banda clara detrás del producto, título grande regular, grilla 2×2 de atributos con label grande + valor gris | Perfil de café: banda `surface-photo` con la bolsa, atributos en grilla 2×2 |
| Marketplace | Segmented control blanco sobre gris, chips de categoría, cards con CTA pill blanca | Selector de método, filtros de biblioteca |
| "Your Coffee" (schedule) | Títulos display enormes, sliders de track grueso con escala debajo, toggles | Ajustes de receta (ratio, temperatura, molienda), Setup |
| Brew method (Origami) | Arco/dial grande como selector, lista de parámetros con número a la izquierda | Selector de método y vista de receta |
| Main (máquina) | Dial central con power, tiles 2×2 con label arriba y dato abajo | Home: estado del día en tiles |
| Success sheet | Bottom sheet **invertido** (claro sobre app oscura) para cerrar un ciclo | Fin del brew y receta bloqueada ⭐ |
| Weather (Tbilisi) | Círculos sólidos como héroe de dato, píldoras de dato, tiles con dibujo lineal fino, labels en mono mayúsculas | Lenguaje de "instrumento": orbes, gauges, escalas, tipografía mono |

### 1.2 Qué corregimos de las referencias

- **Contraste de texto secundario.** En varias referencias el gris de descripción se ve por debajo de 4.5:1. Bloom sube el gris terciario a `#8C8C88` (≥ 4.88:1 sobre superficie). Fuente: [WCAG 2.2 · 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum).
- **Tiles grises con texto blanco** de la pantalla "Main" quedan lavados. Bloom usa superficies más oscuras (`#1F1F1F`) y reserva el gris claro solo para orbes con texto oscuro.
- **Erratas** ("SHCEDULE", "Ground Goffee"). Todo copy pasa por la sección 7.
- **Targets pequeños** (labels del slider, íconos del nav). Bloom fija mínimos de 48 px y 64 px en Brew Mode (sección 2.9).

### 1.3 Principios visuales

1. **La luz es la jerarquía.** El sistema es monocromo. Lo importante es más claro, no más colorido. Un solo acento cálido (`crema`) marca "esto está pasando ahora".
2. **El número es el héroe.** En Bloom el dato central casi siempre es un número (45 g, 0:34, 92 °C). Se diseña alrededor de él.
3. **Instrumento, no tienda.** Estética de herramienta de precisión: diales, escalas, ticks, líneas de 1.5 px. Nada de ilustraciones decorativas.
4. **Legible a un brazo de distancia.** El teléfono está apoyado junto al V60, a ~50–70 cm. Brew Mode se diseña para esa distancia, con manos mojadas.
5. **La confianza se ve.** Todo dato del café muestra su estado (observado / verificado / inferido). Es parte del lenguaje visual, no una nota al pie.

---

## 2. TOKENS

### 2.1 Color

#### Primitivos — neutros "Carbón" (cálidos, ligeramente arena)

| Token | Hex | Uso principal |
|---|---|---|
| `ink-950` | `#0E0E0F` | Fondo de la app |
| `ink-900` | `#161617` | Superficie 1 (secciones) |
| `ink-850` | `#1F1F1F` | Superficie 2 (tiles, cards, inputs) |
| `ink-800` | `#2A2A2A` | Superficie 3 (pressed, elevado) |
| `ink-700` | `#363636` | Bordes, tracks de slider, divisores |
| `ink-600` | `#4A4A47` | Bordes fuertes, outline de botón secundario |
| `ink-500` | `#6B6B68` | Texto deshabilitado (no usar para info) |
| `ink-400` | `#8C8C88` | Texto terciario, escalas, metadatos |
| `ink-300` | `#B9B9B5` | Texto secundario |
| `ink-200` | `#CFCFCA` | Banda de foto de producto, pressed de botón primario |
| `ink-100` | `#E7E7E2` | Relleno de orbes |
| `ink-50`  | `#F4F4F1` | Texto primario, botón primario |

#### Primitivos — acento y feedback

| Token | Hex | Uso |
|---|---|---|
| `crema-400` | `#E8B676` | **Acento único.** Progreso activo del brew, foco, paso actual |
| `crema-300` | `#F0CB98` | Hover/pressed del acento |
| `crema-700` | `#9A6A2C` | Acento en tema claro (solo texto ≥ 18 px bold o fills) |
| `green-300` | `#8FD1AE` | Éxito, dato verificado, stock OK |
| `amber-400` | `#F5A524` | Advertencia, stock bajo, dato inferido |
| `red-400`   | `#FF7A68` | Error, stock crítico |
| `green-700` | `#2E7D5B` | Éxito en tema claro |

#### Dónde puede aparecer `crema` (lista cerrada)

- Anillo/barra de progreso del paso activo en Brew Mode.
- Indicador del paso actual (dot activo).
- **Tiempo restante del paso activo** ("31 s restantes", bajo el anillo).
- Número de la cuenta regresiva 3-2-1.
- Anillo de foco (`:focus-visible`).
- Badge de receta bloqueada ⭐.
- Ícono `star` del nivel 5 ("De campeonato") en `RatingScale`.
- Nunca en botones primarios, nunca en fondos grandes, nunca decorativo.
- ⏳ **PENDIENTE P-03:** en Figma, la barra del tile "V60" usa crema y la de "AeroPress" usa `text-1`. Propuesta: ambas en `--text-1`, porque crema significa "está pasando ahora" y dos barras que miden lo mismo no deben distinguirse por color.

#### Semánticos — tema oscuro (default)

| Token semántico | Valor | Notas |
|---|---|---|
| `--bg` | `ink-950` | |
| `--surface-1` | `ink-900` | |
| `--surface-2` | `ink-850` | Tiles, cards, chips default |
| `--surface-3` | `ink-800` | Estado pressed de superficies |
| `--surface-photo` | `ink-200` | Banda detrás de la foto de bolsa |
| `--surface-inverse` | `ink-50` | Bottom sheet de cierre, botón primario, chip seleccionado |
| `--orb` | `ink-100` | Orbes de dato |
| `--text-1` | `ink-50` | Primario |
| `--text-2` | `ink-300` | Secundario |
| `--text-3` | `ink-400` | Terciario / escalas |
| `--text-disabled` | `ink-500` | |
| `--text-on-inverse` | `ink-950` | Texto sobre superficies claras |
| `--text-on-inverse-2` | `ink-600` | Secundario sobre superficies claras |
| `--border` | `ink-700` | Hairline 1 px |
| `--border-strong` | `ink-600` | Outline de botón secundario |
| `--track` | `ink-700` | Tracks de slider/progreso |
| `--accent` | `crema-400` | |
| `--accent-pressed` | `crema-300` | |
| `--success` | `green-300` | |
| `--warning` | `amber-400` | |
| `--danger` | `red-400` | |
| `--scrim` | `rgba(0,0,0,0.64)` | Detrás de sheets/modales |

#### Semánticos — tema claro "Papel" (opcional, para uso diurno)

| Token | Valor |
|---|---|
| `--bg` | `#FAFAF7` |
| `--surface-1` | `#F2F2EE` |
| `--surface-2` | `#E9E9E4` |
| `--surface-3` | `#DEDED8` |
| `--surface-inverse` | `ink-950` |
| `--text-1` | `ink-950` |
| `--text-2` | `#5C5C58` |
| `--text-3` | `#6B6B68` |
| `--text-on-inverse` | `ink-50` |
| `--border` | `#D6D6D0` |
| `--accent` | `crema-700` |
| `--success` | `green-700` |

> Tema default: oscuro. El claro se activa por `prefers-color-scheme: light` **solo** si el usuario elige "Automático" en Setup. Brew Mode siempre en oscuro (menos reflejo, menos batería en OLED).

#### Contrastes verificados (WCAG 2.2, ratio calculado)

| Texto | Fondo | Ratio | Nivel |
|---|---|---|---|
| `ink-50` | `ink-950` | 17.51:1 | AAA |
| `ink-50` | `ink-850` | 14.96:1 | AAA |
| `ink-50` | `ink-800` | 13.03:1 | AAA |
| `ink-300` | `ink-950` | 9.80:1 | AAA |
| `ink-400` | `ink-950` | 5.72:1 | AA |
| `ink-400` | `ink-850` | 4.88:1 | AA |
| `ink-500` | `ink-950` | 3.61:1 | Solo deshabilitado / texto ≥ 24 px |
| `ink-950` | `ink-50` | 17.51:1 | AAA |
| `ink-950` | `ink-200` | 12.34:1 | AAA |
| `ink-600` | `ink-200` | 5.69:1 | AA |
| `crema-400` | `ink-950` | 10.46:1 | AAA |
| `crema-400` | `ink-850` | 8.94:1 | AAA |
| `green-300` | `ink-950` | 10.93:1 | AAA |
| `amber-400` | `ink-950` | 9.45:1 | AAA |
| `red-400` | `ink-950` | 7.57:1 | AAA |
| `ink-950` | `#FAFAF7` | 18.45:1 | AAA |
| `#5C5C58` | `#FAFAF7` | 6.42:1 | AA |
| `crema-700` | `#FAFAF7` | 4.49:1 | Solo texto grande (≥ 18 px bold) |
| `green-700` | `#FAFAF7` | 4.78:1 | AA |

---

### 2.2 Tipografía

| Rol | Familia | Licencia | Por qué |
|---|---|---|---|
| UI / texto | **Geist** | SIL OFL 1.1 | Grotesca neutra, alta legibilidad en tamaños chicos, carácter técnico sin ser fría. Disponible en Google Fonts. |
| Números / labels | **Geist Mono** | SIL OFL 1.1 | Hermana de Geist: la mezcla no choca. Da el tono "instrumento" de la referencia del clima. |
| Fallback | `Inter`, `system-ui`, `Roboto` | | En Android el fallback real es Roboto |
| Fallback mono | `JetBrains Mono`, `ui-monospace`, `monospace` | | |

Carga: autoalojadas con `next/font` (funcionan offline dentro del precache de la PWA). Pesos 300/400/500/600 para Geist y 300/400/500 para Geist Mono. Precargar `Geist Mono 300` porque es la del timer.

#### Escala

| Token | Familia | Peso | Tamaño / Line-height | Tracking | Uso |
|---|---|---|---|---|---|
| `num-countdown` | Mono | 300 | 160 / 160 | -0.04em | Cuenta regresiva 3-2-1 (color crema) |
| `num-hero` | Mono | 300 | 112 / 100 | -0.04em | Meta de gramos en el anillo del Brew Mode |
| `num-time` | Mono | 300 | 80 / 80 | -0.04em | Tiempo total en el anillo (pasos sin meta de gramos) |
| `num-xl` | Mono | 300 | 64 / 64 | -0.03em | Tiempo total en el resumen del brew |
| `num-window` | Mono | 300 | 48 / 56 | -0.03em | Ventana objetivo en la vista previa ("2:40 – 3:00") y timer pausado |
| `num-lg` | Mono | 300 | 40 / 44 | -0.02em | Valor en tiles |
| `num-md` | Mono | 400 | 24 / 28 | -0.01em | Parámetros de receta, tiempo total en la barra superior |
| `num-sm` | Mono | 400 | 22 / 28 | -0.01em | Parámetros en el hero de Home, metas en `StepRow` |
| `display` | Geist | 400 | 40 / 44 | -0.02em | Título de pantalla ("¿Qué preparamos?") |
| `title-lg` | Geist | 500 | 28 / 32 | -0.015em | Nombre del paso |
| `title-md` | Geist | 500 | 24 / 28 | -0.01em | Nombre del café en el hero de Home |
| `title` | Geist | 500 | 22 / 28 | -0.01em | Encabezado de sección, título de sheet, tiempo restante del paso |
| `body-lg` | Geist | 400 | 17 / 24 | 0 | Texto de propósito sensorial |
| `body` | Geist | 400 | 15 / 22 | 0 | Texto general |
| `caption` | Geist | 400 | 13 / 18 | 0 | Notas, ayudas, escalas |
| `label` | Mono | 500 | 11 / 14 | 0.08em, MAYÚSCULAS | Labels de tiles, secciones, badges |
| `button` | Geist | 600 | 16 / 20 | 0.01em | Botones |
| `nav` | Geist | 500 | 11 / 14 | 0.02em | Labels del bottom nav |

#### Reglas tipográficas

- **Todo número usa `font-variant-numeric: tabular-nums`.** En un timer que corre, los dígitos proporcionales "bailan". Fuente: [MDN · font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric).
- Unidades en `caption` o `label` junto al número, separadas por espacio fino: `45 g`, `92 °C`, `1:16`.
- Máximo 3 tamaños por pantalla (sin contar números).
- **Tamaño mínimo de texto: 11 px** (`label`). En Figma, el eyebrow "TU CAFÉ HABITUAL" quedó en 8,8 px: se implementa en `label` 11 px (corrección de accesibilidad, no de estética).
- Peso 300 solo en mono ≥ 40 px. Debajo de eso, 400+.
- Respeta el zoom del sistema: tamaños en `rem` (base 16 px). Brew Mode no reduce la meta de gramos por debajo de 72 px aunque la pantalla sea pequeña (usar `clamp()`).

---

### 2.3 Espaciado (base 4)

| Token | px | Clase Tailwind equivalente | Uso típico |
|---|---|---|---|
| `space-0` | 0 | `*-0` | |
| `space-1` | 2 | `*-0.5` | Ajustes ópticos |
| `space-2` | 4 | `*-1` | Ícono ↔ texto pequeño |
| `space-3` | 8 | `*-2` | Gap entre chips, entre label y valor |
| `space-4` | 12 | `*-3` | Gap de grilla de tiles |
| `space-5` | 16 | `*-4` | Padding interno de tiles |
| `space-6` | 20 | `*-5` | **Margen lateral de pantalla** |
| `space-7` | 24 | `*-6` | Separación entre bloques relacionados |
| `space-8` | 32 | `*-8` | Separación entre secciones |
| `space-9` | 40 | `*-10` | Aire alrededor del título display |
| `space-10` | 48 | `*-12` | Separación mayor |
| `space-11` | 64 | `*-16` | Aire del dato héroe en Brew Mode |

Tailwind v4 usa una base de 4 px (`--spacing: 0.25rem`), igual que el DS. Solo se permiten los valores de esta tabla.

### 2.4 Radios

| Token | px | Clase Tailwind | Uso |
|---|---|---|---|
| `radius-xs` | 8 | `rounded-thumb` | Thumbnails pequeños, badges rectangulares |
| `radius-sm` | 12 | `rounded-chip` | Chips, inputs compactos |
| `radius-md` | 16 | `rounded-field` | Inputs, thumbnails de bolsa |
| `radius-lg` | 24 | `rounded-tile` | **Tiles y cards** |
| `radius-xl` | 32 | `rounded-sheet` | Esquinas superiores de bottom sheet |
| `radius-full` | 9999 | `rounded-pill` | Botones, pills, segmented, orbes, stepper |

Regla: radios anidados → `radio interno = radio externo − padding`. Un tile de 24 con padding 16 contiene elementos de radio 8.

### 2.5 Bordes, líneas y elevación

- `stroke-hairline`: 1 px `--border`. Divisores, outline de tiles en tema claro.
- `stroke-instrument`: 1.5 px `--text-2`. Diales, gauges, ticks, íconos.
- `stroke-progress`: 4 px `--accent`. Progreso activo.
- **Sin sombras en tema oscuro.** La elevación se expresa con luminancia: `bg` < `surface-1` < `surface-2` < `surface-3` < `surface-inverse`. (Mismo criterio que [Material 3 · Elevation](https://m3.material.io/styles/elevation/overview), que usa tono en lugar de sombra en superficies oscuras.)
- Bottom sheet: `--scrim` detrás + sin sombra.

### 2.6 Motion

| Token | Valor | Uso |
|---|---|---|
| `dur-instant` | 80 ms | Feedback de press |
| `dur-fast` | 160 ms | Chips, toggles, segmented |
| `dur-base` | 240 ms | Cambios de contenido, tabs |
| `dur-slow` | 360 ms | Transición entre pasos del brew, sheets |
| `dur-countdown` | 1000 ms | Cada número del 3-2-1 |
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | General |
| `ease-enter` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | Entrada de sheets/pasos |
| `ease-exit` | `cubic-bezier(0.3, 0, 0.8, 0.15)` | Salidas |
| `ease-linear` | `linear` | **Solo progreso de tiempo real** (timer) |

- Press: `transform: scale(0.97)` en `dur-instant`.
- Cambio de paso en Brew Mode: el paso saliente hace fade + `translateY(-12px)`, el entrante fade + `translateY(12px → 0)`, `dur-slow`, `ease-enter`.
- `prefers-reduced-motion: reduce` → solo opacidad, sin desplazamientos; el anillo de progreso sigue avanzando (es información, no decoración). Fuente: [MDN · prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion).

### 2.7 Haptics y sonido (Brew Mode)

| Evento | Haptic (`navigator.vibrate`) | Sonido (opcional, off por default) |
|---|---|---|
| Faltan 3 s para el siguiente paso | `[40]` | tick suave |
| Cambio de paso | `[60, 80, 60]` | chime corto |
| Fin del brew | `[120, 80, 120]` | chime doble |
| Pausa | `[30]` | — |
| "Listo" en un paso de preparación | `[20]` | — |

> El MVP corre en Chrome Android, que soporta `navigator.vibrate` ([MDN · Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)). La vibración se puede apagar en Setup. Aun así, el aviso visual (anillo + número) debe bastar por sí solo: el usuario puede tener el teléfono en silencio o la vibración desactivada a nivel de sistema.

### 2.8 Iconografía

- Set: **Lucide** (ISC), trazo 1.5 px, caps redondeados, 24 px default (20 en chips, 28 en Brew Mode).
- Color: hereda `currentColor`.
- Traducción de emojis del documento de producto a iconos:

| Producto (emoji) | Concepto | Ícono Lucide |
|---|---|---|
| — | Paso de preparación | `list-checks` |
| 💧 | Bloom / pre-infusión | `droplet` |
| 🍋 | Primer vertido (acidez) | `citrus` |
| 🍫 | Segundo vertido (cuerpo) | `bean` |
| ✨ | Vertido final (limpieza) | `sparkles` |
| ⏳ | Decantación / espera | `hourglass` |
| ⚡ | Extracción espresso | `gauge` |
| ⭐ | Receta bloqueada / "De campeonato" | `star` (relleno `crema-400`) |
| ⚠️ / 🔴 | Stock bajo / crítico | `triangle-alert` / `circle-alert` |
| ▶ | Hacer café | `play` dentro de orbe |
| ⏸ | Pausar | `pause` |
| ⏱ | Tiempo total (barra superior del brew) | `timer` |
| ✓ | "Tu café está listo" | `check` |
| — | Resumen: café / agua / temperatura | `bean` / `droplet` / `thermometer` |
| 🏠 ☕ 📓 ⚙️ | Nav: Inicio · Stock · Diario · Setup | `house`, `coffee`, `notebook` (⏳ P-01), `settings-2` |

**Marca e ilustraciones (no son íconos):**
- **Logotipo `bloom`** (wordmark + símbolo) en la barra superior de Home. Va como **SVG** en `src/assets/brand/bloom-wordmark.svg`. En Figma hoy es una imagen raster: hay que exportarlo como SVG (⏳ P-08).
- **Ilustración de método** (`MethodIllustration`, §3.27): dibujo lineal del dripper. Hoy existe la del V60 en Figma; faltan AeroPress y Espresso.

### 2.9 Targets táctiles

| Contexto | Mínimo | Fuente |
|---|---|---|
| General | 48 × 48 px | [Material 3 · Accessibility](https://m3.material.io/foundations/designing/structure) (48 dp) |
| Brew Mode | 64 × 64 px | Manos mojadas + distancia; ley de Fitts: objetivos más grandes = adquisición más rápida |
| Separación entre targets | 8 px | [WCAG 2.2 · 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) |

### 2.10 Layout

- Mobile: 4 columnas, gutter 12 px, margen 20 px.
- Ancho máximo de la app en desktop/tablet: 480 px, centrada, fondo `--bg` extendido.
- Safe areas: `env(safe-area-inset-*)` en top bar, bottom nav y CTA fijos. En Android con navegación por gestos, el inset inferior no es cero.
- Altura del bottom nav: 64 px + `safe-area-inset-bottom`.
- CTA fijo inferior: 56 px de alto, margen 20 px, separado 12 px del nav.

---

## 3. COMPONENTES

> Formato: anatomía · variantes · estados · tokens · accesibilidad. Nombres en PascalCase para el código.

### 3.1 `Button`

| Variante | Fondo | Texto | Borde | Uso |
|---|---|---|---|---|
| `primary` | `--surface-inverse` | `--text-on-inverse` | — | Una por pantalla. "Preparar ahora", "Empezar", "Listo" |
| `secondary` | transparente | `--text-1` | 1 px `--border-strong` | Acción alternativa. "Ajustar sabor" |
| `tertiary` | transparente | `--text-2` | — | "Saltar", "Ver ficha" |
| `danger` | transparente | `--danger` | 1 px `--danger` | "Marcar como terminado" |

- Tamaños: `lg` 56 px (CTA), `md` 48 px, `xl` 64 px (Brew Mode).
- Forma: `radius-full`. Padding horizontal 24 px. Tipografía `button`.
- Con ícono: ícono 20 px a la izquierda, gap 8. Botón con dato: el dato va en Geist Mono 500.
- Estados: `pressed` (primary → `ink-200`; secondary → `--surface-3`), `disabled` (fondo `ink-800`, texto `ink-500`), `loading` (spinner 20 px, texto se mantiene para no cambiar ancho), `focus-visible` (anillo 2 px `--accent` con offset 2 px).
- A11y: `<button>` nativo; si solo ícono → `aria-label`.

### 3.2 `IconButton`

- Círculo 48 px (`md`) o 64 px (`xl`). Variante `surface` (`--surface-2`) y `ghost`.
- Uso: back, cerrar, pausa en Brew Mode, ajustes.

### 3.3 `SegmentedControl`

- Track: `--surface-2`, alto 48, `radius-full`, padding 4.
- Segmento activo: `--surface-inverse`, texto `--text-on-inverse`, `radius-full`. Inactivo: texto `--text-2`.
- 2 a 3 segmentos. Más de 3 → usar `Chip` en scroll horizontal.
- Animación: el thumb se desliza `dur-fast`, `ease-standard`.
- A11y: `role="tablist"` + `role="tab"` + `aria-selected`.

### 3.4 `Chip`

- Alto 40, `radius-sm` (12), padding 0 16, `body` 15 px.
- `default`: fondo `--surface-2`, texto `--text-2`. `selected`: fondo `--surface-inverse`, texto `--text-on-inverse`. `disabled`: texto `--text-disabled`.
- Con ícono a la izquierda (20 px).
- Variante `ChipGrid` (objetivo de taza, síntomas post-brew): grilla de 2 o 3 columnas, gap 8, chips de alto 48 con texto centrado.
- Selección única → `role="radiogroup"`; múltiple → `aria-pressed`.

### 3.5 `Stepper`

- Pill con borde 1 px `--border-strong`, alto 56, `radius-full`.
- Botones − y + de 48 px, valor central en `num-md`.
- Uso: ajustar gramos de café, número de tazas, stock manual.
- Long-press acelera (cada 120 ms después de 400 ms).

### 3.6 `Tile`

```
┌───────────────────────┐
│ LABEL (label, text-3) │  ← arriba-izquierda
│                       │
│      [ visual ]       │  ← dial, gauge, ícono o nada
│                       │
│ 145 g                 │  ← valor num-lg + unidad caption
└───────────────────────┘
```

- Fondo `--surface-2`, `radius-lg` (24), padding 16, aspect 1:1 (169 × 169 a 390 px de ancho) o 2:1.
- Grilla de tiles: 2 columnas, gap 12; filas separadas 24.
- Variantes de **estado**: `static`, `interactive` (todo el tile es un botón; pressed → `--surface-3`), `alert` (borde 1 px `--warning` o `--danger`, el valor toma ese color y lleva ícono).
- Variantes de **contenido** (v1.2, según Figma):

| Variante | Anatomía (arriba → abajo) | Uso en Home |
|---|---|---|
| `meter` | label · `StockMeter` 10 × 20 · `num-lg` + unidad · caption | **Stock**: "145 g" · "5 cafés en stock" |
| `orb` | label · `Orb` outline de 115 px con `num-lg` + caption dentro | **Este mes**: "20 cafés" |
| `bar` | label · `num-lg` + unidad (en fila) · barra de progreso · caption | **V60** / **AeroPress**: "12 brews" · "60% del mes" |

- Barra de progreso del tile `bar`: track 8 px `--track`, `radius` 4, relleno `--text-1` (⏳ P-03 sobre el crema). El porcentaje va siempre escrito en el caption, no solo como barra.
- El label nunca supera 2 líneas. El valor nunca supera 6 caracteres; si no cabe, es otro componente.

### 3.7 `Orb`

- Círculo `--orb` (relleno), texto `--text-on-inverse`. Tamaños: `sm` 96, `md` 160, `lg` 220.
- Contenido: `label` arriba + número `num-xl` (o `num-lg` en `sm`) + caption abajo.
- Variante `outline`: borde 1.5 px `--text-2`, texto `--text-1`.
- **Regla: máximo un orb sólido por vista.** Es el foco. Si hay dos datos héroe, uno es `outline`.
- Variante `action`: orb con ícono `play` → CTA central "Hacer café" (botón, `aria-label="Hacer café"`).

### 3.8 `DataPill`

- `radius-full`, `--surface-2`, alto 88, padding 0 24.
- Línea 1: `label` + valor mono en la misma línea. Línea 2: estado en `caption` `--text-2`.
- Uso en Home: "TUESTE · 12 días / En ventana ideal", "STOCK · 145 g / ~9 preparaciones".

### 3.9 `Gauge` (dial de instrumento)

- SVG. Arco 180° o 270°, `stroke-instrument` (1.5 px `--text-2`), ticks cada 10 % (largos cada 50 %), aguja 1.5 px `--text-1` con base circular 6 px.
- Rango y valor como props. El valor se muestra fuera del gauge en `num-lg`.
- Uso: temperatura (rango 80–100 °C), molienda (clicks del molino del usuario), ventana de tueste.
- Variante interactiva (`DialInput`): la aguja se arrastra; alternativa obligatoria con `Stepper` para accesibilidad (`role="slider"`, `aria-valuemin/max/now`, flechas ±1).

### 3.10 `Slider`

- Track 6 px `--track`, `radius-full`. Fill `--text-1`. Thumb 28 px círculo `ink-50`.
- Escala debajo: `caption` `--text-3`, mínimo 3 marcas.
- Header: título `title` a la izquierda, valor actual `num-md` a la derecha.
- Variante `range` (dos thumbs).
- A11y: `<input type="range">` estilizado o `role="slider"` completo.

### 3.11 `Toggle`

- 52 × 32, track `ink-700` (off) / `ink-50` (on), thumb 24 `ink-50` (off) / `ink-950` (on).
- Siempre con label a la izquierda en la misma fila (fila completa clicable, alto 48).
- `role="switch"` + `aria-checked`.

### 3.12 `TopBar`

Tres variantes (v1.2):

| Variante | Izquierda | Centro | Derecha | Uso |
|---|---|---|---|---|
| `home` | Logotipo `bloom` (SVG, alto 33) | Fecha en `label` `--text-3` ("LUNES · 2 NOV") | `IconButton` `settings-2` → Setup | Home. Hairline inferior 1 px `--border`. |
| `flow` | `IconButton` back | `ProgressDots` + "Paso 1 de 4" | — | Flujo 1 (Café → Método → Objetivo → Receta) |
| `brew` | **Meta**: `label` "META" + mono 13 `--text-2` ("2:40 – 3:00") | **Tiempo total**: ícono `timer` 20 + `num-md` | `IconButton` **✕** (salir) | **Todas** las pantallas del Brew Mode con el tiempo corriendo, incluidas Pausado, Fin y Salir |

- Alto 48–56 + safe area.
- En `brew` la ✕ va **a la derecha** (D-16): el tiempo queda centrado, que es lo que se mira, y la salida queda lejos del pulgar que apoya el teléfono.
- En la vista previa y en los pasos de preparación (el tiempo aún no corre), la barra lleva back/✕ a la izquierda y el método a la derecha.
- En Figma, Pausado (07), Fin (09) y Salir (10) todavía tienen la barra anterior (✕ a la izquierda). Se implementa la variante `brew` en todas.

### 3.13 `BottomNav`

- 5 ítems (v1.2): **Inicio · Stock · Hacer café · Diario · Setup**.
- Ítems laterales: ícono 24 + label `nav`. Inactivo `--text-3`, activo `--text-1`. Sin pill de fondo.
- Ítem central: `Orb` `action` de 56 px (`--surface-inverse`, ícono `play` `--text-on-inverse`), elevado sobre la línea del nav, con label "Hacer café" debajo.
- Fondo `--bg` con hairline superior `--border`.
- **Stock** (antes "Mis cafés"): la biblioteca de cafés, ordenada por inventario.
- **Diario** (antes "Lab"): deshabilitado en V1, en `--text-disabled`, con `aria-label="Diario, disponible pronto"`. ⏳ **P-01:** qué contiene Diario está por definir.
- Oculto en Brew Mode y en el flujo de escaneo.

### 3.14 `BottomSheet`

- Variante `inverse` (cierre de ciclo: brew terminado, receta bloqueada, café guardado): fondo `--surface-inverse`, texto `--text-on-inverse`.
- Variante `default` (formularios cortos, confirmaciones como "¿Salir del brew?"): fondo `--surface-1`.
- `radius-xl` arriba, handle 36 × 4 `ink-400` centrado, padding 12 24 24, gap 16.
- Entra con `ease-enter` + `dur-slow`. Scrim `--scrim`. Focus trap, cierra con el gesto/botón atrás de Android, con Esc y con swipe down (excepto el resumen del brew, que solo cierra con sus botones).

#### 3.14.a `BrewSummarySheet` (variante `inverse`, v1.2 — según Figma 09)

```
            ────
     ✓ Tu café está listo                ← success-light, body 600, centrado
          TIEMPO TOTAL                   ← label on-inverse-2
             2:52                        ← num-xl on-inverse
     ────────────────────────
     (bean) Café │ (droplet) Agua │ (thermometer) Temp.
        15 g     │     240 g       │      92 °C      ← StatRow §3.28
     [        Evaluar receta        ]    ← Button Oscuro lg
            Más tarde                    ← Button Terciario (on-inverse-2)
```
- Todo centrado. El tercer dato se rotula **"Temp."** (en Figma dice "Agua a", que se corta).
- ⏳ **P-05:** agregar bajo el tiempo una línea `caption`: "En tiempo · meta 2:40 – 3:00" (success-light) o "+0:12 sobre la meta" (con ícono). Es el dato que conecta el brew con la evaluación. También: "Stock: 145 → 130 g".
- En Figma, la fila de datos es una imagen raster: se implementa con `StatRow`.

### 3.15 `ListRow` (café en biblioteca) — v1.2

```
[thumb 56] El Paraíso Sidra            145 g  ▸
           NATURAL ANAERÓBICO
```
- Alto 72, padding vertical 8, gap 12, divisor inferior 1 px `--border`. Thumb 56 `radius-md` sobre `--surface-photo`.
- Línea 1: `body` 500 `--text-1`. Línea 2: **solo el proceso** en `label` `--text-3` (el origen vive en el perfil del café).
- Derecha: gramos en mono 14 + "g" `caption`. **Sin `StockMeter`** en la fila (simplificación de Figma).
- Stock bajo: los gramos toman `--warning` **y** se antepone el ícono `triangle-alert` 14 px. En Figma hoy solo cambia el color; el ícono es obligatorio por accesibilidad (nunca solo color).

### 3.16 `StockMeter`

- 10 segmentos de 6 × 12 px (compacto) o 10 × 20 px (perfil), gap 3, `radius-xs`/2.
- Segmentos llenos según % de la bolsa. Vacíos `--track`.
- Color según `bloom_decisions.md` D-09:

| Estado | Regla | Color de segmentos y valor |
|---|---|---|
| OK | ≥ 50 g | `--text-1` |
| Bajo | < 50 g | `--warning` + ícono `triangle-alert` |
| Crítico | < 2 × dosis de la receta activa | `--danger` + ícono `circle-alert` |
| Agotado | < 1 dosis | `--danger` + acción "Marcar como terminado" |

- Siempre acompañado del valor numérico y de "~N preparaciones" (no comunicar solo con color).

### 3.17 `TrustBadge` (sistema de confianza)

| Estado | Ícono | Texto | Estilo |
|---|---|---|---|
| Observado | `eye` | "Observado" | Texto `--text-2`, borde 1 px `--border` |
| Verificado | `badge-check` | "Verificado" | Texto `--success`, borde 1 px `--success` al 40 % |
| Inferido | `≈` (glifo) | "Inferido" | Texto `--warning`, **borde punteado** 1 px `--warning` |

- Alto 24, `radius-full`, padding 0 8, `label`.
- Modo `inline` (solo ícono 14 px junto al dato) con `aria-label` y tooltip al tocar.
- Regla del producto: en "Discurso" no se renderiza nada con estado inferido.

### 3.18 `SourceCard` (trazabilidad de receta)

```
BASE                          ✓ VERIFICADA
Tetsu Kasuya · Método 4:6
World Brewers Cup 2016
Adaptación: ratio 1:15 para tueste oscuro
wcc.coffee ↗
```
- `--surface-2`, `radius-lg`, padding 16. Label "BASE" + `TrustBadge` en la fila superior.
- Nombre en `body` 600, contexto en `caption`, link `--text-2` subrayado.
- Variante "historial": "Tu V3 de este café · Bloqueada el 14 nov" con `star` crema en lugar de `TrustBadge`.

### 3.19 `RecipeParams`

- Lista vertical: número a la izquierda en `num-md` (ancho fijo 80), descripción a la derecha en `body` `--text-2`.
- Filas: Café `15 g` · Agua `240 g` · Ratio `1:16` · Temperatura `92 °C` · Molienda `18 clicks`.
- Divisor hairline entre filas. Cada valor puede llevar `TrustBadge inline`.
- Variante `diff` (ajuste propuesto): `antes → después` en mono; la fila cambiada lleva el valor nuevo en `--text-1` y el anterior en `--text-3` tachado.

### 3.20 `StepTimeline` (resumen de pasos antes de empezar)

- Filas: número + nombre del paso (`body` 500) · meta acumulada (`num-md`) · ventana de tiempo (`caption` mono `--text-3`).
- Pasos de preparación: ícono `list-checks`, sin meta ni ventana, texto `caption` "Preparación".
- Barra vertical de 1.5 px conectando ícono de cada paso.

### 3.21 `TextField`

- Alto 56, `--surface-2`, `radius-md`, padding 0 16. Label flotante `caption` `--text-3`.
- Focus: borde 2 px `--accent`. Error: borde `--danger` + mensaje `caption` `--danger` debajo.
- Numéricos: `inputmode="decimal"`, sufijo de unidad en `--text-3`.

### 3.22 `Banner` (alertas inline)

- `--surface-2`, borde izquierdo 3 px del color semántico, ícono 20, texto `body`, acción `tertiary` opcional.
- Uso: stock bajo, espresso requiere calibración, dato no encontrado, sin conexión.

### 3.23 `ProgressDots`

- Dots de 8 px, gap 6. Completado `--text-1`, actual `--accent` (ancho 20, pill), pendiente `--track`.
- Cuenta **todos** los pasos, incluidos los de preparación.
- Acompañado de texto "Paso 2 de 6" en `label`, gap 12.
- En el Brew Mode con tiempo corriendo, la fila va **centrada** (v1.2).

### 3.24 `TimerRing` — v1.2

Componente central del Brew Mode (solo en pasos con tiempo).

```
           Vierte agua hasta            ← caption --text-3
            45  g                  ← num-hero + "g" en title
    (anillo: track 2 px, progreso 4 px crema, sin ticks)
```
- Diámetro 300 px (`min(78vw, 300px)`).
- Track 2 px `--track`. Progreso 4 px `--accent`, `stroke-linecap: round`, arranca a las 12 y avanza en sentido horario en `ease-linear`, con tiempo real.
- **Sin ticks** (v1.2: se quitaron en Figma; el anillo queda más limpio).
- **Centro, paso con meta de gramos:** `caption` "Vierte agua hasta" **encima** del número (la instrucción se lee antes que el dato) + `num-hero` + unidad en `title`. Ya no lleva "acumulado de 240 g": el total aparece en la vista previa y en "Después".
- **Centro, paso sin meta de gramos** (espera, decantación, presión): `caption` "tiempo total" encima + `num-time` (80).
- **Debajo del anillo:** tiempo restante del paso en `title` **crema**, centrado: "31 s restantes".
- **Últimos 3 s** de un paso que avanza solo: la línea de tiempo restante cambia a "Cambia en 3 s" (y luego 2, 1) y el teléfono vibra `[40]`. ⏳ **P-06:** el frame 06 de Figma hoy repite el estado de Bloom (0:14, 31 s, 140 g); hace falta dibujar este estado.
- Implementación: SVG `circle` con `stroke-dasharray`, actualizado con `requestAnimationFrame`. El tiempo sale de timestamps (ver `bloom_tech_architecture.md` §4), nunca de `setInterval` acumulado.

### 3.25 `RatingScale` (nuevo en v1.1)

Pregunta de cierre: "¿Qué tal esta receta?". Escala de 5 niveles (D-11).

```
┌────────────────────────────────────┐
│  No me gustó                    ○  │
│  Le falta algo                  ○  │
│  Quedó bien                     ○  │
│  Muy rica                       ○  │
│  ★ De campeonato                ○  │
└────────────────────────────────────┘
```

- Lista vertical de 5 filas (no fila horizontal: los labels no caben en 360 px).
- Fila: alto 56, `radius-full`, fondo `--surface-2`, texto `body-lg` `--text-1`, indicador de radio a la derecha.
- Seleccionada: fondo `--surface-inverse`, texto `--text-on-inverse`.
- Nivel 5: ícono `star` 20 px a la izquierda, relleno `crema-400` (permitido en §2.1).
- Orden fijo de 1 (arriba) a 5 (abajo). Sin números visibles.
- Al seleccionar avanza solo (no hay botón "Enviar"). Se puede cambiar la respuesta con back.
- A11y: `role="radiogroup"` con `aria-label="¿Qué tal esta receta?"`; cada fila `role="radio"` + `aria-checked`; flechas ↑↓ mueven la selección.

### 3.26 `InfoList` (nuevo en v1.2 — según Figma 05)

Lista de definición bajo el anillo. Reemplaza los bloques sueltos de propósito, técnica y "Siguiente".

```
PROPÓSITO   Este paso hidrata el café y libera el CO₂ del
            tueste. Sienta las bases de una extracción pareja.
────────────────────────────────────────────────────────
TÉCNICA     Vierte en espiral rápida y agita suavemente 3 veces.
────────────────────────────────────────────────────────
DESPUÉS     Primer vertido → 140 g de agua
```
- Cada fila: auto-layout horizontal, alineación baseline, gap 12. Columna del label fija en 52 px (`label` `--text-3`, puede ir en 2 líneas). Columna del valor flexible.
- Divisor 1 px `--border` entre filas (no después de la última). 12 px de aire entre filas.
- Valores: **Propósito** en `body-lg` `--text-1` (es lo que enseña); **Técnica** y **Después** en `body` `--text-2`.
- Las filas sin contenido no se renderizan (ej. el último paso no tiene "Después").
- El label es siempre el **tipo de dato**, nunca el nombre del paso. En Figma 05 el primer label dice "PRIMER VERTIDO" junto al propósito del bloom: es un error de copy, va "PROPÓSITO".
- A11y: `<dl>` con `<dt>`/`<dd>`.

### 3.27 `MethodIllustration` (nuevo en v1.2)

- Dibujo lineal del método (V60, AeroPress, Espresso), trazo 1,5 px `--text-2`, sin rellenos, 126 × 94 en el hero de Home.
- Va como SVG en `src/assets/illustrations/{metodo}.svg`, con `currentColor` para que herede el color.
- Hoy existe el V60 en Figma (frame `Illustration/V60`, 94 vectores; conviene simplificarlo al exportarlo). Faltan AeroPress y Espresso (⏳ P-08).
- Decorativa: `aria-hidden="true"`.

### 3.28 `StatRow` (nuevo en v1.2 — resumen del brew)

- 3 columnas iguales separadas por divisores verticales de 1 px (`--border` o `ink-200` sobre superficie clara).
- Cada columna: fila ícono 16 + `caption` (Café / Agua / Temp.) y debajo `num-md` + unidad `caption`.
- En el `BrewSummarySheet` usa los colores *on-inverse*.

### 3.29 `CoffeeHero` (tarjeta "Tu café habitual", v1.2 — según Figma 01)

```
┌──────────────────────────────────────┐
│ TU CAFÉ HABITUAL          ╲    ╱      │  label
│ El Paraíso Sidra           ╲__╱  ⌒    │  title-md · MethodIllustration
│ V60 · Receta V3 ★          ═══        │  caption + star crema
│                                      │
│ 15 g   240 g   92 °C   1:16           │  num-sm + unidad
│ Café   Agua    Temp.   Ratio          │  caption --text-3
│ [         Preparar ahora         ]   │  Button primario lg
└──────────────────────────────────────┘
```
- `--surface-2`, `radius-lg`, padding 16, gap 16.
- Encabezado: columna de texto a la izquierda y `MethodIllustration` a la derecha (`space-between`, centrado vertical).
- La estrella sola lleva `aria-label="Receta bloqueada"`.
- ⏳ **P-04:** cuando el motor propone una versión nueva, el subtítulo pasa a "V60 · V4 lista · +0,5 °C". Sin esto, Home ya no muestra que la app aprendió de tu última taza (el tile "Última taza" se quitó).

---

## 4. PATRONES DE PANTALLA

### 4.1 Home

Figma: `01 · Home` (node `7:13`). Objetivo: llegar a "Preparar" en 1 toque y ver **cuánto café tienes y cómo lo estás preparando este mes**.

```
┌────────────────────────────────────┐
│ ▼bloom      LUNES · 2 NOV     (⚙)  │  TopBar home + hairline
│────────────────────────────────────│
│ ¿Qué preparamos?                   │  display (1 línea)
│                                    │
│ ┌────────────────────────────────┐ │
│ │ TU CAFÉ HABITUAL       ╲    ╱  │ │  CoffeeHero §3.29
│ │ El Paraíso Sidra        ╲__╱   │ │  title-md + MethodIllustration
│ │ V60 · Receta V3 ★              │ │
│ │ 15 g   240 g   92 °C   1:16    │ │  num-sm
│ │ [       Preparar ahora       ] │ │
│ └────────────────────────────────┘ │
│ ┌────────────┐ ┌────────────┐      │  Tiles (§3.6)
│ │ STOCK      │ │ ESTE MES   │      │  meter · orb
│ │ ▮▮▮▮▮▮▯▯▯▯ │ │   ( 20 )   │      │
│ │ 145 g      │ │   cafés    │      │
│ │ 5 cafés en │ │            │      │
│ │ stock      │ │            │      │
│ └────────────┘ └────────────┘      │
│ ┌────────────┐ ┌────────────┐      │  bar · bar
│ │ V60        │ │ AEROPRESS  │      │
│ │ 12 brews   │ │ 5 brews    │      │
│ │ ▬▬▬▬▬▭▭▭   │ │ ▬▬▭▭▭▭▭▭   │      │
│ │ 60% del mes│ │ 25% del mes│      │
│ └────────────┘ └────────────┘      │
│ [     Tengo un café nuevo     ]    │  Button secondary
│ CAFÉS RECIENTES                    │
│ ListRow · ListRow                  │  §3.15 v1.2
├────────────────────────────────────┤
│ Inicio  Stock  (▶)  Diario  Setup  │  BottomNav v1.2
└────────────────────────────────────┘
```

Reglas:
- **Stock** = gramos sumados de todas las bolsas activas + "N cafés en stock". Variante `alert` si algún café está bajo (< 50 g): borde y valor `--warning` + caption "Etiopía Yirgacheffe: te queda poco".
- **Este mes** = brews del mes calendario. **Tiles de método** = los 2 métodos más usados del mes, con su porcentaje sobre "Este mes". Si solo hay 1 método, la segunda fila muestra el tile del método + uno vacío "Prueba AeroPress" (⏳ por diseñar). Si no hay brews en el mes, la segunda fila no se muestra.
- Sin café habitual → el hero se reemplaza por un empty state: `Orb` `outline` con ícono `coffee` + "Prepara tu primer café" + Button primary. (En fase 6: `scan-line` + "Escanea tu primer café".)
- El tile "Tueste" y el tile "Última taza" **se quitaron** en v1.2. La señal de aprendizaje pasa al subtítulo del hero (⏳ P-04).

### 4.2 Hacer café (Flujo 1 · selección)

Secuencia con `TopBar` + `ProgressDots` (4 pasos: Café → Método → Objetivo → Receta). Un tema por pantalla, CTA fijo inferior.

- **Método:** `SegmentedControl` (V60 / AeroPress / Espresso) + ilustración lineal del método (estilo `stroke-instrument`) + `RecipeParams` preliminares.
- **Objetivo:** `ChipGrid` de 2 columnas con 6 opciones (Equilibrado, Brillante, Dulce, Con cuerpo, Claridad, Para alguien más). "Para alguien más" abre `BottomSheet default` con preferencias (dulce / intenso / floral / suave / sorpréndeme). No pide datos de la persona.
- **Receta:** título del café, `RecipeParams`, `SourceCard`, línea "Esta receta prioriza X porque…" en `body-lg`, tiempo objetivo total en `DataPill`, CTA `Preparar ahora` + secundario `Ajustar sabor`.

### 4.3 Brew Mode

Pantalla completa. Sin bottom nav. Siempre tema oscuro. Funciona sin conexión.

**Requisitos técnicos obligatorios**
- **Screen Wake Lock** al entrar (`navigator.wakeLock.request('screen')`), liberar al salir, re-solicitar en `visibilitychange`. Fuente: [MDN · Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).
- Timer basado en timestamps; sobrevive a pausas, cambios de app y cierre.
- Avance automático al terminar cada paso con tiempo (haptic + animación).
- **Tocar la pantalla no pausa.** Solo el botón de pausa (64 px).
- El botón atrás de Android se comporta como ✕ (pide confirmación).
- **Estado persistido en IndexedDB** cada segundo y en cada cambio de paso: si la app se cierra, al volver ofrece "Retomar brew en 1:12".

Frames de referencia en Figma (sección `7:12`):

| # | Pantalla | Node | Estado en Figma |
|---|---|---|---|
| 02 | Vista previa | `8:87` | ✅ Definida |
| 03 | Preparación | `8:171` | ✅ Definida |
| 04 | Cuenta regresiva | `8:211` | ✅ Definida (corregir copy, §7) |
| 05 | Paso con tiempo · Bloom | `9:158` | ✅ **Patrón canónico** del paso con tiempo |
| 06 | Últimos 3 s | `16:1755` | ⏳ P-06: falta dibujar el estado |
| 07 | Pausado | `9:259` | ✅ Overlay definido · barra a actualizar a `brew` |
| 08 | Decantación (terminas tú) | `9:324` | ✅ Definida |
| 09 | Fin del brew | `9:375` | ✅ Sheet definido · ⏳ P-05 · `StatRow` a reconstruir |
| 10 | ¿Salir del brew? | `9:442` | ✅ Definida · barra a actualizar a `brew` |

**4.3.a Vista previa (antes de empezar)**
```
(←)                                  V60
TIEMPO OBJETIVO
2:40 – 3:00                      num-window
Desde el primer vertido hasta la última gota.
StepTimeline (6 pasos, el 1 es preparación)
(sun) La pantalla se mantiene encendida mientras preparas.
[ Empezar ]                      Button primary xl
```
- En `StepRow`, la ventana del paso de preparación dice solo "Preparación" y la de la decantación solo "2:40 – 3:00" (v1.2: sin "avanzas tú" / "terminas tú"; el comportamiento se descubre al usarlo).

**4.3.b Paso de preparación** (`prep`)
```
┌────────────────────────────────────┐
│ (✕)                                │
│ ●○○○○○   PASO 1 DE 6               │  ProgressDots
│                                    │
│ (list-checks) PREPARA              │  title-lg
│                                    │
│ Enjuaga el filtro con agua         │  body-lg
│ caliente, descarta el agua y tara  │
│ la báscula con el V60 encima.      │
│                                    │
│ 15 g · 18 clicks                   │  RecipeParams (num-md)
│ 92 °C                              │
│                                    │
│ [ Listo ]                          │  Button primary xl (64 px)
└────────────────────────────────────┘
```
- Sin `TimerRing` ni tiempo total (todavía no corre).
- "Listo" en el último paso de preparación lanza la cuenta regresiva.

**4.3.b′ Cuenta regresiva**
```
           EMPIEZA EN                   label
               3                        num-countdown, crema
 Primer paso: vierte 45 g de agua       body-lg --text-2, centrado
           a 92 °C
            Cancelar                    Button terciario
```

**4.3.c Paso con tiempo** (`pour`, `wait`, `press`, `extract`) — patrón canónico v1.2 (Figma 05)
```
┌────────────────────────────────────┐
│ META             ⏱ 0:14        (✕) │  TopBar brew
│ 2:40 – 3:00                        │
│        ●●○○○○  PASO 2 DE 6         │  ProgressDots centrado
│          (droplet) Bloom           │  título centrado, title-lg
│        ╭──────────────╮            │
│       │  Vierte agua hasta  │           │  TimerRing v1.2
│       │      45 g      │           │
│        ╰──────────────╯            │
│         31 s restantes             │  title, crema
│ PROPÓSITO  Hidrata el café y …     │  InfoList §3.26
│ ────────────────────────────────── │
│ TÉCNICA    Vierte en espiral …     │
│ ────────────────────────────────── │
│ DESPUÉS    Primer vertido → 140 g  │
│              ( ⏸ )                 │  IconButton xl
└────────────────────────────────────┘
```
- Jerarquía fija: **meta de gramos > tiempo restante del paso > nombre del paso > propósito > técnica > después**.
- Todo el bloque superior (progreso, título, anillo, tiempo restante) va **centrado**; el `InfoList` va alineado a la izquierda para lectura.
- Pasos sin meta de gramos: el centro del anillo muestra "tiempo total" + `num-time`.
- **Último paso** (decantación, presión, extracción): no avanza solo. La fila inferior es `IconButton` xl de pausa + `Button` primario xl **"Terminar brew"** (D-17). Así se mide el tiempo real de caída.
- Decantación (Figma 08): propósito "Deja que el café termine de pasar. No interrumpir da más claridad." y técnica "No añadas agua. Retira el dripper al terminar." El propósito se escribe en `body-lg` `--text-1` como en los demás pasos (en Figma quedó en mono verde; ⏳ P-07). Si el tiempo total ya está dentro de la ventana, se agrega una línea `caption` `--success` "En la ventana objetivo" bajo el anillo, en lugar de "N s restantes".

**4.3.d Pausado** (Figma 07)
- Overlay `--bg` al 70 % + blur 10 sobre el paso (se intuye el paso detrás).
- Centro: `Orb` `outline` 180 con "PAUSADO" + timer congelado en `num-window`; debajo, una pastilla con **"El timer está congelado"** y "Primer vertido · paso 3 de 6".
- Acciones: `Continuar` (primario xl), `Siguiente paso` (secundario), `Reiniciar paso` (terciario `--text-1`).

**4.3.e Fin del brew** (Figma 09) → `BrewSummarySheet` (§3.14.a)
- Encabezado: "✓ Tu café está listo".
- Dato héroe: "TIEMPO TOTAL" + `num-xl`.
- Resumen: `StatRow` con café, agua y temperatura.
- CTA: **"Evaluar receta"** (D-17) → Evaluación. Secundario: "Más tarde" (la evaluación queda pendiente en Home).
- Desde la fase 5 se descuentan los gramos del stock (ver ⏳ P-05 para mostrarlo).

**4.3.f ¿Salir del brew?** (Figma 10)
- `BottomSheet default` sobre el paso: "¿Salir del brew?" · "Perderás el progreso de esta preparación." · `Seguir preparando` (primario) · `Salir` (peligro).

### 4.4 Evaluación ("¿Qué tal esta receta?")

**Pantalla 1 — calificación**
- `display` "¿Qué tal esta receta?" + `RatingScale`.
- Seleccionar avanza solo.

**Pantalla 2 — detalle (según el nivel)**

| Nivel | Título (`title`) | Contenido | CTA |
|---|---|---|---|
| 1–2 | "¿Qué notaste?" | `ChipGrid` 3 columnas con 9 síntomas, multiselección (máx. 2) | `Ver ajuste` (primary) · `Guardar sin ajuste` (tertiary) |
| 3 | "¿Qué le faltó?" | Igual, con la nota `caption` "Opcional" (máx. 1) | `Ver ajuste` · `Guardar sin ajuste` |
| 4 | "¿Algún detalle?" | Síntomas colapsados detrás de `Chip` "Agregar detalle" | `Guardar` |
| 5 | — | `BottomSheet inverse`: "¿Bloqueamos esta receta?" + `star` crema | `Bloquear receta` · `Ahora no` |

Texto libre opcional en todos los niveles: `TextField` multilínea colapsado detrás de un `Chip` "Agregar nota".

**Pantalla 3 — ajuste propuesto** (si el motor propone uno)
```
PARA LA PRÓXIMA TAZA                         label

Reportaste: Quedó bien · falta dulzor         body
RecipeParams diff:
  Temperatura   92 °C → 92,5 °C               num-md
Un poco más de temperatura extrae más         body-lg
azúcares sin tocar el cuerpo.
Basado en tus últimas 3 tazas de este café    caption text-3

[ Usar V2 la próxima vez ]                    primary
[ Mantener V1 ]                               secondary
```
- Máximo 2 filas de cambio. Las variables sin cambio no se listan.
- Si el motor revirtió (R6): `Banner` informativo "V2 salió peor que V1. Volvemos a V1 y probamos otra cosa."
- Si no hay síntoma (R8): no se muestra ajuste; mensaje `body` "Guardado. La próxima vez te pregunto de nuevo."

### 4.5 Perfil de café

- Banda `--surface-photo` (alto 240) con la bolsa centrada.
- Título `title-lg`, tostador `label`.
- Grilla 2×2 de atributos (Origen, Variedad, Proceso, Tueste): label en `title` `--text-1`, valor en `body` `--text-2`, `TrustBadge inline` junto al valor.
- Tabs internas (fila de `Chip` scrollable): Resumen · Recetas · Brews · Inventario · Discurso.
- Tab Recetas: historial de versiones con calificación (`★★★`, estado revertida/bloqueada).

### 4.6 Estados vacíos, carga, error y sin conexión

- **Vacío:** `Orb outline` sm con ícono + `title` + `body` `--text-2` + 1 acción.
- **Carga (investigación del café):** skeletons `--surface-2` con shimmer de opacidad 0.6 → 1 (`dur-slow` loop; sin shimmer si reduced motion). Mensaje vivo en `caption`: "Buscando al tostador…", "Revisando la finca…".
- **Error / no encontrado:** `Banner` warning. Nunca inventar el dato: "No encontramos información del productor. Puedes agregarla tú."
- **Sin conexión:** `Banner` neutral en las secciones que la necesitan: "Sin conexión. Puedes preparar café igual." Brew Mode nunca muestra este banner.

---

## 5. ILUSTRACIÓN E IMÁGENES

- Fotos de bolsas: siempre sobre `--surface-photo`, recortadas o con fondo neutro, `object-fit: contain`.
- Ilustraciones de métodos (V60, AeroPress, espresso): dibujo lineal 1.5 px, monocromo, estilo plano técnico. Sin rellenos ni sombras.
- Visualizaciones de datos (comparación de cafés, historial de calificaciones): barras horizontales con trazos 1.5 px; un café en `--text-1`, el otro en `--text-3` punteado. Sin colores categóricos.

---

## 6. ACCESIBILIDAD (checklist de aceptación)

- [ ] Texto ≥ 4.5:1; texto grande y componentes gráficos ≥ 3:1 (tabla 2.1).
- [ ] Ningún estado se comunica solo con color (stock, confianza, éxito/error llevan ícono o texto).
- [ ] Targets ≥ 48 px; Brew Mode ≥ 64 px.
- [ ] `:focus-visible` con anillo `--accent` 2 px en todos los interactivos.
- [ ] Brew Mode anuncia cambios de paso con `aria-live="assertive"`; el timer usa `aria-live="off"` y expone el tiempo bajo demanda.
- [ ] Dial/gauge interactivos tienen alternativa con `Stepper`.
- [ ] Respeta `prefers-reduced-motion` y zoom de texto hasta 200 % sin pérdida de contenido.
- [ ] Probado con TalkBack en Android.
- [ ] `lang="es"` en el documento.

---

## 7. CONTENIDO Y VOZ

**Tono:** un barista experto que te acompaña. Directo, cálido, técnico cuando hace falta. Tuteo, español neutro.

| Regla | ✅ | ❌ |
|---|---|---|
| Verbos en imperativo amable | "Vierte agua hasta 140 g" | "Usted debe verter…" |
| El dato primero | "45 g · 40 s" | "Durante cuarenta segundos vierte cuarenta y cinco gramos" |
| Explica el porqué en una frase | "Baja 1 °C: reduce el amargor sin perder cuerpo." | "Ajuste aplicado." |
| Honestidad del dato | "Inferido por el tueste" | Presentar inferencias como hechos |
| Honestidad del aprendizaje | "Basado en tus últimas 3 tazas" | "Nuestra IA sabe lo que te gusta" |
| Sin emojis en UI | Ícono `droplet` | 💧 |
| Sin jerga innecesaria en el primer nivel | "Más dulzor" | "Aumentar EY en 1.5 %" |

**Formato de números**
- Gramos: `15 g` (espacio, sin punto). Decimales con coma solo si hacen falta: `15,5 g`.
- Temperatura: `92 °C` (medios grados permitidos: `92,5 °C`).
- Ratio: `1:16`.
- Tiempo: `2:40` (m:ss); rangos con guion medio y espacios: `2:40 – 3:00`.
- Clicks de molino: `18 clicks` (medios clicks solo si el molino los admite).

**Botones:** verbo + objeto, máximo 3 palabras. "Preparar ahora", "Empezar", "Listo", "Terminar brew", "Evaluar receta", "Guardar receta", "Bloquear receta", "Comparar". Excepción aceptada: "Usar V2 la próxima vez".

**Unidades:** siempre `g`, nunca "gr" ni "grs". Verbo "verter" (no "vertir"): "vierte", "vertido".

**Copy de pantalla v1.2 (definido en Figma — manda sobre versiones anteriores)**

| Lugar | Texto |
|---|---|
| Home · título | ¿Qué preparamos? |
| Home · tiles | STOCK · "145 g" · "5 cafés en stock" — ESTE MES · "20 cafés" — V60 · "12 brews" · "60% del mes" |
| Nav | Inicio · Stock · Hacer café · Diario · Setup |
| Cuenta regresiva | EMPIEZA EN · 3 · "Primer paso: vierte 45 g de agua a 92 °C" (Figma dice "vertir 45 gr": corregido) |
| Paso con tiempo | "Vierte agua hasta" (sobre el número) · "31 s restantes" · PROPÓSITO / TÉCNICA / DESPUÉS · "Primer vertido → 140 g de agua" |
| Decantación | Técnica: "No añadas agua. Retira el dripper al terminar." · Botón: **Terminar brew** |
| Pausado | "El timer está congelado" + paso actual |
| Fin | "Tu café está listo" · TIEMPO TOTAL · Café / Agua / Temp. · **Evaluar receta** · Más tarde |

⏳ **P-02 · Nombre del bloom:** en Figma el paso con tiempo dice "Blooming" y la vista previa dice "Bloom". Hay que usar un solo nombre en toda la app. Recomendación: **"Bloom"**, porque es el término que usan los baristas hispanohablantes y es más corto en el título centrado.

---

## 8. DO & DON'T

| Do | Don't |
|---|---|
| Un `Orb` sólido por vista | Varios círculos blancos compitiendo |
| `crema` solo para "ahora" y para ⭐ | Usar `crema` en CTAs o fondos |
| Números en Geist Mono tabular | Números en Geist proporcional en timers |
| Elevación por luminancia | Sombras en tema oscuro |
| CTA primario único por pantalla | Dos botones blancos lado a lado |
| Trust badge junto al dato | Un disclaimer general al final |
| Brew Mode sin nav y con wake lock | Que la pantalla se apague a mitad del brew |
| "Listo" solo en pasos de preparación | Pedir toques entre vertidos |
| Escala de 5 en lista vertical | 5 estrellas diminutas en una fila |

---

## 9. IMPLEMENTACIÓN (para Claude Code)

### 9.1 Estructura

```
src/
  styles/
    tokens.css          ← sección 9.2 (fuente de verdad)
    tailwind.css        ← sección 9.3
    base.css            ← reset, tipografía base, focus
  components/
    Button.tsx  IconButton.tsx  SegmentedControl.tsx  Chip.tsx  ChipGrid.tsx
    Stepper.tsx  Tile.tsx  Orb.tsx  DataPill.tsx  Gauge.tsx  Slider.tsx
    Toggle.tsx  TopBar.tsx  BottomNav.tsx  BottomSheet.tsx  ListRow.tsx
    StockMeter.tsx  TrustBadge.tsx  SourceCard.tsx  RecipeParams.tsx
    StepTimeline.tsx  TextField.tsx  Banner.tsx  ProgressDots.tsx  TimerRing.tsx
    RatingScale.tsx
  features/
    brew-mode/          ← brew-machine.ts, useBrewTimer, useWakeLock, useHaptics
    evaluation/
```

> Stack: Next.js + React + TypeScript + Tailwind v4 (ver `bloom_tech_architecture.md` §1). Componentes propios; Radix solo como primitiva *headless* para `BottomSheet` (diálogo, focus trap).

### 9.2 Tokens CSS (`tokens.css`)

```css
:root {
  /* ── Primitivos ── */
  --ink-950:#0E0E0F; --ink-900:#161617; --ink-850:#1F1F1F; --ink-800:#2A2A2A;
  --ink-700:#363636; --ink-600:#4A4A47; --ink-500:#6B6B68; --ink-400:#8C8C88;
  --ink-300:#B9B9B5; --ink-200:#CFCFCA; --ink-100:#E7E7E2; --ink-50:#F4F4F1;
  --crema-400:#E8B676; --crema-300:#F0CB98; --crema-700:#9A6A2C;
  --green-300:#8FD1AE; --green-700:#2E7D5B; --amber-400:#F5A524; --red-400:#FF7A68;

  /* ── Semánticos (oscuro, default) ── */
  --bg:var(--ink-950); --surface-1:var(--ink-900); --surface-2:var(--ink-850);
  --surface-3:var(--ink-800); --surface-photo:var(--ink-200);
  --surface-inverse:var(--ink-50); --orb:var(--ink-100);
  --text-1:var(--ink-50); --text-2:var(--ink-300); --text-3:var(--ink-400);
  --text-disabled:var(--ink-500); --text-on-inverse:var(--ink-950);
  --text-on-inverse-2:var(--ink-600);
  --border:var(--ink-700); --border-strong:var(--ink-600); --track:var(--ink-700);
  --accent:var(--crema-400); --accent-pressed:var(--crema-300);
  --success:var(--green-300); --warning:var(--amber-400); --danger:var(--red-400);
  --scrim:rgba(0,0,0,.64);

  /* ── Tipografía ── (nombres --font-ui / --font-num para no chocar con Tailwind) */
  --font-ui:"Geist", Inter, system-ui, Roboto, sans-serif;
  --font-num:"Geist Mono", "JetBrains Mono", ui-monospace, monospace;
  --fs-num-countdown:10rem; --lh-num-countdown:10rem;
  --fs-num-hero:7rem;   --lh-num-hero:6.25rem;
  --fs-num-time:5rem;   --lh-num-time:5rem;
  --fs-num-window:3rem; --lh-num-window:3.5rem;
  --fs-num-sm:1.375rem; --lh-num-sm:1.75rem;
  --fs-title-md:1.5rem; --lh-title-md:1.75rem;
  --fs-num-xl:4rem;     --lh-num-xl:4rem;
  --fs-num-lg:2.5rem;   --lh-num-lg:2.75rem;
  --fs-num-md:1.5rem;   --lh-num-md:1.75rem;
  --fs-display:2.5rem;  --lh-display:2.75rem;
  --fs-title-lg:1.75rem;--lh-title-lg:2rem;
  --fs-title:1.375rem;  --lh-title:1.75rem;
  --fs-body-lg:1.0625rem;--lh-body-lg:1.5rem;
  --fs-body:.9375rem;   --lh-body:1.375rem;
  --fs-caption:.8125rem;--lh-caption:1.125rem;
  --fs-label:.6875rem;  --lh-label:.875rem; --ls-label:.08em;
  --fs-button:1rem;     --lh-button:1.25rem;

  /* ── Espaciado ── */
  --space-1:2px; --space-2:4px; --space-3:8px; --space-4:12px; --space-5:16px;
  --space-6:20px; --space-7:24px; --space-8:32px; --space-9:40px; --space-10:48px; --space-11:64px;

  /* ── Radios ── */
  --radius-xs:8px; --radius-sm:12px; --radius-md:16px; --radius-lg:24px;
  --radius-xl:32px; --radius-full:9999px;

  /* ── Trazos ── */
  --stroke-hairline:1px; --stroke-instrument:1.5px; --stroke-progress:4px;

  /* ── Motion ── */
  --dur-instant:80ms; --dur-fast:160ms; --dur-base:240ms; --dur-slow:360ms; --dur-countdown:1000ms;
  --ease-standard:cubic-bezier(.2,0,0,1);
  --ease-enter:cubic-bezier(.05,.7,.1,1);
  --ease-exit:cubic-bezier(.3,0,.8,.15);

  /* ── Layout ── */
  --gutter-screen:20px; --app-max-width:480px;
  --target-min:48px; --target-brew:64px;
  --nav-height:64px; --cta-height:56px;
}

/* Tema claro "Papel" — solo si el usuario elige Automático/Claro */
[data-theme="light"] {
  --bg:#FAFAF7; --surface-1:#F2F2EE; --surface-2:#E9E9E4; --surface-3:#DEDED8;
  --surface-inverse:var(--ink-950); --orb:var(--ink-950);
  --text-1:var(--ink-950); --text-2:#5C5C58; --text-3:#6B6B68;
  --text-on-inverse:var(--ink-50); --border:#D6D6D0; --border-strong:#B9B9B5;
  --track:#D6D6D0; --accent:var(--crema-700); --success:var(--green-700);
}

/* Brew Mode fuerza oscuro */
[data-mode="brew"] { color-scheme: dark; }

.num { font-family:var(--font-num); font-variant-numeric:tabular-nums; }

@media (prefers-reduced-motion: reduce) {
  :root { --dur-fast:0ms; --dur-base:120ms; --dur-slow:160ms; }
}
```

### 9.3 Tailwind v4 (`tailwind.css`)

`@theme inline` porque los colores apuntan a variables que cambian en runtime con el tema (D-13). Se borra la paleta y las fuentes por defecto de Tailwind para que solo existan los valores del DS.

```css
@import "tailwindcss";
@import "./tokens.css";

@theme inline {
  /* Solo colores del DS */
  --color-*: initial;
  --color-bg: var(--bg);
  --color-surface-1: var(--surface-1);
  --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3);
  --color-surface-photo: var(--surface-photo);
  --color-inverse: var(--surface-inverse);
  --color-orb: var(--orb);
  --color-fg: var(--text-1);
  --color-fg-2: var(--text-2);
  --color-fg-3: var(--text-3);
  --color-fg-disabled: var(--text-disabled);
  --color-fg-inverse: var(--text-on-inverse);
  --color-fg-inverse-2: var(--text-on-inverse-2);
  --color-line: var(--border);
  --color-line-strong: var(--border-strong);
  --color-track: var(--track);
  --color-accent: var(--accent);
  --color-accent-pressed: var(--accent-pressed);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
  --color-scrim: var(--scrim);

  /* Familias (sin referencia circular: tokens.css usa --font-ui / --font-num) */
  --font-*: initial;
  --font-sans: var(--font-ui);
  --font-mono: var(--font-num);

  /* Radios con nombres propios para no pisar los del DS */
  --radius-*: initial;
  --radius-thumb: var(--radius-xs);
  --radius-chip: var(--radius-sm);
  --radius-field: var(--radius-md);
  --radius-tile: var(--radius-lg);
  --radius-sheet: var(--radius-xl);
  --radius-pill: var(--radius-full);
}
```

El espaciado usa la escala por defecto de Tailwind v4 (base 4 px), que coincide con el DS (tabla §2.3).

### 9.4 Criterios de aceptación del DS en código

1. `grep` de hex (`#[0-9A-Fa-f]{6}`) fuera de `tokens.css` = 0 resultados (corre en CI).
2. Ninguna clase de color de Tailwind fuera de las del DS (garantizado por `--color-*: initial`).
3. Todos los componentes de la sección 3 tienen preview en la ruta `/ds` con todos sus estados.
4. Lighthouse Accessibility ≥ 95 en Home, Brew Mode y Perfil de café.
5. Brew Mode probado en el Android de George: la pantalla no se apaga en 5 minutos; el timer no deriva más de 100 ms en 3 minutos; al cerrar la app a mitad del brew y volver, ofrece retomar; funciona en modo avión.

---

## 10. FUENTES

- W3C — [WCAG 2.2 · Contrast (Minimum) 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) y [Target Size (Minimum) 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
- Google — [Material Design 3 · Elevation](https://m3.material.io/styles/elevation/overview)
- MDN — [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) · [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) · [font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric) · [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- Vercel — [Geist font](https://vercel.com/font) (SIL OFL 1.1)
- Lucide — [lucide.dev](https://lucide.dev) (ISC)
- Producto — `bloom_product.md` v0.4 · Decisiones — `bloom_decisions.md`

---

## 11. CAMBIOS

### v1.2 (3 nov 2026) — diseño de George en Figma

- Figma pasa a ser la fuente visual (§0, §12). Este documento queda para tokens y reglas.
- **Home:** barra con logotipo, fecha centrada y hairline; título "¿Qué preparamos?"; hero con ilustración del método (`CoffeeHero` §3.29); tiles nuevos: Stock total, Este mes, y uso por método (V60 / AeroPress); se quitan Tueste y Última taza.
- **Nav:** "Mis cafés" → **Stock**; "Lab" → **Diario**.
- **Brew Mode:** barra `brew` con ✕ a la derecha y tiempo centrado; bloque superior centrado; `TimerRing` sin ticks y con "Vierte agua hasta" sobre el número; tiempo restante en crema; nuevo `InfoList` (Propósito / Técnica / Después).
- **Último paso:** botón "Terminar brew". **Fin:** `BrewSummarySheet` con "Tu café está listo", tiempo total y `StatRow`; CTA "Evaluar receta".
- **Tipografía:** nuevos `num-countdown`, `num-time`, `num-window`, `num-sm`, `title-md`. Mínimo 11 px.
- **Componentes nuevos:** `InfoList`, `MethodIllustration`, `StatRow`, `CoffeeHero`; variantes de `Tile` (`meter`, `orb`, `bar`) y de `TopBar` (`home`, `flow`, `brew`).
- `ListRow` sin `StockMeter`; meta = proceso.
- Pendientes de aprobación: P-01 a P-08 (`bloom_decisions.md`).

### v1.1 (1 nov 2026)

- Plataforma de referencia: Android (Chrome). Haptics pasan a ser parte de la experiencia (§2.7).
- Nuevo componente `RatingScale` (§3.25) y variante `diff` de `RecipeParams` (§3.19).
- Brew Mode: patrón de paso de preparación con "Listo" (§4.3.b); persistencia en IndexedDB en lugar de `sessionStorage`; botón atrás de Android.
- Evaluación rediseñada en 3 pantallas (§4.4).
- `StockMeter`: umbrales de D-09 (< 50 g y crítico por dosis).
- "Para un cliente" → "Para alguien más", sin registro de datos.
- `crema` permitido en el ícono `star` del nivel 5.
- Tailwind: `@theme inline`, sin referencia circular de fuentes (tokens renombrados a `--font-ui` / `--font-num`), radios con nombres propios, paleta por defecto borrada (§9.3).
- Fuentes autoalojadas con `next/font` para funcionar offline.

---

## 12. MAPA FIGMA (para el MCP de Figma en Claude Code)

Archivo: `https://www.figma.com/design/b6fW2A40LxfXyqHOloXxnv/bloom` · fileKey `b6fW2A40LxfXyqHOloXxnv`

| Qué | Node |
|---|---|
| Sección de pantallas "Bloom · Home + Brew Mode" | `7:12` |
| 01 Home | `7:13` |
| 02 Vista previa · 03 Preparación · 04 Cuenta regresiva | `8:87` · `8:171` · `8:211` |
| 05 Bloom (patrón canónico) · 06 Últimos 3 s | `9:158` · `16:1755` |
| 07 Pausado · 08 Decantación · 09 Fin · 10 Salir | `9:259` · `9:324` · `9:375` · `9:442` |
| Sección "Bloom · Componentes" (Button, IconButton, ProgressDot, ParamRow, StepRow, ListRow, BottomNav, íconos) | `6:2` |
| Variables: colecciones "Bloom · Color" y "Bloom · Medidas"; estilos de texto "Bloom/…" | locales del archivo |

Las variables y los estilos de texto de Figma tienen los mismos nombres y valores que §2. Si difieren, manda este documento y se anota como `PENDIENTE`.

---

*Bloom — Design System v1.2 · "Instrumento" · 3 nov 2026*
*Próximo paso: Claude Code aplica v1.2 sobre lo construido en la fase 1 (prompt 3 de `bloom_claude_code_kickoff.md`).*
