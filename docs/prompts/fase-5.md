===========================================
CLAUDE CODE — PLAN DE LA FASE 5 (borrador, espera insumos de George)
Proyecto: Bloom · Fase 5 · Backend + sincronización
(v0.1 · 5 nov 2026 · George: "vamos con la fase 5")
===========================================

Hasta ahora todo vive en el teléfono (IndexedDB). La fase 5 sube esos datos a Supabase para que
no se pierdan y se vean en otro dispositivo. **Brew Mode sigue funcionando 100 % sin conexión**:
la nube nunca bloquea una preparación ni muestra "Sin conexión".

Lee antes: `CLAUDE.md`; `docs/SDD.md` §3.6, §4, §7, §8.3, §9.5; tech §3–4; decisiones D-03, P-11, P-25.

## Alcance

### A. Base de datos (Supabase, migraciones SQL con la CLI)
- Tablas de tech §3 + adiciones de SDD §3.6 (P-11): `profiles`, `grinders`, `coffees`, `coffee_bags`,
  `stock_adjustments`, `recipes`, `recipe_versions`, `brew_sessions`, `usage_counters`,
  `champion_refs`, vista `bag_stock` (`security_invoker`).
- Ajuste al modelo real de las fases 3–4: `recipe_versions` con `adjust_meta jsonb`,
  `locked_at`, `engine_version`; `brew_sessions` con `rating`, `symptoms`, `notes`;
  Setup (molino, altitud, vibración) en `profiles`/`grinders`.
- RLS `owner_all` + `force row level security` en toda tabla con `user_id`; FKs compuestas
  `(id, user_id)`; `client_uuid unique` en eventos (brews, ajustes de stock).
- Bucket privado `bag-photos` con políticas por prefijo `auth.uid()/` (lo usa la fase 6).

### B. Cuenta y sesión
- Supabase Auth con `@supabase/ssr` (cookies). Pantalla "Entrar" con el DS (sin frame en Figma).
- Método y si la cuenta es obligatoria: **decisión de George** (ver lista abajo).
- Al entrar por primera vez, todo lo que ya tienes en el teléfono se sube a tu cuenta.

### C. Sincronización (tech §4)
- Cada escritura local (café, bolsa, ajuste, receta/versión, brew, evaluación, Setup) deja una
  operación en `syncQueue` (Dexie, ya existe desde v1) con `clientUuid` y `updatedAt`.
- Se sube al abrir la app, al volver la señal y al terminar un brew: `POST /api/sync`
  (Zod, máx. 100 ops, resultado por op). Upsert por `client_uuid`: reintentar nunca duplica.
- Conflictos de edición: gana el `updated_at` más reciente. Los brews nunca se editan.
- Bajada: al entrar en un dispositivo nuevo, descarga tus datos a IndexedDB.

### D. Seguridad
- `service_role` nunca en el cliente (grep del bundle en CI). Headers (CSP, HSTS, `nosniff`,
  `X-Frame-Options`) en `next.config.ts`. Sin Prisma, Auth.js ni `DATABASE_URL` (D-03).

## Listo cuando (tech §0)
- Brews hechos offline sincronizan sin duplicarse (mismo `clientUuid` 3 veces → 1 fila, el stock
  descuenta una vez).
- Test de RLS (SDD §9.5): B no lee, no edita, no borra ni referencia nada de A (incluida la vista
  `bag_stock` y Storage).
- `npm run check` + e2e en verde; prueba en el teléfono: brew en modo avión → vuelve la señal →
  aparece en la nube sin duplicarse.

## Paquetes (versiones fijadas en SDD §1.1)
`@supabase/supabase-js@2.118.0`, `@supabase/ssr@0.12.7`, `supabase@3.0.0` (CLI, dev).
`@tanstack/react-query` y `@vercel/analytics` se agregan solo si hacen falta.

## Registro
- 5 nov 2026: plan escrito. Docker no está instalado y no hay proyecto de Supabase todavía.
  Espera los insumos de George.
