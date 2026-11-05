/**
 * Bloom · Tablas de mapeo del motor de recetas — P-14.1
 * Estado: entregada por George el 4 nov 2026 (`recipe-mapping.P-14.1.ts`); reemplaza P-14.
 * Cambios al integrarla en la fase 4: se quitó PROCESS_TEMP_ADJUST (el archivo pedía quitarla en fase 4).
 * Reemplaza a P-14. Fuentes internas: product §9 (seeds), §10.2–10.4, §11, §22; SDD §5.3;
 * bloom_seed_champions.json; auditoría «Bloom_P14_auditoria_evidencia_recetas_v1» (4-nov-2026).
 * Fuentes externas: SOURCES, al final del archivo.
 *
 * PRINCIPIOS
 * 1. Un objetivo mueve UNA variable en la primera taza. R6 (revertir) necesita saber qué variable
 *    falló; con dos cambios simultáneos no hay forma de atribuir el resultado.
 * 2. Cada regla declara su evidencia. La UI solo afirma como hecho lo que es 'mecanica' o 'medida';
 *    lo 'heuristica' se presenta como punto de partida y lo 'hipotesis' solo corre con
 *    ENABLE_HYPOTHESIS_RULES y se etiqueta "Experimento".
 * 3. El ratio se mueve en % relativo, no en unidades: +1 sobre 1:16 es 6 %, +0,5 sobre 1:2 es 25 %.
 * 4. Ratio por método: filtrado = agua de extracción / dosis; espresso = bebida en taza / dosis.
 *    El bypass (dilución posterior, común en recetas WAC) se registra aparte y absorbe los cambios
 *    de ratio cuando existe, porque diluye sin tocar la extracción.
 * 5. La altitud de CULTIVO no mueve la temperatura. La altitud de PREPARACIÓN (setup.altitudeM,
 *    product §11 "Altitud del usuario") pone un techo físico en métodos con hervidor abierto:
 *    en Quito el agua hierve a ~90,5 °C, por debajo del seed V60 (92 °C).
 * 6. Ningún texto promete un resultado sensorial ni da una explicación química no demostrada.
 *
 * MIGRACIÓN DESDE P-14 (rompe compatibilidad a propósito)
 * - OBJECTIVE_DELTAS → OBJECTIVE_RULES (una regla por objetivo y método, con evidencia) + ruleFor().
 * - PREFERENCE_TO_OBJECTIVE: intenso → 'intensidad'; floral → 'claridad'; suave → 'dulce';
 *   sorprendeme → 'equilibrado' (default de SDD §5.3).
 * - COFFEE_ALTITUDE_TEMP_ADJUST: eliminada. Usar clampTempC() con setup.altitudeM.
 * - PROCESS_TEMP_ADJUST: se conserva en 0 para no romper llamadas; quitar en fase 4.
 * - TEMP_LIMITS_C → TEMP_LIMITS_BY_METHOD + techo por ebullición local.
 * - TECHNIQUE_TEXT: eliminada. Ninguna regla de objetivo cambia técnica; la agitación vive en la
 *   tabla de diagnóstico §10.2 (fase 4).
 * - Guardar ENGINE_VERSION en cada RecipeVersion para poder reproducir recetas creadas con P-14.
 * - Copy fuera de este archivo con la misma explicación errónea: product §10.4
 *   ("un poco más de temperatura extrae más azúcares"). Corregir junto con PRIORITY_TEXT.
 */
import type { RoastLevel } from '@/lib/schemas/coffee'
import type { Method } from '@/lib/schemas/recipe-seed'

export const ENGINE_VERSION = 'P-14.1' as const

/** Apagado por defecto. Encenderlo solo en modo experimento; la UI marca esas recetas como "Experimento". */
export const ENABLE_HYPOTHESIS_RULES = false

export type Evidence =
  | 'mecanica' //   aritmética o física verificable (balance de masa, presión atmosférica)
  | 'medida' //     estudio sensorial revisado por pares, en ese mismo método
  | 'heuristica' // práctica profesional consistente o extrapolación razonable, sin ensayo controlado
  | 'hipotesis' //  plausible, no demostrada; solo con ENABLE_HYPOTHESIS_RULES

// ─── Objetivos y preferencias ──────────────────────────────────────────────────────────────────

export type Objective = 'equilibrado' | 'brillante' | 'dulce' | 'cuerpo' | 'claridad' | 'para_alguien_mas'
export type Preference = 'dulce' | 'intenso' | 'floral' | 'suave' | 'sorprendeme'
/**
 * 'intensidad' existe en product §11 ("Más intensidad: ratio más bajo") y P-14 la omitía.
 * Se alcanza por la preferencia 'intenso'. Mostrarla como objetivo visible es decisión de George.
 */
export type TechnicalObjective = Exclude<Objective, 'para_alguien_mas'> | 'intensidad'

export const OBJECTIVES: Objective[] = ['equilibrado', 'brillante', 'dulce', 'cuerpo', 'claridad', 'para_alguien_mas']
export const PREFERENCES: Preference[] = ['dulce', 'intenso', 'floral', 'suave', 'sorprendeme']

export const OBJECTIVE_LABEL: Record<Objective, string> = {
  equilibrado: 'Equilibrado',
  brillante: 'Brillante',
  dulce: 'Dulce',
  cuerpo: 'Con cuerpo',
  claridad: 'Más claridad', // P-14: "Claridad máxima" prometía un resultado absoluto
  para_alguien_mas: 'Para alguien más',
}

export const PREFERENCE_LABEL: Record<Preference, string> = {
  dulce: 'Dulce',
  intenso: 'Intenso',
  floral: 'Floral',
  suave: 'Suave',
  sorprendeme: 'Sorpréndeme',
}

/**
 * Preferencia del invitado → objetivo técnico.
 * - intenso ≠ cuerpo: intensidad es concentración; cuerpo es textura (P-14 los confundía).
 * - floral → claridad, no brillante: las fracciones de menor TDS fueron más florales y frutales
 *   [BATALI_2020_FRACCIONES]; bajar 1 °C no tiene ese respaldo [BATALI_2020_TEMP].
 * - suave → dulce: product §11 "Para alguien más: dulzor prioritario, acidez contenida".
 * - sorprendeme → equilibrado: default de SDD §5.3; P-14 elegía 'dulce' sin razón técnica.
 */
export const PREFERENCE_TO_OBJECTIVE: Record<Preference, TechnicalObjective> = {
  dulce: 'dulce',
  intenso: 'intensidad',
  floral: 'claridad',
  suave: 'dulce',
  sorprendeme: 'equilibrado',
}

// ─── Reglas de objetivo (primera taza) ─────────────────────────────────────────────────────────

export type RuleVariable = 'ratioPct' | 'tempC'

export interface ObjectiveRule {
  /** null = no se mueve nada; se parte de la base y se aprende con la cata (§10.2–10.3). */
  variable: RuleVariable | null
  /** ratioPct: % relativo sobre el ratio base (+ = más agua por gramo). tempC: grados. */
  delta: number
  evidence: Evidence | null
  sources: SourceId[]
  /** Por qué existe la regla. Va a trazabilidad, no a la UI. */
  note: string
}

const KEEP_BASE = (note: string): ObjectiveRule => ({ variable: null, delta: 0, evidence: null, sources: [], note })

export const OBJECTIVE_RULES: Record<TechnicalObjective, Record<Method, ObjectiveRule>> = {
  equilibrado: {
    v60: KEEP_BASE('Receta base + ajuste por tueste.'),
    aeropress: KEEP_BASE('Receta base + ajuste por tueste.'),
    espresso: KEEP_BASE('Receta base + ajuste por tueste.'),
  },

  dulce: {
    v60: {
      variable: 'ratioPct',
      delta: 6, // 1:16 → 1:17 (240 g → 254 g con 15 g)
      evidence: 'medida',
      sources: ['FROST_2020', 'BATALI_2020_FRACCIONES'],
      note:
        'En drip, el dulzor percibido bajó al subir el TDS en los tres tuestes. Más agua por gramo baja el TDS. ' +
        'La dirección está medida; el tamaño del paso (6 %) es decisión de producto. ' +
        'P-14 subía temperatura y afinaba molienda: con ratio fijo eso sube el TDS, la dirección contraria.',
    },
    aeropress: {
      variable: 'ratioPct',
      delta: 6,
      evidence: 'heuristica',
      sources: ['FROST_2020', 'BATALI_2020_FRACCIONES'],
      note: 'Extrapolado de drip; inmersión no se ha ensayado. Con bypass, el agua extra va al bypass.',
    },
    espresso: KEEP_BASE(
      'Sin evidencia para una primera taza. Se parte de la base y se ajusta con §10.2 (síntoma "Falta dulzor").',
    ),
  },

  brillante: {
    v60: {
      variable: 'tempC',
      delta: -1,
      evidence: 'hipotesis',
      sources: ['BATALI_2020_TEMP'],
      note:
        'A TDS y extracción fijos, 87–93 °C no cambió el perfil sensorial en drip. −1 °C queda como experimento. ' +
        'P-14 también acortaba el bloom 5 s: segunda variable sin respaldo, eliminada.',
    },
    aeropress: {
      variable: 'tempC',
      delta: -1,
      evidence: 'hipotesis',
      sources: ['BATALI_2020_TEMP'],
      note: 'Igual que V60. El seed AeroPress sí tiene bloom (20 s), pero acortarlo no tiene respaldo.',
    },
    espresso: {
      variable: 'tempC',
      delta: -1,
      evidence: 'hipotesis',
      sources: ['ANDUEZA_2003'],
      note: 'La temperatura cambia la composición del espresso; "−1 °C = más brillo" no está medido.',
    },
  },

  cuerpo: {
    v60: {
      variable: 'ratioPct',
      delta: -6,
      evidence: 'hipotesis',
      sources: [],
      note:
        'Concentrar sube el TDS; que eso se perciba como textura no está medido. ' +
        'P-14 movía molienda gruesa + agitación: dos variables con efectos cruzados sobre la extracción.',
    },
    aeropress: {
      variable: 'ratioPct',
      delta: -6,
      evidence: 'hipotesis',
      sources: [],
      note: 'Igual que V60. Con bypass, se reduce el bypass.',
    },
    espresso: {
      variable: 'ratioPct',
      delta: -10, // 1:2 → 1:1,8 (36 g → 32,4 g en taza)
      evidence: 'heuristica',
      sources: ['CAMERON_2020'],
      note:
        'Shot más corto = más concentración por balance de masa; práctica habitual (ristretto). ' +
        'P-14 molía más grueso: con dosis y salida fijas eso baja extracción y concentración, ' +
        'probablemente la dirección contraria. Además la molienda en espresso no es lineal [CAMERON_2020].',
    },
  },

  claridad: {
    v60: {
      variable: 'ratioPct',
      delta: 6,
      evidence: 'heuristica',
      sources: ['BATALI_2020_FRACCIONES'],
      note:
        'Las fracciones de menor TDS fueron más dulces, frutales y florales, y menos amargas. ' +
        '"Claridad" no fue un atributo medido, por eso es heurística. Converge con "dulce" en filtrado: es lo que dice la evidencia.',
    },
    aeropress: {
      variable: 'ratioPct',
      delta: 6,
      evidence: 'heuristica',
      sources: ['BATALI_2020_FRACCIONES'],
      note: 'Extrapolado de drip. Con bypass, el agua extra va al bypass.',
    },
    espresso: {
      variable: 'ratioPct',
      delta: 10, // 1:2 → 1:2,2. P-14 subía a 1:2,5 (+25 %)
      evidence: 'hipotesis',
      sources: [],
      note: 'Shot más largo baja la concentración; su efecto en "claridad" no está medido.',
    },
  },

  intensidad: {
    v60: {
      variable: 'ratioPct',
      delta: -6,
      evidence: 'mecanica',
      sources: ['COTTER_2021'],
      note: 'TDS = extracción × dosis / bebida: menos agua por gramo concentra la taza. Si gusta más lo decide la cata.',
    },
    aeropress: {
      variable: 'ratioPct',
      delta: -6,
      evidence: 'mecanica',
      sources: ['COTTER_2021'],
      note: 'Igual que V60. Con bypass, se reduce el bypass.',
    },
    espresso: {
      variable: 'ratioPct',
      delta: -10,
      evidence: 'mecanica',
      sources: [],
      note: 'Menos bebida en taza con la misma dosis = más concentración.',
    },
  },
}

/** Regla efectiva: las hipótesis solo corren con ENABLE_HYPOTHESIS_RULES. */
export function ruleFor(
  objective: TechnicalObjective,
  method: Method,
  enableHypotheses: boolean = ENABLE_HYPOTHESIS_RULES,
): ObjectiveRule {
  const rule = OBJECTIVE_RULES[objective][method]
  if (rule.evidence === 'hipotesis' && !enableHypotheses) {
    return KEEP_BASE(`Hipótesis desactivada: ${rule.note}`)
  }
  return rule
}

// ─── Contexto del café ─────────────────────────────────────────────────────────────────────────

/**
 * Tueste → °C. Heurística: tuestes claros se suelen preparar más calientes y oscuros más fríos
 * (rangos WAC en bloom_seed_champions.json: 84–96 °C). No es una ley de 1 °C por nivel.
 * La auditoría proponía llevarla a 0; se mantiene porque es la única diferenciación de primera taza
 * por café que tiene práctica consistente detrás, y la cata la corrige (R5–R6).
 */
export const ROAST_TEMP_ADJUST: Record<RoastLevel, number> = { claro: 1, medio: 0, medio_oscuro: -1, oscuro: -2 }
export const ROAST_TEMP_EVIDENCE: Evidence = 'heuristica'

// ─── Temperatura: límites por método y techo por altitud de preparación ───────────────────────

/** Guardrails, no recomendaciones. Seeds de product §9: V60 92, AeroPress 88, espresso 93. */
export const TEMP_LIMITS_BY_METHOD: Record<Method, [number, number]> = {
  v60: [85, 96], //       centro SCA filtrado 94 ± 2 °C en contacto [SCA_2018]
  aeropress: [80, 96], // recetas WAC 84–96 °C; instrucción clásica 80 °C [WAC_SEEDS]
  espresso: [88, 96], //  rango ensayado en [ANDUEZA_2003]
}

/** Hervidor abierto = la ebullición local es el techo. La caldera de espresso está presurizada. */
export const OPEN_KETTLE: Record<Method, boolean> = { v60: true, aeropress: true, espresso: false }

/**
 * Punto de ebullición del agua (°C) a una altitud (m). Atmósfera estándar + ecuación de Antoine.
 * Es una estimación: el clima mueve la presión ±1 hPa-decenas. Guayaquil ~100, Cuenca ~91,5, Quito ~90,5.
 * null si no se conoce la altitud: no se infiere.
 */
export function localBoilingPointC(altitudeM: number | null | undefined): number | null {
  if (altitudeM == null || !Number.isFinite(altitudeM)) return null
  const h = Math.max(0, altitudeM)
  const pressurePa = 101325 * Math.pow(1 - 2.25577e-5 * h, 5.25588)
  const mmHg = pressurePa / 133.322
  const t = 1730.63 / (8.07131 - Math.log10(mmHg)) - 233.426
  return Math.round(t * 10) / 10
}

export interface ClampedTemp {
  tempC: number
  cappedBy: 'metodo_min' | 'metodo_max' | 'ebullicion' | null
  /** Texto para la UI cuando el techo físico recorta la receta. */
  warning: string | null
}

/** Aplica límites del método y, en hervidor abierto, el techo de ebullición local (redondeado a 0,5 hacia abajo). */
export function clampTempC(targetC: number, method: Method, prepAltitudeM: number | null | undefined): ClampedTemp {
  const [min, max] = TEMP_LIMITS_BY_METHOD[method]
  const boiling = OPEN_KETTLE[method] ? localBoilingPointC(prepAltitudeM) : null
  const ceiling = boiling == null ? max : Math.min(max, Math.floor(boiling * 2) / 2)

  if (targetC > ceiling) {
    const byBoiling = boiling != null && ceiling < max
    return {
      tempC: ceiling,
      cappedBy: byBoiling ? 'ebullicion' : 'metodo_max',
      warning: byBoiling
        ? `A tu altitud el agua hierve a ~${fmt(boiling)} °C. La receta pedía ${fmt(targetC)} °C; usamos ${fmt(ceiling)} °C.`
        : null,
    }
  }
  if (targetC < min) return { tempC: min, cappedBy: 'metodo_min', warning: null }
  return { tempC: targetC, cappedBy: null, warning: null }
}

const fmt = (n: number) => n.toLocaleString('es-EC', { maximumFractionDigits: 1 })

// ─── Ratio por método ──────────────────────────────────────────────────────────────────────────

/** Qué divide cada método. El bypass nunca entra en 'agua_extraccion'. */
export const RATIO_DEFINITION: Record<Method, 'agua_extraccion_sobre_dosis' | 'bebida_en_taza_sobre_dosis'> = {
  v60: 'agua_extraccion_sobre_dosis', //      240 / 15 = 16
  aeropress: 'agua_extraccion_sobre_dosis', // 200 / 15 = 13,3 (seed sin bypass)
  espresso: 'bebida_en_taza_sobre_dosis', //  36 / 18 = 2
}

// ─── Frescura ──────────────────────────────────────────────────────────────────────────────────

/**
 * Días desde el tueste. Ventana ORIENTATIVA (heurística): nunca bloquea un café ni dice "caducó".
 * Estados de UI: 'reposo' | 'en_ventana' | 'fuera_de_ventana' (SDD usaba 'ideal' | 'pasada').
 */
export const ROAST_WINDOW_DAYS: Record<'filtrado' | 'espresso', [number, number]> = {
  filtrado: [7, 21],
  espresso: [14, 30],
}
export type RoastWindowState = 'reposo' | 'en_ventana' | 'fuera_de_ventana'

// ─── Textos "Esta receta prioriza…" (plantilla, no LLM) ───────────────────────────────────────

/** Se usa cuando la regla efectiva mueve una variable. */
export const PRIORITY_TEXT: Record<TechnicalObjective, string> = {
  equilibrado: 'Partimos de la receta base, ajustada solo al tueste de tu café.',
  dulce: 'Usamos un poco más de agua por gramo. En filtrado, las tazas menos concentradas suelen percibirse más dulces. Tu cata lo confirma.',
  brillante: 'Probamos 1 °C menos para buscar una acidez viva sin que la taza quede agria. Es un experimento: tu cata decide.',
  cuerpo: 'Concentramos un poco la taza para buscar más textura. Si queda pesada o amarga, lo revertimos.',
  claridad: 'Usamos un poco más de agua por gramo para separar mejor las notas. Si queda aguada, lo revertimos.',
  intensidad: 'Usamos menos agua por gramo: la taza sale más concentrada.',
}

/** Se usa cuando la regla efectiva es KEEP_BASE para un objetivo distinto de 'equilibrado'. */
export const PRIORITY_TEXT_NO_CHANGE =
  'Partimos de la receta base. Para este objetivo con este método no hay un ajuste con respaldo; lo afinamos con tu primera cata.'

// ─── Fuentes ───────────────────────────────────────────────────────────────────────────────────

export const SOURCES = {
  FROST_2020: {
    cita: 'Frost, Ristenpart & Guinard (2020). Effects of brew strength, brew yield, and roast on the sensory quality of drip brewed coffee. J Food Sci.',
    url: 'https://doi.org/10.1111/1750-3841.15326',
    aporta: 'El dulzor percibido se correlacionó inversamente con el TDS en los tres tuestes.',
    limite: 'Solo drip.',
  },
  BATALI_2020_FRACCIONES: {
    cita: 'Batali, Frost, Lebrilla, Ristenpart & Guinard (2020). Sensory and monosaccharide analysis of drip brew coffee fractions versus brewing time. J Sci Food Agric 100(7):2953–2962.',
    url: 'https://doi.org/10.1002/jsfa.10323',
    aporta: 'Dulzor percibido negativo con TDS; el dulzor se explica por enmascaramiento y aromas, no por azúcares extraídos.',
    limite: 'Solo drip; "claridad" no es un atributo del panel.',
  },
  BATALI_2020_TEMP: {
    cita: 'Batali, Ristenpart & Guinard (2020). Brew temperature, at fixed brew strength and extraction, has little impact on the sensory profile of drip brew coffee. Sci Rep 10:16450.',
    url: 'https://doi.org/10.1038/s41598-020-73341-4',
    aporta: 'Con TDS y extracción fijos, 87/90/93 °C no cambió el perfil de forma apreciable.',
    limite: 'Con receta fija, la temperatura sí cambia la extracción.',
  },
  COTTER_2021: {
    cita: 'Cotter, Batali, Ristenpart & Guinard (2021). Consumer preferences for black coffee are spread over a wide range of brew strengths and extraction yields. J Food Sci.',
    url: 'https://doi.org/10.1111/1750-3841.15561',
    aporta: 'No hay una taza ideal única: las preferencias se reparten en un rango amplio de TDS y extracción.',
    limite: 'Solo drip.',
  },
  CAMERON_2020: {
    cita: 'Cameron et al. (2020). Systematically improving espresso. Matter 2(3):631–648.',
    url: 'https://doi.org/10.1016/j.matt.2019.12.019',
    aporta: 'La extracción en espresso no es monótona con la finura: moler más fino puede extraer menos por canalización.',
    limite: 'No mide atributos sensoriales.',
  },
  ANDUEZA_2003: {
    cita: 'Andueza et al. (2003). Influence of extraction temperature on the final quality of espresso coffee. J Sci Food Agric.',
    url: 'https://doi.org/10.1002/jsfa.1304',
    aporta: 'La temperatura cambia composición y calidad del espresso dentro del rango ensayado.',
    limite: 'No valida "−1 °C = más brillo".',
  },
  SCA_2018: {
    cita: 'Specialty Coffee Association. Protocols & Best Practices — Brewing.',
    url: 'https://sca.coffee/research/protocols-best-practices',
    aporta: 'Filtrado: 55 g/L ± 10 %, 94 ± 2 °C en el punto de contacto.',
    limite: 'Punto de partida para filtrado; no aplica a espresso.',
  },
  WAC_SEEDS: {
    cita: 'bloom_seed_champions.json — recetas WAC 2019–2025 con fuente por fila.',
    url: 'https://worldaeropresschampionship.com',
    aporta: 'Recetas campeonas entre 84 y 96 °C; varias usan bypass; solo una usa bloom.',
    limite: 'Recetas individuales, no ensayos.',
  },
} as const

export type SourceId = keyof typeof SOURCES
