===========================================
CLAUDE CODE — PROMPT Y REGISTRO DE LA FASE 4
Proyecto: Bloom · Fase 4 · Evaluación y aprendizaje
(v1.0 · 5 nov 2026 · aprobada por George: "Vamos con la siguiente fase … procede directo")
===========================================

Sigue **sin backend**: IndexedDB es la fuente de verdad hasta la fase 5. Corre en paralelo a la
prueba de 7 días de la fase 2 y a la prueba en el teléfono de la fase 3.

Lee antes: `CLAUDE.md`; `docs/SDD.md` §5.3–5.4 y §9.2; `docs/bloom_product.md` §10;
`docs/bloom-design-system.md` §3.25 y §4.4; `docs/bloom_decisions.md` (P-14.1, P-26, P-27, P-28).

## Alcance

### A. Motor de recetas con P-14.1 (entregado por George, reemplaza P-14)
- `src/features/recipes/engine-tables.ts` = archivo de George (sin `PROCESS_TEMP_ADJUST`).
- Un objetivo mueve una variable; hipótesis apagadas (`ENABLE_HYPOTHESIS_RULES = false`);
  ratio en % relativo; `clampTempC` con techo de ebullición a tu altitud (Setup).
- Cada V1 guarda `engineVersion`. Una V1 de P-14 sin evaluar se regenera.
- Copy corregido en product §10.4 y DS §4.4 (sin "extrae más azúcares").

### B. Motor de ajuste R1–R8 (`src/features/evaluation/`)
- `adjust-tables.ts`: DIAGNOSIS (product §10.2), pasos, límites, textos del porqué.
- `brew-adjust.ts`: `bestStart`, `proposeAdjustment`, `materialize`, `applyChanges`, `averageRating`.
- Decisiones de implementación: SDD §5.4 (recuadro v1.3) y P-27.

### C. Datos (`src/lib/evaluation-db.ts`, sin cambio de esquema Dexie)
- `evaluateBrew` guarda calificación, síntomas y nota en el brew y corre el motor; R6 marca la
  versión revertida. `acceptProposal` crea Vn+1. `lockVersion` / `unlockVersion`.
- `nextVersionFor` (R1 para Home), `pendingEvaluation`, `loadRecipeHistory`.

### D. Pantallas
| Ruta | Qué hace |
|---|---|
| `/evaluar?s=` | DS §4.4: calificación (`RatingScale`) → detalle por nivel (síntomas, nota) → ajuste propuesto (`RecipeParams` diff, porqué, "Basado en…") o mensaje (R3/R8/sin opción). Nivel 5 → hoja inversa "¿Bloqueamos esta receta?". R7 → "¿Desbloqueamos la receta?". Precacheada. |
| Brew Mode | "Evaluar receta" del resumen abre `/evaluar`. |
| Home | Banner "Tu último V60 está sin evaluar" (24 h) y hero con la versión de R1. |
| `/cafe?id=` | "Tus recetas": V1 · Quedó bien · 2 tazas / Revertida / ⭐ Bloqueada. |

## Fuera de alcance
Backend y sync (fase 5), Diario (P-01), señal de aprendizaje en Home (P-04), LLM (fase 6+).

## Listo cuando
- Tests que reproducen V1 → V2 revertida → V3 ⭐ (product §10.3): unidad (`brew-adjust.test.ts`),
  IndexedDB (`evaluation-db.test.ts`) y e2e Pixel (`fase-4.spec.ts`). ✅
- Una prueba por fila de DIAGNOSIS y de cada regla R1–R8, límites y molino sin medio paso. ✅
- `npm run check` y e2e en verde; axe sin violaciones en `/evaluar`. ✅
- George prueba en el teléfono y responde P-26, P-27 y P-28.

## Registro
- 5 nov 2026: construida. P-14.1 integrada; motor de ajuste, evaluación, versiones y bloqueo.
  Corrección de paso: preparar una receta base sin pasar antes por el Home dejaba la V2 con
  número 1 y el Home la ocultaba; ahora el seed se carga antes de evaluar, R1 ordena por número
  de versión y `ensureSeed` conserva bloqueo y fecha de las recetas base.
- Falta: prueba en el teléfono; respuestas a P-26, P-27 y P-28.
