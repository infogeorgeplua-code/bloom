# Bloom — Arquitectura de Producto
> Documento estratégico v0.5 · 3 nov 2026 · PWA para Android · Español · Uso personal
> Cambios vs v0.4 al final (§27). Orden de precedencia: `bloom_decisions.md` → `bloom_tech_architecture.md` → `bloom-design-system.md` (+ Figma, sección 7:12) → este documento.
> Las pantallas y textos de interfaz los define el diseño en Figma (D-14). Aquí quedan el porqué y el flujo.

---

## JUICIO ESTRATÉGICO: QUÉ TIENE SENTIDO Y QUÉ DESCARTAMOS

### ✅ TIENE SENTIDO — mantener y priorizar

| Elemento | Justificación |
|---|---|
| **Realizar café** como acción principal | Es el flujo cotidiano real. El CTA principal refleja ese uso. |
| **Brew Mode offline primero** | Es la pantalla de mayor uso y la de mayor riesgo técnico. Se construye y valida antes que todo lo demás (D-01). |
| Escanear café como segundo flujo | Entrada para explorar un café nuevo o preparar a partir de su identidad. |
| Brew mode automático con temporizador | El barista tiene las manos ocupadas. Un flujo automático es mejor que presionar "listo" entre vertidos. |
| Texto de propósito sensorial por paso | "Este vertido construye el cuerpo" transforma el brew en aprendizaje activo. |
| Tiempo objetivo total visible desde el inicio | El barista necesita saber a dónde va para calibrar su ritmo. |
| Trazabilidad con campeones reales | Ancla de confianza real y diferenciador. Datos curados a mano, nunca generados (D-12). |
| Aprendizaje a partir de tu feedback | Cada taza evaluada mejora la siguiente. Reglas explícitas y reversibles (D-11). |
| Inventario de café por bolsa | El barista necesita saber cuánto le queda para planificar. |
| Agregar receta propia o de experimento | El barista también investiga y experimenta. La app debe ser su cuaderno. |
| Comparación entre cafés | Útil para decidir qué preparar o entender diferencias. |
| Exa + Perplexity Search para investigar | Bing se retiró en 2025. Exa y Perplexity lideran precisión factual en benchmarks independientes (D-05). |

### ⚠️ TIENE SENTIDO — pero con precaución técnica

| Elemento | Riesgo | Solución |
|---|---|---|
| Brew mode automático | El tiempo de cada paso varía según el café y el barista. | Pausa siempre visible. Los pasos de preparación avanzan a mano. |
| Inventario con control de gramos | Si el usuario no actualiza, el dato se desactualiza. | Siempre editable a mano. Aviso cuando el stock baja de 50 g (D-09). |
| Recetas de campeones | Algunas no son públicas o están incompletas. | Etiquetar siempre como "inspirada en / adaptada de". Citar fuente y año. Filas sin confirmar se muestran como ~. |
| Investigación de cafés poco documentados | Tostadores pequeños y fincas tienen poca presencia web. | "No encontrado" es un resultado válido. Nunca rellenar con suposiciones. |

### ❌ DESCARTAR del MVP

| Elemento | Por qué |
|---|---|
| Registro de clientes (nombre, celular) | Datos personales de terceros. Pasa a V2 con consentimiento explícito (D-04). |
| iOS | MVP en Android. iOS después (D-02). |
| Integración con báscula BT/Wi-Fi | Alta complejidad técnica. V3+. |
| Refractómetro / TDS | Nicho dentro del nicho. V3+. |
| Reconocimiento de flujo de vertido | Requiere visión por computadora en tiempo real. Descartar. |
| Biblioteca global / social | Es otro producto. |
| Chatbot como interfaz principal | La IA se integra en el flujo, no es el flujo. |
| Modo cupping SCA formal | V3+. |

---

## 1. DEFINICIÓN DEL PRODUCTO

**Bloom** es un copiloto de café de especialidad para un barista apasionado que prepara café a diario, para sí mismo y para quienes lo visitan.

No es una calculadora de recetas. Es un sistema que:

1. **Acompaña** cada preparación con un brew mode automático: temporizador, gramos, propósito de cada paso.
2. **Aprende** de cómo te supo cada taza y mejora la receta para la próxima.
3. **Identifica** el café que tienes cuando lo necesitas.
4. **Investiga** su historia, productores y características, sin inventar lo que no encuentra.
5. **Genera** recetas con trazabilidad hacia campeones reales y baristas reconocidos.
6. **Documenta** tu stock de café y tus brews.
7. **Te ayuda a narrar** el café a quien lo toma.

---

## 2. PROPUESTA DE VALOR

> "Dime qué quieres preparar hoy. Te guío segundo a segundo, aprendo de cómo te quedó y, si quieres conocer el café que tienes, te cuento todo sobre él."

**Para quién:** baristas apasionados y semi-profesionales que preparan café a diario. Usuario inicial: George, en Android.

---

## 3. JOBS TO BE DONE

| Job | Frecuencia | Contexto | Resultado esperado |
|---|---|---|---|
| **Preparar café hoy** | Diaria | Tengo mi café habitual y quiero hacerlo bien | Brew mode automático, vertido a vertido |
| **Que la próxima taza salga mejor** | Diaria | Esta quedó bien, pero no increíble | Evaluación rápida → la app ajusta la próxima versión |
| **Preparar para alguien más** | Frecuente | Una persona quiere algo dulce y suave | Receta adaptada a esa preferencia (sin guardar sus datos) |
| **Conocer un café nuevo** | Ocasional | Llegó una bolsa nueva | Ficha completa + receta recomendada |
| **Narrar el café a quien lo toma** | Frecuente | Voy a servir este café | Discurso listo en el nivel adecuado |
| **Saber cuánto café me queda** | Semanal | Quiero planificar mis preparaciones | Inventario actualizado por bolsa |
| **Agregar una receta que encontré** | Ocasional | Vi una receta de un campeón o hice un experimento | Receta guardada en mi biblioteca |
| **Comparar dos cafés** | Ocasional | Tengo dos cafés similares y quiero decidir | Comparación lado a lado |

---

## 4. PRINCIPIOS DEL SISTEMA

1. **La acción principal es preparar.** El brew mode es la pantalla más importante del producto.
2. **El brew mode acompaña, no interrumpe.** Automático, con temporizador visible, sin tocar el teléfono entre vertidos.
3. **Cada paso tiene un propósito.** El barista siempre sabe qué busca cada momento del brew.
4. **La receta siempre tiene origen.** Toda recomendación cita una fuente: campeón, barista reconocido o regla técnica.
5. **Menos variables, más aprendizaje.** Máximo 2 parámetros cambiados por ajuste.
6. **La IA explica, no dicta.** Cada cambio viene con una razón y con el historial en que se basa.
7. **Confianza explícita, siempre.** Todo dato lleva su estado: 👁 observado / ✓ verificado / ~ inferido.
8. **"No encontrado" es una respuesta válida.** Nunca rellenar un hueco con una suposición.
9. **Progressive disclosure.** Seleccionar café → receta → brew es suficiente. El experto puede profundizar.

---

## 5. SISTEMA DE CONFIANZA DE DATOS

| Estado | Símbolo | Definición | Ejemplo |
|---|---|---|---|
| **Observado** | 👁 | Aparece directamente en la bolsa o imagen | Nombre, proceso, fecha de tueste |
| **Verificado** | ✓ | Confirmado en fuente externa confiable | Página del tostador, SCA, wcc.coffee, aeropress.com |
| **Inferido** | ~ | Interpretación del sistema basada en patrones | Nivel de tueste probable, comportamiento en extracción |

**Regla absoluta:** nunca presentar información inferida como hecho. El discurso para quien toma el café solo usa datos 👁 o ✓, nunca ~.

---

## 6. FLUJO 1 — REALIZAR CAFÉ (flujo principal, uso diario)

```
[HOME]
  "¿Qué preparamos?" · tu café habitual → "Preparar ahora"
  ↓
[SELECCIÓN DE CAFÉ]
  A: Elegir de mis cafés guardados (biblioteca)
  B: Continuar con mi café habitual (último usado)
  C: "Tengo un café nuevo" → inicia Flujo 2 (Escanear)
  D: "Agregar una receta que vi" → flujo de receta manual
  ↓
[SELECCIÓN DE MÉTODO]
  V60 / AeroPress / Espresso
  (Chemex · Kalita · French Press → V2)
  ↓
[OBJETIVO DE LA TAZA]
  ○ Equilibrado     ○ Brillante/Ácido
  ○ Dulce           ○ Con cuerpo
  ○ Claridad máxima ○ Para alguien más
  ↓
  Si "Para alguien más":
    → "¿Qué le gusta?" (dulce / intenso / floral / suave / sorpréndeme)
    → La app traduce esa preferencia a un objetivo técnico
    → No se guarda ningún dato de la persona (D-04)
  ↓
[RECETA]
  Si ya preparaste este café con este método → parte de tu mejor versión
  Si no → receta generada por el motor
  Parámetros completos con trazabilidad
  "Esta receta prioriza X porque..."
  Fuente: [Campeón / Barista / Regla técnica / Tu historial]
  Tiempo objetivo total visible en la parte superior
  Botón: "Ajustar sabor" → controles sensoriales
  Botón: "Preparar ahora" → Brew Mode
  ↓
[BREW MODE AUTOMÁTICO]  (§8)
  ↓
[EVALUACIÓN: "¿Qué tal esta receta?"]  (§10)
  ↓
[La próxima versión queda lista según tu respuesta]
  o
[⭐ Receta bloqueada si fue "De campeonato"]
```

---

## 7. FLUJO 2 — ESCANEAR CAFÉ (flujo de exploración · fase 6)

**Puntos de entrada:**
- Desde Home: "Tengo un café nuevo"
- Desde el Flujo 1 al seleccionar café
- Desde Stock: "Agregar café"

```
[CÁMARA / UPLOAD]
  Fotografiar bolsa, etiqueta o tarjeta
  ↓
[EXTRACCIÓN CON LLM DE VISIÓN — Claude Haiku 5.5]
  Reconocimiento: tostador, nombre, país, región, finca,
  productor, variedad, proceso, altitud, notas, fecha tueste, nivel
  Cada dato leído de la imagen: 👁 observado
  Campo no legible → vacío (nunca adivinado)
  ↓
[REGISTRO DE INVENTARIO]
  "¿Cuántos gramos tienes de este café?"
  → Si es un café ya guardado: "¿Es una bolsa nueva?"
  ↓
[INVESTIGACIÓN AUTOMÁTICA — Exa, respaldo Perplexity Search]  (§17)
  ↓
[FICHA DEL CAFÉ — borrador]
  Indicadores de confianza por campo
  Cualquier campo se puede corregir
  Pregunta solo si falta algo esencial
  ↓
[CAFÉ GUARDADO EN BIBLIOTECA]
  ↓
  A: "Preparar este café ahora" → continúa en Flujo 1
  B: "Ver ficha completa" → perfil del café
  C: "Volver al inicio"
```

Mientras no exista la fase 6, un café se agrega a mano con un formulario corto (nombre, tostador, proceso, fecha de tueste, gramos).

---

## 8. BREW MODE — TEMPORIZADOR AUTOMÁTICO

Es la pantalla de mayor uso diario. Funciona con el teléfono apoyado junto al dripper, posiblemente con manos mojadas, y **funciona sin conexión**.

### Principios de diseño

- **Dos tipos de paso** (D-10):
  - **Preparación** (`prep`): enjuagar filtro, tarar, purgar la máquina. Sin temporizador. Avanza con un botón "Listo" grande. Todavía no tienes las manos ocupadas.
  - **Con tiempo** (`pour`, `wait`, `press`, `extract`): bloom, vertidos, espera, presión, extracción. Avanzan solos.
- **El tiempo total arranca con el primer paso con tiempo**, después de un 3-2-1. Por eso el bloom puede ser el paso 2.
- **Un paso a la vez.** Pantalla completa por etapa.
- **Pausa manual siempre visible.** Tocar la pantalla no pausa.
- **Tiempo total visible desde que empieza a correr.**
- **Texto de propósito sensorial en cada paso con tiempo.**
- **La meta es el total en la báscula** ("Vierte hasta 140 g"), no el vertido parcial. No se muestra "acumulado": la báscula ya lo dice.
- **El dato que actúas va al centro y grande**: gramos en vertidos, tiempo en esperas (D-16). Propósito, técnica y lo que viene después van abajo, en una lista corta.
- **La pantalla no se apaga** y el teléfono vibra al cambiar de paso.
- **Si la app se cierra a mitad del brew**, al volver ofrece "Retomar brew en 1:12".

### Vista previa antes de empezar

```
─────────────────────────────────────────
  V60 · 15 g → 240 g · 92 °C
  Tiempo objetivo total: 2:40 – 3:00
─────────────────────────────────────────
  PASOS
  1  Enjuaga el filtro        prep
  2  Bloom          45 g   │  0:00 – 0:40
  3  Vertido 1     140 g   │  0:45 – 1:10
  4  Vertido 2     200 g   │  1:30 – 1:50
  5  Vertido final 240 g   │  2:10 – 2:30
  6  Decantación           │  hasta 3:00
─────────────────────────────────────────
  [▶ Empezar]
─────────────────────────────────────────
```

### Paso de preparación

```
─────────────────────────────────────────
  ●○○○○○  Paso 1 de 6
─────────────────────────────────────────
  PREPARA

  Enjuaga el filtro con agua caliente,
  descarta el agua y tara la báscula
  con el V60 encima.

  Muele 15 g · 18 clicks
  Agua a 92 °C

  [ Listo ]          ← botón de 64 px
─────────────────────────────────────────
```

Al tocar "Listo" en el último paso de preparación: 3-2-1 y arranca el bloom.

### Cuenta regresiva

```
            EMPIEZA EN
                3
  Primer paso: vierte 45 g de agua
             a 92 °C
             Cancelar
```

### Paso con tiempo (diseño en Figma, frame 05)

```
─────────────────────────────────────────
  META                ⏱ 0:14        (✕)
  2:40 – 3:00
          ●●○○○○  PASO 2 DE 6
             💧 Bloom

           ╭──────────╮
          │ Vierte hasta│
          │    45 g     │
           ╰──────────╯
          31 s restantes

  PROPÓSITO  Hidrata el café y libera el CO₂
             del tueste. Sienta las bases de una
             extracción pareja y mejora el dulzor.
  ───────────────────────────────────────
  TÉCNICA    Vierte en espiral rápida y gira
             suavemente el dripper 3 veces.
  ───────────────────────────────────────
  DESPUÉS    Primer vertido → 140 g de agua

               [⏸]
─────────────────────────────────────────
```

- La salida (✕) va a la derecha y el tiempo total al centro (D-16).
- "Después" anticipa el siguiente vertido con su meta acumulada; reemplaza a "Siguiente".
- En los últimos 3 s de un paso que avanza solo, "31 s restantes" pasa a "Cambia en 3 s" y el teléfono vibra corto.

### Último paso: lo terminas tú (D-17)

```
─────────────────────────────────────────
  META                ⏱ 2:47        (✕)
          ●●●●●○  PASO 6 DE 6
           ⏳ Decantación
           ╭──────────╮
          │ tiempo total│
          │    2:47     │
           ╰──────────╯
  PROPÓSITO  Deja que el café termine de pasar.
             No interrumpir da más claridad.
  TÉCNICA    No añadas agua. Retira el dripper
             al terminar.
  [⏸]   [        Terminar brew        ]
─────────────────────────────────────────
```

### Fin del brew

```
              ✓ Tu café está listo
                 TIEMPO TOTAL
                     2:52
   ─────────────────────────────────────
     Café        │   Agua      │  Temp.
     15 g        │   240 g     │  92 °C
   [           Evaluar receta           ]
                  Más tarde
```
"Evaluar receta" abre "¿Qué tal esta receta?" (§10).

### Textos de propósito sensorial por paso

| Paso | Ícono | Texto de propósito |
|---|---|---|
| Bloom | 💧 | "Hidrata el café y libera CO₂. Sienta las bases de una extracción pareja y mejora el dulzor." |
| Primer vertido | 🍋 | "Extrae los compuestos más solubles: acidez, notas frutales y el primer dulzor." |
| Segundo vertido | 🍫 | "Desarrolla el cuerpo y el balance. Aquí aparece la profundidad de la taza." |
| Último vertido | ✨ | "Afina la concentración y el final. Determina la limpieza y la duración del retrogusto." |
| Esperar (decantación) | ⏳ | "Permite que el café termine de pasar por el filtro. No interrumpir da mayor claridad." |
| Pre-infusión espresso | 💧 | "Hidratación pareja del puck antes de la presión plena. Reduce canales y mejora uniformidad." |
| Extracción espresso | ⚡ | "La presión convierte la solubilidad del café en una bebida concentrada. El color del flujo indica el estado de la extracción." |

---

## 9. EJEMPLOS COMPLETOS DE BREW MODE

Estas tres recetas son el seed de la fase 2 (`recipes.seed.json`).

### V60 — 15 g / 240 g / 92 °C — Tiempo total: 2:40–3:00

```
PASO 1 — PREPARA                                  [prep]
  Muele 15 g · 18 clicks [tu molino] — media-fina
  Agua a 92 °C
  Enjuaga el filtro, descarta el agua, tara con el V60 encima

PASO 2 — BLOOM                                    [pour]
  Meta: vierte hasta 45 g
  Duración: 40 s
  Técnica: espiral rápida, luego gira suavemente el dripper 3 veces

PASO 3 — PRIMER VERTIDO                           [pour]
  Meta: 140 g · Referencia: 0:45 – 1:10
  Técnica: espiral lenta desde el centro hacia afuera

PASO 4 — SEGUNDO VERTIDO                          [pour]
  Meta: 200 g · Referencia: 1:30 – 1:50
  Técnica: al centro, lento y constante

PASO 5 — VERTIDO FINAL                            [pour]
  Meta: 240 g · Referencia: 2:10 – 2:30
  Técnica: espiral exterior, sin girar el dripper ni remover el café

PASO 6 — DECANTACIÓN                              [wait]
  No tocar. Hasta 3:00 total.
```

### AeroPress — 15 g / 200 g / 88 °C — Tiempo total: 2:00–2:20

```
PASO 1 — PREPARA                                  [prep]
  Muele 15 g · 14 clicks — más fino que V60
  Agua a 88 °C
  Coloca y enjuaga el filtro, arma en posición invertida, tara

PASO 2 — BLOOM RÁPIDO                             [pour]
  Meta: 30 g · Duración: 20 s · Remueve el café con la paleta 5 veces

PASO 3 — VERTIDO PRINCIPAL                        [pour]
  Meta: 200 g · Referencia: 0:30 – 0:50 · Remueve con la paleta 3 veces, en cruz

PASO 4 — ESPERA                                   [wait]
  No remover. Hasta 1:30 en total.

PASO 5 — PRESIONA                                 [press]
  30 s de presión pareja. Detente al primer silbido de aire.
```

### Espresso — 18 g / 36 g / 93 °C — Tiempo total: 27–32 s

```
PASO 1 — PREPARA                                  [prep]
  Muele 18 g · 8 clicks — fino
  Purga la máquina 5 s
  Nota: este punto de partida requiere calibración en tu máquina

PASO 2 — DISTRIBUYE Y TAMPEA                      [prep]
  Distribución pareja (WDT o golpecitos), tamp recto (~15 kg)

PASO 3 — PRE-INFUSIÓN (si tu máquina lo permite)  [extract]
  6–8 s a baja presión

PASO 4 — EXTRACCIÓN                               [extract]
  Meta: 36 g en taza (ratio 1:2) · 27–32 s
  Dorado pálido al final = correcto
  Oscuro muy temprano = molienda muy gruesa
  Goteo muy lento = molienda muy fina
```

---

## 10. EVALUACIÓN Y APRENDIZAJE

### 10.1 La pregunta

Al terminar el brew: **"¿Qué tal esta receta?"**

| Nivel | Copy | Siguiente pantalla |
|---|---|---|
| 1 | No me gustó | "¿Qué notaste?" (síntomas, recomendado) |
| 2 | Le falta algo | "¿Qué notaste?" (síntomas, recomendado) |
| 3 | Quedó bien | "¿Qué le faltó?" (opcional) |
| 4 | Muy rica | "¿Algún detalle?" (opcional, colapsado) |
| 5 | De campeonato ★ | "¿Bloqueamos esta receta?" |

Una sola respuesta es suficiente. Los síntomas son un segundo toque opcional y el texto libre es un tercero.

**Síntomas** (selección múltiple, máximo 2 se usan para el ajuste):

```
[Muy ácido]    [Muy amargo]   [Seco al final]
[Vacío]        [Astringente]  [Plano]
[Muy intenso]  [Falta dulzor] [Falta cuerpo]
```

### 10.2 Tabla de diagnóstico

| Síntoma | Diagnóstico probable | Variable candidata 1 | Variable candidata 2 |
|---|---|---|---|
| Muy ácido | Subextracción | +1 °C | molienda 1 click más fina |
| Muy amargo | Sobreextracción | −1 °C | molienda 1 click más gruesa |
| Seco al final | Sobreextracción en etapa final | sin agitación en el último vertido | −1 °C |
| Vacío | Subextracción o ratio alto | molienda 1 click más fina | −10 g de agua |
| Astringente | Temperatura alta o sobreextracción | −2 °C | molienda 1 click más gruesa |
| Plano | Subextracción o café pasado | bloom +10 s | molienda 1 click más fina |
| Muy intenso | Ratio bajo o molienda fina | +10 g de agua | molienda 1 click más gruesa |
| Falta dulzor | Extracción incompleta | +1 °C | molienda 1 click más fina |
| Falta cuerpo | Poca turbulencia o molienda fina | agitar en el vertido 2 | molienda 1 click más gruesa |

Los pasos (1 °C, 1 click, 10 g) se reducen a la mitad en el nivel 3 "Quedó bien".

### 10.3 Motor de ajuste (determinista, V1)

El sistema aprende de tu historial con el mismo café y método, sin ML:

| Regla | Cuándo | Qué hace |
|---|---|---|
| **R1 · Mejor punto de partida** | Al preparar | Usa la versión bloqueada ⭐ si existe. Si no, la de mejor promedio de calificación. Empate → la más reciente. |
| **R2 · Bloquear** | Nivel 5 | Propone bloquear. Una receta bloqueada no se ajusta sola. |
| **R3 · Pista** | Nivel 4 con síntoma | Guarda el síntoma como pista. Si la misma pista aparece en 2 brews seguidos, propone 1 cambio. |
| **R4 · Ajuste fino** | Nivel 3 con síntoma | Crea Vn+1 con 1 cambio, paso reducido a la mitad. |
| **R5 · Ajuste** | Nivel 1–2 con síntoma | Crea Vn+1 con hasta 2 cambios (candidatas de la tabla, una por síntoma). |
| **R6 · Revertir** | Vn+1 sale peor que Vn | Vuelve a Vn. La próxima propuesta usa la otra variable candidata, no repite la que falló. |
| **R7 · Café envejecido** | Una receta bloqueada recibe ≤ 3 dos veces seguidas | Sugiere desbloquear y muestra los días desde el tueste. |
| **R8 · Sin síntoma** | Nivel 1–3 sin síntoma | No inventa un ajuste. La próxima vez vuelve a preguntar. |

Ejemplo (V60 · El Paraíso Sidra):

```
V1  ★★★  "Quedó bien" · Falta dulzor   → V2: +0,5 °C
V2  ★★   "Le falta algo" · Muy amargo  → empeoró: vuelve a V1 (R6)
                                          V3: molienda ½ click más fina
V3  ★★★★ "Muy rica"
V3  ★★★★★ "De campeonato"              → ⭐ Bloqueada
```

### 10.4 Formato del ajuste en pantalla

```
PARA LA PRÓXIMA TAZA

Reportaste: "Quedó bien" · falta dulzor
Cambio: Temperatura 92 °C → 92,5 °C
Por qué: más temperatura extrae un poco más del café.
Basado en: tus últimas 3 tazas de esta receta

[ Usar V2 la próxima vez ]   [ Mantener V1 ]
```

### 10.5 Historial de versiones por café

```
☕ El Paraíso Sidra · V60

V1  ★★★   Quedó bien · falta dulzor
V2  ★★    Revertida
V3  ★★★★  Muy rica
V3  ⭐    Bloqueada
```

---

## 11. MOTOR DE RECETAS

### Inputs primarios

| Input | Impacto | Fuente |
|---|---|---|
| Nivel de tueste | Muy alto | Ficha del café (👁 o ~) |
| Proceso | Muy alto | Ficha del café |
| Variedad | Alto | Ficha del café |
| Método seleccionado | Determinante | Usuario |
| Objetivo sensorial | Determinante | Usuario |
| Tiempo desde tueste | Alto | Fecha tueste + fecha actual |
| **Tu historial con ese café** | **Determinante si existe** | Brews evaluados (§10.3, R1) |

### Inputs contextuales

| Input | Efecto | Fuente |
|---|---|---|
| Altitud del usuario | Ajuste leve de temperatura | Setup / ubicación |
| Perfil de agua | Ajuste de temperatura y molienda | Setup |
| Molino registrado | Convierte "media-fina" → "16 clicks" | Setup |

### Lógica sensorial → parámetros

| Objetivo | Parámetros que se mueven | Límite |
|---|---|---|
| Más dulzor | +temperatura 1-2 °C, molienda ligeramente más fina | 2 variables |
| Más brillo/acidez | −temperatura 1-2 °C, bloom más corto | 2 variables |
| Más cuerpo | Molienda más gruesa, mayor turbulencia | 2 variables |
| Más claridad | −turbulencia, vertidos más lentos, ratio más alto | 2 variables |
| Más intensidad | Ratio más bajo, molienda más fina | 2 variables |
| Para alguien más (accesible) | Dulzor prioritario, acidez contenida | Perfil completo |

---

## 12. TRAZABILIDAD DE RECETAS — CAMPEONES Y REFERENTES

Toda receta indica su origen. La base de referentes vive en `bloom_seed_champions.json`, curada a mano con fuente por fila (D-12). El LLM nunca agrega ni corrige campeones.

### World Barista Championship (espresso)

| Año | Campeón | País | Sede | Estado |
|---|---|---|---|---|
| 2026 | Pan Wei | China | Ciudad de Panamá | ✓ |
| 2025 | Jack Simpson | Australia | Milán | ✓ |
| 2024 | Mikael Jasin | Indonesia | Busan | ✓ |
| 2023 | Boram Um | Brasil | Atenas | ✓ |
| 2022 | Anthony Douglas | Australia | Melbourne | ✓ |
| 2021 | Diego Campos | Colombia | Milán | ✓ |
| 2019 | Jooyeon Jeon | Corea del Sur | Boston | ✓ |

No hubo campeonato en 2020.

### World Brewers Cup (filtrado manual → referencia para V60)

| Año | Campeón | País | Estado |
|---|---|---|---|
| 2026 | Nas Jaafar | Malasia | ✓ |
| 2025 | George Jinyang Peng | China | ✓ |
| 2024 | Martin Wölfl | Austria | ✓ |
| 2023 | Carlos Medina | Chile | ✓ |
| 2022 | Sherry (Shih Yuan) Hsu | Taiwán | ✓ |
| 2021 | Matt Winton | Suiza | ✓ |
| 2019 | Du Jianing | China | ✓ |
| 2016 | Tetsu Kasuya | Japón | ✓ Referencia histórica: Método 4:6 en V60 |

El dripper que usó cada campeón no se asume: se registra solo cuando se verifica su receta. Hoy la única receta V60 confirmada es la del Método 4:6.

### World AeroPress Championship

| Año | Campeón | País | Receta (dosis · estilo · agua · temp · bypass) | Tipo |
|---|---|---|---|---|
| 2025 | Némo Pop | Australia | 18 g · estándar · 100 g · 84 °C · 70 g a 50 °C | ✓ Publicada por el ganador |
| 2024 | George Stanica | Rumanía | 18 g · invertida · 100 g · 96 °C · hasta 130–135 g + 20–30 g ambiente | ✓ Publicada por el ganador |
| 2023 | Tay Wipvasutt | Tailandia | 18 g (16 + 2) · invertida · 100 g · 89 °C · hasta ~155 g | ✓ Publicada por el ganador |
| 2022 | Jibbi Little | Australia | 18 g · invertida · 94 g · 90 °C · hasta 150 g | ✓ Publicada por el ganador |
| 2021 | Tuomas Merikanto | Finlandia | — | No se carga |
| 2019 | Wendelien van Bunnik | Países Bajos | 30 g · estándar · 100 g · 92 °C · +100–120 g | ✓ Adaptación oficial |

Todo verificado en worldaeropresschampionship.com / aeropress.com (detalle paso a paso en `bloom_seed_champions.json`). En la app, una "adaptación oficial" se muestra como "Adaptada de", no como la receta exacta del campeonato.

### Referentes técnicos

| Referente | Credencial | Relevancia |
|---|---|---|
| James Hoffmann | World Barista Champion 2007 | Metodología V60, fundamentos de extracción |
| Matt Perger | World Brewers Cup Champion 2012 | Barista Hustle, ciencia del brew |
| Scott Rao | Autor técnico | Principios de extracción |
| Peter Giuliano | Specialty Coffee Association | Origen y sensorial |
| Agnieszka Rojewska | World Barista Champion 2018 | Espresso |
| Diego Campos | World Barista Champion 2021 | Espresso; primer campeón de un país productor latinoamericano |

### Formato de trazabilidad en la receta

```
Base: Tetsu Kasuya · Método 4:6 · World Brewers Cup 2016
Adaptación: ratio ajustado a 1:15 para tueste oscuro
Fuente: wcc.coffee
Estado: ✓ Verificada / ~ Adaptada
```

Si la receta viene de tu historial:
```
Base: tu V3 de este café · ⭐ Bloqueada el 14 nov
```

Si no existe referencia aplicable:
```
Base: Regla técnica — perfil de extracción para lavado de alta altitud
Estado: ~ Generada por el sistema
```

---

## 13. INVENTARIO DE CAFÉ

Cada bolsa tiene su propio registro de stock. Cada brew descuenta los gramos usados automáticamente.

```
Antes del brew:   145 g
Receta:            15 g
Después del brew: 130 g ✓
```

### Alertas de inventario (D-09)

| Estado | Regla | Mensaje |
|---|---|---|
| OK | ≥ 50 g | "145 g · ~9 preparaciones" |
| ⚠️ Bajo | < 50 g | "Te queda poco: ~3 preparaciones" |
| 🔴 Crítico | < 2 × dosis de la receta activa | "Alcanza para 1 preparación más" |
| Agotado | < 1 dosis | "No alcanza para otra taza. ¿Lo marcamos como terminado?" |

Sin receta activa, la dosis por defecto es 15 g. Preparaciones restantes = `floor(stock / dosis)`.

### Historial por bolsa

```
El Paraíso Sidra — Bolsa 1  (terminada · 12 brews)
El Paraíso Sidra — Bolsa 2  (activa · 145 g · 3 brews)
```

---

## 14. REGISTRO DE CLIENTES — FUERA DEL MVP

Pasa a V2 (D-04). El objetivo "Para alguien más" sigue disponible y no guarda datos de la persona. Si vuelve en V2, requiere consentimiento explícito y almacenamiento solo local por defecto.

---

## 15. AGREGAR RECETA PROPIA O ENCONTRADA

### Puntos de entrada

- Desde el perfil de un café: "Agregar receta"
- Desde el Flujo 1: "Agregar una receta que vi"

### Campos del formulario

```
AGREGAR RECETA

Nombre / descripción: [___________________________]
Café asociado: [seleccionar de biblioteca o "sin café específico"]
Método: [V60] [AeroPress] [Espresso] [Otro]

Parámetros:
  Café: [__] g    Agua: [__] g    Ratio: 1:[__]
  Temperatura: [__] °C
  Molienda: [__] clicks / [descripción]

Pasos:
  + Agregar paso
    Tipo: [Preparación] [Vertido] [Espera] [Presión] [Extracción]
    Nombre del paso: [_______]
    Meta acumulada: [__] g      (no aplica a Preparación)
    Duración: [__] s            (no aplica a Preparación)
    Propósito: [_______]

Fuente / origen:
  ○ Receta mía (experimento)
  ○ Vi esta receta en: [URL / fuente]
  ○ De un barista: [nombre]
  ○ Competición: [nombre, año]

[Guardar receta]
```

### Clasificación según fuente

| Origen indicado | Estado asignado |
|---|---|
| Receta mía | 👁 Personal |
| URL o fuente verificable | ✓ Verificada (pendiente revisión) |
| Barista conocido | ~ Referenciada |
| Sin fuente | ~ Sin trazabilidad |

---

## 16. COMPARACIÓN ENTRE CAFÉS

Accesible desde Stock → seleccionar 2 → "Comparar".

```
                  El Paraíso Sidra    Ethiopia Yirgacheffe
País              Ecuador             Etiopía
Variedad          Sidra               Heirloom
Proceso           Natural anaeróbico  Lavado
Altitud           2100 msnm           1900 msnm
Nivel de tueste   Medio               Medio-claro
Notas             Lúcuma, durazno     Jazmín, limón

Mi calificación   ★★★★½ (promedio)    ★★★★
Receta activa     V60 · 15 g · 91 °C  V60 · 15 g · 93 °C
```

Insight generado (solo con datos 👁 / ✓ y tus calificaciones):
> "El Sidra es más dulce y frutal. El Yirgacheffe tiene más claridad y acidez floral. Si buscas dulzor, el Sidra. Si buscas brillo y limpieza, el Yirgacheffe."

---

## 17. INVESTIGACIÓN — EXA PRIMERO, PERPLEXITY SEARCH DE RESPALDO

Bing Search API se retiró el 11 de agosto de 2025. Detalle y datos en D-05.

### Estrategia

```
1. Exa (type: fast)
   → resultados crudos con URL y extracto
2. Si Exa falla o no devuelve resultados útiles → Perplexity Search API
3. Claude Haiku 5.5 sintetiza SOLO a partir de los extractos devueltos,
   con URL por afirmación
4. Cada afirmación se clasifica según el dominio de su fuente
```

### Consultas automáticas al escanear (4 por café)

```
1. "[tostador] coffee roaster [país]"                 → web oficial del tostador
2. "[nombre café] [productor] [región] coffee"        → finca o productor
3. "[variedad] coffee flavor profile brewing"         → comportamiento de la variedad
4. "[proceso] coffee brewing temperature"             → recomendaciones del proceso
```

Las recetas de campeones no se buscan: salen del seed curado (§12).

### Clasificación del resultado

| Condición | Estado |
|---|---|
| Dominio del tostador, wcc.coffee, sca.coffee, aeropress.com, Cup of Excellence | ✓ Verificado |
| Publicación especializada (Sprudge, Barista Magazine, Perfect Daily Grind) | ✓ Verificado (con nota) |
| Otra fuente, o síntesis sin URL | ~ Inferido |
| Sin resultado relevante | "No encontrado" — no inventar |

---

## 18. ARQUITECTURA DE INFORMACIÓN

```
BLOOM PWA (Android)
│
├── INICIO (Home)
│   ├── "¿Qué preparamos?" · Tu café habitual → "Preparar ahora" (CTA principal)
│   ├── Stock total · Este mes · Uso por método (V60 / AeroPress)
│   ├── "Tengo un café nuevo" → Flujo 2
│   └── Cafés recientes
│
├── STOCK (biblioteca de cafés, antes "Mis cafés")
│   ├── Todos mis cafés · Filtros (origen, variedad, proceso, calificación)
│   ├── Inventario por café
│   └── Comparar (2 cafés)
│
├── CAFÉ (perfil individual)
│   ├── Resumen (con indicadores 👁 ✓ ~)
│   ├── Origen, Proceso, Tueste, Sensorial
│   ├── Historia / trazabilidad
│   ├── Mis recetas (activa + historial de versiones + recetas propias)
│   ├── Mis brews (con calificación)
│   ├── Inventario (por bolsa)
│   ├── Discurso para quien lo toma (3 niveles)
│   └── Tips internos
│
├── HACER CAFÉ (Flujo 1)
│   ├── Café → Método → Objetivo → Receta
│   └── → Brew Mode
│
├── ESCANEAR (Flujo 2)
│
├── BREW MODE
│   ├── Vista previa · Preparación · Cuenta regresiva · Pasos con tiempo
│   ├── Último paso → "Terminar brew" → "Tu café está listo"
│   └── → "Evaluar receta" → "¿Qué tal esta receta?"
│
├── DIARIO (deshabilitado en V1 — contenido por definir, P-01)
│
└── SETUP
    ├── Molinos (marca, modelo, clicks, calibración)
    ├── Brewers · Kettle · Perfil de agua · Ubicación
    └── Preferencias de Brew Mode (vibración, sonido)
```

---

## 19. NAVEGACIÓN PRINCIPAL

```
[🏠 Inicio]  [☕ Stock]  [▶ Hacer café]  [📓 Diario]  [⚙️ Setup]
```

- **▶ Hacer café** es el CTA central (Flujo 1).
- Brew Mode: pantalla completa, sin bottom nav.
- Flujo de escaneo: modal sobre el Home.
- Diario en V1: visible y deshabilitado. Qué contiene está por definir (P-01). Coffee Lab sigue en el roadmap V2, sin lugar fijo en la navegación.

---

## 20. MÉTODOS SOPORTADOS

| Método | MVP | Notas |
|---|---|---|
| V60 | ✅ | Prep + bloom + 2-3 vertidos + decantación |
| AeroPress / AeroPress Go | ✅ | Invertido o estándar, presión final |
| Espresso | ✅ | Prep + pre-infusión + extracción 1:2 |
| Chemex · Kalita · French Press · Clever · Sifón | 🔜 V2 | |

---

## 21. MODELO CONCEPTUAL DE DATOS

```
Usuario
├── perfil, ubicación
└── Setup
    ├── Molinos[] {marca, modelo, min_clicks, max_clicks, calibracion[]}
    ├── Brewers[] {tipo, tamaño, material, filtro}
    ├── Kettle {temp_control: bool}
    └── PerfilAgua {TDS, GH, KH, pH, tipo}

Café
├── id, nombre, tostador, lote
├── origen {país, región, finca, productor, estación}
├── agricultura {especie, variedad, altitud}
├── proceso {tipo, fermentación, detalles}
├── tueste {fecha, nivel}
├── sensorial {notas_tostador[], mis_notas[]}
├── historia {texto, fuentes[]}
├── confianza_por_campo {campo: observado|verificado|inferido}
├── Bolsas[]
├── Recetas[]
├── Discurso {simple, medio, tecnico}
└── Tips {conservacion, venta, maridaje}

Bolsa
├── café_id, número_bolsa, gramos_iniciales
├── fecha_apertura, estado (activa | terminada)
└── gramos_actuales = gramos_iniciales − Σ brews.gramos_usados (derivado)

Receta (identidad estable: café + método + objetivo)
├── café_id, método, objetivo_sensorial
├── tipo {generada | propia | encontrada}
├── trazabilidad {fuente, tipo, url, año, referente_id}
└── Versiones[]

VersiónDeReceta
├── receta_id, número (1, 2, 3…), versión_padre_id
├── params {gramos_cafe, gramos_agua, ratio, temperatura,
│           molienda_descriptor, molienda_clicks,
│           pasos[{tipo: prep|pour|wait|press|extract, nombre,
│                  meta_acumulada?, duracion_seg?, proposito, tecnica,
│                  tiempo_ref?}],
│           tiempo_total_min, tiempo_total_max}
├── cambios [{variable, antes, después}]   (vs versión padre)
├── razón, basado_en_brews[]
└── estado (activa | bloqueada ⭐ | revertida)

BrewSession
├── café_id, versión_receta_id, bolsa_id
├── fecha, gramos_usados, duración_real_seg
├── calificación (1–5)
├── síntomas[] · notas_libres
└── estado_sync (local | sincronizada)

ReferenteCampeón (seed, solo lectura)
├── competencia (WBC | WBrC | WAC), año, nombre, país, sede
├── receta?, tipo_receta (publicada_por_ganador | adaptacion_oficial)
├── estado (verificado | pendiente_verificacion)
└── fuente_url
```

---

## 22. ARQUITECTURA DE IA

### Qué resuelven reglas deterministas

- Objetivo sensorial → ajuste de parámetros (tabla §11)
- Gramos por vertido y tiempos acumulados (aritmética)
- Ajuste de temperatura por altitud
- Ventana de consumo post-tueste (7–21 días filtrado, 14–30 espresso)
- Diagnóstico y ajuste post-brew (tabla §10.2 + reglas §10.3)
- Inventario (aritmética sobre eventos de brew)
- Clasificación de confianza por dominio de fuente (§17)

### Qué resuelve el LLM (Claude Haiku 5.5, D-06)

- Extracción de datos de la foto de la bolsa
- Narrativa del café, discurso en 3 niveles y tips, **solo** a partir de datos 👁 / ✓ y fuentes con URL
- Redacción natural de la razón de un ajuste (el ajuste lo decide la regla, el LLM solo lo explica)
- Traducción de preferencia humana → objetivo técnico ("quiero algo dulce")
- Insight de comparación entre cafés

### Qué requiere búsqueda web (Exa → Perplexity Search)

- Información del tostador y productor
- Comportamiento conocido de la variedad y el proceso
- Historia, premios y reconocimientos verificables

---

## 23. MVP — ALCANCE POR FASES

El orden es parte del alcance (D-01). Cada fase termina en algo usable.

| Fase | Qué entra | Usable para… |
|---|---|---|
| 1 · Fundaciones | Tokens, componentes del DS, ruta `/ds` | Revisar el sistema visual en el teléfono |
| 2 · Brew Mode offline | 3 recetas seed, vista previa, prep + pasos con tiempo, pausa, retomar, wake lock, vibración, PWA instalable | **Preparar café real todos los días** |
| 3 · Recetas + Setup | Motor de recetas, molino → clicks, cafés manuales, objetivo de taza | Recetas para tus propios cafés |
| 4 · Evaluación y aprendizaje | "¿Qué tal esta receta?", síntomas, motor §10.3, versiones, bloqueo | Que cada taza mejore la siguiente |
| 5 · Backend + inventario | Supabase Auth, sync offline → nube, bolsas y alertas de stock | Datos seguros y en cualquier dispositivo |
| 6 · Escaneo + investigación | Foto → ficha, Exa/Perplexity, sistema de confianza (evals E-01 y E-02 antes) | Agregar cafés nuevos en segundos |
| 7 · Capa narrativa | Discurso, tips, comparación, receta propia / encontrada, trazabilidad con seed de campeones | Contar el café a quien lo toma |

### ❌ Excluido del MVP (V2+)

- Registro de clientes
- iOS y publicación en Play Store
- Coffee Lab (experimentos de variable única, A/B)
- "¿Por qué esta receta?" con niveles
- Personal Taste Engine entre cafés distintos
- Chemex, Kalita, French Press, Clever, Sifón
- Báscula BT

---

## 24. ROADMAP

### V1 — Copiloto que aprende de tus tazas
*Preparar → evaluar → la siguiente sale mejor*
Fases 1–7.

### V2 — Barista que aprende de ti
- Personal Taste Engine (preferencias entre cafés, activo con ≥ 5 evaluaciones)
- Coffee Lab (variable única, A/B)
- "¿Por qué esta receta?" con 3 niveles
- Registro de clientes con consentimiento
- Play Store (Trusted Web Activity) e iOS
- Más métodos

### V3 — Herramienta de competición
- Cupping SCA estructurado
- TDS + extraction yield
- Báscula BT
- Exportar fichas y recetas

---

## 25. RIESGOS

| Riesgo | Probabilidad | Impacto | Solución |
|---|---|---|---|
| El LLM lee mal etiquetas con poca luz o letra pequeña | Media | Alto | Edición manual siempre. Campo no legible = vacío. Reintento con Sonnet 5.5 si falla la validación. Eval E-01. |
| La búsqueda devuelve información incorrecta o nada (cafés poco documentados) | Alta | Muy alto | Clasificación por dominio. "No encontrado" como resultado válido. Eval E-02. |
| El brew automático no se adapta al ritmo del barista | Alta | Medio | Pasos de preparación manuales. Pausa siempre visible. |
| El motor de ajuste "persigue el ruido" (una mala taza por un mal día) | Media | Medio | Revertir si empeora (R6). Pistas que necesitan 2 repeticiones (R3). Nunca más de 2 variables. |
| Inventario desactualizado | Alta | Bajo | Edición manual siempre accesible. Stock derivado de eventos, no sobrescrito. |
| Espresso requiere calibración en la máquina | Alta | Medio | Rango amplio + aviso explícito en pantalla. |
| Campeones mal atribuidos | Baja (con seed) | Muy alto | Seed curado; filas sin confirmar se muestran como ~ (D-12). |

---

## 26. INCONSISTENCIAS RESUELTAS

| Inconsistencia | Solución |
|---|---|
| Brew mode manual con "listo" interrumpía al barista | Automático para pasos con tiempo; "Listo" solo en preparación, cuando las manos aún están libres. |
| Escanear era el flujo principal pero no es el uso diario | Realizar café es Flujo 1. Escanear es Flujo 2 (fase 6). |
| Tabla de campeones con errores | Corregida y movida a un seed curado con fuente por fila. |
| Umbral de stock en tres valores distintos (50 / 100 / 200 g) | Un solo umbral: < 50 g (D-09). |
| "Bloom · Paso 2 de 5" parecía un error | Es correcto: el paso 1 es la preparación (D-10). |
| Evaluación con 9 chips sin escala | Escala de 5 niveles + síntomas opcionales (D-11). |
| Investigación basada en Bing | Exa + Perplexity Search (D-05). |
| Datos de clientes en servidor y en local a la vez | Fuera del MVP (D-04). |

---

## 27. CAMBIOS vs v0.4

- Figma es la fuente visual (D-14). Las pantallas de Home y Brew Mode siguen la sección 7:12 del archivo `bloom`.
- Home: "¿Qué preparamos?" y tiles Stock / Este mes / uso por método. Se quitan los tiles Tueste y Última taza (D-15). Falta mostrar que el sistema aprende (P-04).
- Navegación: Inicio · Stock · Hacer café · Diario · Setup. "Mis cafés" pasa a llamarse Stock. Diario reemplaza a Lab en la barra y su contenido está por definir (P-01).
- Brew Mode: nueva anatomía del paso con tiempo. META a la izquierda, tiempo total al centro, salir a la derecha. Anillo con "Vierte hasta", tiempo restante y lista PROPÓSITO / TÉCNICA / DESPUÉS. Se quitan "acumulado" y "Siguiente" (D-16).
- Último paso: "Terminar brew". Resumen final con "Evaluar receta" y "Más tarde" (D-17).
- Textos: siempre "g", nunca "gr"; "vierte", no "vertir".

### Cambios v0.4 vs v0.3

- Plataforma: PWA para Android; iOS fuera del MVP.
- Orden: Brew Mode offline primero; MVP definido por fases (§23).
- Brew Mode: pasos de preparación con avance manual; ejemplos reescritos (§8–9).
- Evaluación: "¿Qué tal esta receta?" con 5 niveles y motor de ajuste que aprende (§10).
- Campeones: tabla corregida, con estado de verificación (§12).
- Inventario: aviso < 50 g; crítico atado a la dosis (§13).
- Registro de clientes: fuera del MVP (§14).
- Investigación: Exa + Perplexity Search; consultas de 5 a 4 (§17).
- IA: Claude Haiku 5.5 (§22).
- Modelo de datos: versiones de receta como entidad, tipos de paso, calificación 1–5, stock derivado (§21).

---

*Bloom Coffee — Documento estratégico v0.5 · 3 nov 2026*
*Próximo paso: re-alinear la fase 1 a DS v1.2 (prompt 3 del kickoff) y luego la fase 2 (Brew Mode offline) en Claude Code.*
