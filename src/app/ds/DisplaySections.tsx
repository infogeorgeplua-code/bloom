'use client'

import { useEffect, useState } from 'react'
import { Bean, Citrus, Droplet, Hourglass, Package, Settings2, Sparkles, Thermometer } from 'lucide-react'
import {
  Banner,
  BottomNav,
  BottomSheet,
  BrewSummarySheet,
  Button,
  CoffeeHero,
  DataPill,
  IconButton,
  InfoList,
  ListRow,
  MethodIllustration,
  Orb,
  ProgressDots,
  RecipeParams,
  SourceCard,
  StatRow,
  StepTimeline,
  StockMeter,
  Tile,
  TimerRing,
  TopBar,
  TrustBadge,
  type NavKey,
} from '@/components'
import { formatClicks, formatGrams, formatRange, formatRatio, formatTemp } from '@/lib/format'
import { Section, State } from './primitives'

const NAV_KEYS: NavKey[] = ['home', 'stock', 'make', 'setup']

const PARAMS = [
  { label: 'Café', value: formatGrams(15) },
  { label: 'Agua', value: formatGrams(240) },
  { label: 'Ratio', value: formatRatio(240, 15) },
  { label: 'Temperatura', value: formatTemp(92) },
  { label: 'Molienda', value: formatClicks(18) },
]

const HERO_PARAMS = [
  { value: '15', unit: 'g', label: 'Café' },
  { value: '240', unit: 'g', label: 'Agua' },
  { value: '92', unit: '°C', label: 'Temp.' },
  { value: '1:16', label: 'Ratio' },
]

const thumb = <Package size={24} strokeWidth={1.5} aria-hidden="true" />

export function HomeSections() {
  return (
    <>
      <Section name="CoffeeHero" note="Tarjeta 'Tu café habitual' (Figma 01 · 16:1016). Eyebrow en 11 px (Figma: 8,8 px).">
        <State label="Con receta bloqueada">
          <CoffeeHero name="El Paraíso Sidra" method="v60" subtitle="V60 · Receta V3" locked params={HERO_PARAMS} />
        </State>
        <State label="Sin bloquear · método sin ilustración todavía (P-08)">
          <CoffeeHero
            name="Etiopía Yirgacheffe"
            method="aeropress"
            subtitle="AeroPress · Receta V1"
            params={[
              { value: '15', unit: 'g', label: 'Café' },
              { value: '200', unit: 'g', label: 'Agua' },
              { value: '88', unit: '°C', label: 'Temp.' },
              { value: '1:13,3', label: 'Ratio' },
            ]}
          />
        </State>
        <State label="Vacío (sin café habitual)">
          <CoffeeHero empty />
        </State>
      </Section>

      <Section name="MethodIllustration" note="Dibujo lineal, 126 × 94, decorativo. V60 exportado de Figma; AeroPress y Espresso pendientes (P-08).">
        <State label="V60 · AeroPress · Espresso" row>
          <MethodIllustration method="v60" />
          <MethodIllustration method="aeropress" />
          <MethodIllustration method="espresso" />
        </State>
      </Section>
    </>
  )
}

export function SurfaceSections() {
  return (
    <>
      <Section name="Tile" note="Variantes de contenido de Home: meter · orb · bar. Grilla de 2 columnas, gap 12.">
        <State label="meter (Stock) · orb (Este mes)">
          <div className="grid grid-cols-2 gap-3">
            <Tile content="meter" label="Stock" value="145" unit="g" caption="5 cafés en stock" level="ok" fill={6} />
            <Tile content="orb" label="Este mes" value="20" caption="cafés" />
          </div>
        </State>
        <State label="bar (uso por método) · relleno en --text-1, no crema (P-03)">
          <div className="grid grid-cols-2 gap-3">
            <Tile content="bar" label="V60" value="12" unit="brews" share={0.6} caption="60% del mes" />
            <Tile content="bar" label="AeroPress" value="5" unit="brews" share={0.25} caption="25% del mes" />
          </div>
        </State>
        <State label="meter · alert warning (algún café bajo) · alert danger">
          <div className="grid grid-cols-2 gap-3">
            <Tile
              content="meter"
              variant="alert"
              tone="warning"
              label="Stock"
              value="62"
              unit="g"
              caption="Etiopía Yirgacheffe: te queda poco"
              level="low"
              fill={3}
            />
            <Tile
              content="meter"
              variant="alert"
              tone="danger"
              label="Stock"
              value="22"
              unit="g"
              caption="Alcanza para 1 preparación más"
              level="critical"
              fill={1}
            />
          </div>
        </State>
        <State label="basic · static con ícono e interactive (pressed → surface-3)">
          <div className="grid grid-cols-2 gap-3">
            <Tile
              label="Temperatura"
              value="92"
              unit="°C"
              visual={<Thermometer size={40} strokeWidth={1.5} className="text-fg-2" aria-hidden="true" />}
            />
            <Tile variant="interactive" label="Brews" value="9" onClick={() => {}} />
          </div>
        </State>
        <State label="2x1">
          <Tile aspect="2x1" label="Mejor receta" value="V3" unit="de campeonato" />
        </State>
      </Section>

      <Section name="Orb" note="Máximo un orb sólido por vista; si hay dos datos héroe, el segundo es outline.">
        <State label="Sólido · sm 96, md 160" row>
          <Orb size="sm" label="Brews" value="9" />
          <Orb size="md" label="Stock" value="145" caption="g" />
        </State>
        <State label="Sólido lg 220">
          <Orb size="lg" label="Tiempo" value="2:52" caption="En tiempo" />
        </State>
        <State label="Outline · tile 115 (Este mes), sm y con ícono (estado vacío)" row>
          <Orb variant="outline" size="tile" value="20" caption="cafés" />
          <Orb variant="outline" size="sm" label="Ratio" value="1:16" />
          <Orb variant="outline" size="sm" icon={Package} />
        </State>
        <State label="Action (CTA central)" row>
          <Orb variant="action" size="sm" aria-label="Hacer café" />
          <Orb variant="action" size="md" aria-label="Hacer café" />
        </State>
      </Section>

      <Section name="DataPill" note="Dato con estado en una píldora de 88 px.">
        <DataPill label="Tueste" value="12 días" status="En ventana ideal" />
        <DataPill label="Stock" value={formatGrams(145)} status="~9 preparaciones" />
      </Section>

      <Section name="Banner" note="Alertas inline con borde izquierdo semántico.">
        <Banner tone="neutral">Sin conexión. Puedes preparar café igual.</Banner>
        <Banner tone="warning">Este punto de partida requiere calibración en tu máquina.</Banner>
        <Banner tone="danger">No alcanza para otra taza.</Banner>
        <Banner tone="success">Receta guardada.</Banner>
        <Banner
          tone="warning"
          action={
            <Button variant="tertiary" size="md">
              Agregar
            </Button>
          }
        >
          No encontramos información del productor. Puedes agregarla tú.
        </Banner>
      </Section>
    </>
  )
}

export function NavigationSections() {
  const [defaultOpen, setDefaultOpen] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)

  return (
    <>
      <Section name="TopBar" note="v1.2: home · flow · brew, más la barra simple de vista previa y preparación.">
        <State label="home (Figma 01): wordmark (placeholder, P-08), fecha, Setup, hairline">
          <TopBar variant="home" dateText="Lunes · 2 nov" />
        </State>
        <State label="flow: back + ProgressDots + 'Paso 1 de 4'">
          <TopBar variant="flow" onBack={() => {}} current={1} total={4} />
        </State>
        <State label="brew (Figma 05): META a la izquierda, tiempo total al centro, ✕ a la derecha">
          <TopBar variant="brew" windowText={formatRange(160, 180)} elapsedText="0:14" onExit={() => {}} />
        </State>
        <State label="Vista previa (Figma 02): back y método">
          <TopBar onBack={() => {}} meta="V60" />
        </State>
        <State label="Preparación (Figma 03): ✕ a la izquierda">
          <TopBar onClose={() => {}} />
        </State>
        <State label="Con título y acción">
          <TopBar onBack={() => {}} title="Receta" action={<IconButton label="Ajustes" icon={Settings2} variant="ghost" />} />
        </State>
      </Section>

      <Section name="BottomNav" note="Inicio · Stock · Hacer café · Diario · Setup. Diario deshabilitado (P-01).">
        {NAV_KEYS.map((k) => (
          <State key={k} label={`Activo: ${k}`}>
            <BottomNav active={k} />
          </State>
        ))}
        <State label="Fase 2: Stock y Setup deshabilitados hasta su fase">
          <BottomNav active="home" disabled={['stock', 'setup']} />
        </State>
      </Section>

      <Section
        name="BottomSheet"
        note="Se cierra con Esc, tocando fuera o arrastrando el handle. Atrás de Android: fase 2."
      >
        <State label="default (formularios cortos)" row>
          <Button variant="secondary" onClick={() => setDefaultOpen(true)}>
            Abrir sheet default
          </Button>
        </State>
        <State label="default · confirmación (Figma 10, ¿Salir del brew?)" row>
          <Button variant="secondary" onClick={() => setExitOpen(true)}>
            Abrir ¿Salir del brew?
          </Button>
        </State>
        <BottomSheet
          open={defaultOpen}
          onOpenChange={setDefaultOpen}
          title="¿Qué le gusta?"
          description="Elige una preferencia. No guardamos datos de la persona."
        >
          <Button fullWidth onClick={() => setDefaultOpen(false)}>
            Listo
          </Button>
        </BottomSheet>
        <BottomSheet
          open={exitOpen}
          onOpenChange={setExitOpen}
          title="¿Salir del brew?"
          description="Perderás el progreso de esta preparación."
        >
          <Button fullWidth onClick={() => setExitOpen(false)}>
            Seguir preparando
          </Button>
          <Button variant="danger" fullWidth onClick={() => setExitOpen(false)}>
            Salir
          </Button>
        </BottomSheet>
      </Section>

      <Section
        name="BrewSummarySheet"
        note="Figma 09. Variante inverse: solo se cierra con sus botones. 'Evaluar receta' se activa en la fase 4."
      >
        <State label="Abrir el resumen" row>
          <Button variant="secondary" onClick={() => setSummaryOpen(true)}>
            Abrir resumen del brew
          </Button>
        </State>
        <BrewSummarySheet
          open={summaryOpen}
          totalText="2:52"
          coffeeG="15"
          waterG="240"
          tempC="92"
          onEvaluate={() => setSummaryOpen(false)}
          onLater={() => setSummaryOpen(false)}
        />
      </Section>
    </>
  )
}

export function ListSections() {
  return (
    <>
      <Section name="ListRow" note="v1.2: solo el proceso, gramos a la derecha, sin StockMeter. Stock bajo: color + ícono.">
        <State label="Normal">
          <div>
            <ListRow thumb={thumb} title="El Paraíso Sidra" subtitle="Natural anaeróbico" grams="145" onClick={() => {}} />
            <ListRow thumb={thumb} title="Etiopía Yirgacheffe" subtitle="Lavado" grams="42" low onClick={() => {}} />
          </div>
        </State>
        <State label="Sin acción ni stock">
          <ListRow thumb={thumb} title="V60 · Receta seed" subtitle="Lavado" />
        </State>
      </Section>

      <Section name="StockMeter" note="Siempre con valor numérico y '~N preparaciones'. Estados de D-09.">
        <State label="Perfil · ok (≥ 50 g)">
          <StockMeter level="ok" gramsText={formatGrams(145)} preparations={9} fill={6} />
        </State>
        <State label="Perfil · bajo (< 50 g)">
          <StockMeter level="low" gramsText={formatGrams(42)} preparations={2} fill={2} />
        </State>
        <State label="Perfil · crítico (< 2 dosis)">
          <StockMeter level="critical" gramsText={formatGrams(22)} preparations={1} fill={1} />
        </State>
        <State label="Perfil · agotado (< 1 dosis, con acción)">
          <StockMeter level="depleted" gramsText={formatGrams(9)} preparations={0} fill={0} onMarkFinished={() => {}} />
        </State>
        <State label="Compacto · ok, bajo, crítico, agotado">
          <div className="flex flex-col gap-3">
            <StockMeter size="compact" level="ok" gramsText={formatGrams(145)} preparations={9} fill={6} />
            <StockMeter size="compact" level="low" gramsText={formatGrams(42)} preparations={2} fill={2} />
            <StockMeter size="compact" level="critical" gramsText={formatGrams(22)} preparations={1} fill={1} />
            <StockMeter size="compact" level="depleted" gramsText={formatGrams(9)} preparations={0} fill={0} />
          </div>
        </State>
      </Section>
    </>
  )
}

export function TrustSections() {
  return (
    <>
      <Section name="TrustBadge" note="El estado nunca se comunica solo con color. Inferido lleva borde punteado.">
        <State label="Completo" row>
          <TrustBadge status="observado" />
          <TrustBadge status="verificado" />
          <TrustBadge status="inferido" />
        </State>
        <State label="Inline con tooltip al tocar" row>
          <span className="t-body flex items-center gap-1 text-fg">
            Natural <TrustBadge status="observado" inline />
          </span>
          <span className="t-body flex items-center gap-1 text-fg">
            Sidra <TrustBadge status="verificado" inline />
          </span>
          <span className="t-body flex items-center gap-1 text-fg">
            Tueste medio <TrustBadge status="inferido" inline />
          </span>
        </State>
      </Section>

      <Section name="SourceCard" note="Trazabilidad de receta. Datos de ejemplo.">
        <State label="Verificada">
          <SourceCard
            name="Tetsu Kasuya · Método 4:6"
            context="World Brewers Cup 2016"
            adaptation="Adaptación: ratio 1:15 para tueste oscuro"
            href="https://wcc.coffee"
            linkText="wcc.coffee"
            status="verificado"
          />
        </State>
        <State label="Adaptada / inferida">
          <SourceCard name="Regla técnica · lavado de alta altitud" context="Perfil de extracción generado por el sistema" status="inferido" />
        </State>
        <State label="Historial (receta bloqueada)">
          <SourceCard history name="Tu V3 de este café" context="Bloqueada el 14 nov" />
        </State>
      </Section>

      <Section name="RecipeParams" note="Número a la izquierda en num-md, descripción a la derecha.">
        <State label="Lista">
          <RecipeParams rows={PARAMS} />
        </State>
        <State label="Con TrustBadge inline">
          <RecipeParams
            rows={[
              { label: 'Café', value: formatGrams(15), trust: 'observado' },
              { label: 'Temperatura', value: formatTemp(92), trust: 'inferido' },
              { label: 'Molienda', value: formatClicks(18), trust: 'verificado' },
            ]}
          />
        </State>
        <State label="Diff (ajuste propuesto: antes tachado, después resaltado)">
          <RecipeParams
            variant="diff"
            rows={[
              { label: 'Temperatura', value: formatTemp(92.5), before: formatTemp(92) },
              { label: 'Molienda', value: formatClicks(17.5), before: formatClicks(18) },
            ]}
          />
        </State>
        <State label="En fila">
          <RecipeParams
            variant="row"
            rows={[
              { label: 'Café', value: formatGrams(15) },
              { label: 'Agua', value: formatGrams(240) },
              { label: 'Temperatura', value: formatTemp(92) },
              { label: 'Ratio', value: formatRatio(240, 15) },
            ]}
          />
        </State>
      </Section>
    </>
  )
}

const BLOOM_INFO = [
  {
    label: 'Propósito',
    value: 'Este paso hidrata el café y libera el CO₂ del tueste. Sienta las bases de una extracción pareja y mejora el dulzor.',
    emphasis: 'primary' as const,
  },
  { label: 'Técnica', value: 'Vierte en espiral rápida y gira suavemente el dripper 3 veces.' },
  { label: 'Después', value: 'Primer vertido → 140 g de agua' },
]

export function BrewSections() {
  const [elapsed, setElapsed] = useState(0)

  // Demo en vivo: el reloj sale de timestamps (performance.now), no de un contador acumulado
  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const loop = () => {
      setElapsed((performance.now() - start) % 20000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const remainingS = Math.ceil((20000 - elapsed) / 1000)

  return (
    <>
      <Section name="StepTimeline" note="Vista previa (Figma 02 · StepRow): filas de 56 px con divisor. Sin barra vertical ni número (P-22).">
        <StepTimeline
          steps={[
            { id: 'a', kind: 'prep', name: 'Prepara' },
            { id: 'b', kind: 'timed', name: 'Bloom', icon: Droplet, goal: '45', windowText: formatRange(0, 40) },
            { id: 'c', kind: 'timed', name: 'Primer vertido', icon: Citrus, goal: '140', windowText: formatRange(45, 70) },
            { id: 'd', kind: 'timed', name: 'Segundo vertido', icon: Bean, goal: '200', windowText: formatRange(90, 110) },
            { id: 'e', kind: 'timed', name: 'Vertido final', icon: Sparkles, goal: '240', windowText: formatRange(130, 150) },
            { id: 'f', kind: 'timed', name: 'Decantación', icon: Hourglass, windowText: formatRange(160, 180) },
          ]}
        />
      </Section>

      <Section name="ProgressDots" note="Cuenta todos los pasos. Inicio en preparación; centrado con el tiempo corriendo.">
        <State label="Alineado a la izquierda (preparación)">
          {[1, 2, 3].map((n) => (
            <ProgressDots key={n} total={6} current={n} />
          ))}
        </State>
        <State label="Centrado (Brew Mode con tiempo)">
          {[4, 5, 6].map((n) => (
            <ProgressDots key={n} total={6} current={n} align="center" />
          ))}
        </State>
      </Section>

      <Section name="TimerRing" note="v1.2: sin ticks, 'Vierte agua hasta' sobre el número, línea de estado en crema debajo.">
        <State label="En vivo · vertido (ciclo de 20 s, reloj por timestamps)">
          <TimerRing
            mode="grams"
            elapsedMs={elapsed}
            durationMs={20000}
            primary="45"
            status={remainingS <= 3 ? { kind: 'changing', seconds: remainingS } : { kind: 'remaining', seconds: remainingS }}
          />
        </State>
        <State label="Vertido · 0 %, 50 %, 100 %">
          <TimerRing mode="grams" elapsedMs={0} durationMs={40000} primary="45" status={{ kind: 'remaining', seconds: 40 }} />
          <TimerRing mode="grams" elapsedMs={20000} durationMs={40000} primary="140" status={{ kind: 'remaining', seconds: 20 }} />
          <TimerRing mode="grams" elapsedMs={40000} durationMs={40000} primary="240" status={{ kind: 'remaining', seconds: 0 }} />
        </State>
        <State label="Últimos 3 s (P-06): 'Cambia en 3 s' + vibración corta">
          <TimerRing mode="grams" elapsedMs={37000} durationMs={40000} primary="45" status={{ kind: 'changing', seconds: 3 }} />
        </State>
        <State label="Hueco entre ventanas: 'Siguiente en N s'">
          <TimerRing mode="grams" elapsedMs={40000} durationMs={40000} primary="45" status={{ kind: 'next', seconds: 5 }} />
        </State>
        <State label="Espera / último paso (Figma 08): 'tiempo total' + num-time">
          <TimerRing mode="time" elapsedMs={167000} durationMs={180000} primary="2:47" status={{ kind: 'inWindow' }} />
          <TimerRing mode="time" elapsedMs={150000} durationMs={180000} primary="2:30" status={{ kind: 'remaining', seconds: 10 }} />
          <TimerRing mode="time" elapsedMs={192000} durationMs={180000} primary="3:12" status={{ kind: 'over', text: '+0:12 sobre la meta' }} />
        </State>
        <State label="Pausado (el anillo queda congelado)">
          <TimerRing mode="grams" paused elapsedMs={12000} durationMs={40000} primary="140" status={{ kind: 'remaining', seconds: 28 }} />
        </State>
      </Section>

      <Section name="InfoList" note="Figma 05: Propósito / Técnica / Después. Label = tipo de dato, nunca el nombre del paso.">
        <State label="Paso con tiempo (Bloom)">
          <InfoList items={BLOOM_INFO} />
        </State>
        <State label="Último paso (sin 'Después'; propósito en body-lg blanco, P-07)">
          <InfoList
            items={[
              { label: 'Propósito', value: 'Deja que el café termine de pasar. No interrumpir da más claridad.', emphasis: 'primary' },
              { label: 'Técnica', value: 'No añadas agua. Retira el dripper al terminar.' },
              { label: 'Después', value: null },
            ]}
          />
        </State>
      </Section>

      <Section name="StatRow" note="Resumen del brew: 3 columnas con divisores (en Figma 09 es una imagen raster, P-08).">
        <StatRow
          stats={[
            { icon: Bean, label: 'Café', value: '15', unit: 'g' },
            { icon: Droplet, label: 'Agua', value: '240', unit: 'g' },
            { icon: Thermometer, label: 'Temp.', value: '92', unit: '°C' },
          ]}
        />
      </Section>
    </>
  )
}
