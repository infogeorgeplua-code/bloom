'use client'

import { useState } from 'react'
import { Coffee, Pause, Play, Settings2, Star } from 'lucide-react'
import {
  Button,
  Chip,
  ChipGrid,
  DialInput,
  Gauge,
  IconButton,
  RatingScale,
  SegmentedControl,
  Slider,
  Stepper,
  TextField,
  Toggle,
  type RatingLevel,
} from '@/components'
import { formatGrams, formatNumber, formatTemp } from '@/lib/format'
import { Section, State } from './primitives'

const OBJECTIVES = [
  { value: 'equilibrado', label: 'Equilibrado' },
  { value: 'brillante', label: 'Brillante' },
  { value: 'dulce', label: 'Dulce' },
  { value: 'cuerpo', label: 'Con cuerpo' },
  { value: 'claridad', label: 'Claridad' },
  { value: 'otro', label: 'Para alguien más' },
]

const SYMPTOMS = [
  { value: 'acido', label: 'Muy ácido' },
  { value: 'amargo', label: 'Muy amargo' },
  { value: 'seco', label: 'Seco al final' },
  { value: 'vacio', label: 'Vacío' },
  { value: 'astringente', label: 'Astringente' },
  { value: 'plano', label: 'Plano' },
  { value: 'intenso', label: 'Muy intenso' },
  { value: 'dulzor', label: 'Falta dulzor' },
  { value: 'cuerpo', label: 'Falta cuerpo' },
]

export function ButtonSections() {
  const [loading, setLoading] = useState(false)
  const variants = ['primary', 'secondary', 'tertiary', 'danger'] as const
  const labels = {
    primary: 'Preparar ahora',
    secondary: 'Ajustar sabor',
    tertiary: 'Saltar',
    danger: 'Marcar como terminado',
  }
  return (
    <>
      <Section name="Button" note="4 variantes × 3 tamaños × estados. Una primaria por pantalla.">
        {(['md', 'lg', 'xl'] as const).map((size) => (
          <State key={size} label={`Tamaño ${size} · ${size === 'md' ? '48' : size === 'lg' ? '56' : '64'} px`}>
            {variants.map((v) => (
              <Button key={v} variant={v} size={size} fullWidth>
                {labels[v]}
              </Button>
            ))}
          </State>
        ))}
        <State label="Deshabilitado">
          {variants.map((v) => (
            <Button key={v} variant={v} disabled fullWidth>
              {labels[v]}
            </Button>
          ))}
        </State>
        <State label="Cargando (mantiene el ancho)">
          <Button loading fullWidth>
            Guardando
          </Button>
          <Button
            variant="secondary"
            fullWidth
            loading={loading}
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 1500)
            }}
          >
            Toca para probar la carga
          </Button>
        </State>
        <State label="Con ícono y con dato (Geist Mono 500)">
          <Button icon={Play} fullWidth>
            Preparar ahora
          </Button>
          <Button variant="secondary" datum={formatGrams(15)} fullWidth>
            Café
          </Button>
        </State>
        <State label="Foco visible (usa el teclado: Tab)">
          <Button variant="secondary" fullWidth>
            Enfócame con Tab
          </Button>
        </State>
      </Section>

      <Section name="IconButton" note="48 px general · 64 px en Brew Mode. Siempre con nombre accesible.">
        <State label="surface · md / xl" row>
          <IconButton label="Ajustes" icon={Settings2} />
          <IconButton label="Pausar" icon={Pause} size="xl" />
        </State>
        <State label="ghost · md / xl" row>
          <IconButton label="Ajustes" icon={Settings2} variant="ghost" />
          <IconButton label="Pausar" icon={Pause} size="xl" variant="ghost" />
        </State>
        <State label="Deshabilitado" row>
          <IconButton label="Ajustes" icon={Settings2} disabled />
          <IconButton label="Pausar" icon={Pause} size="xl" variant="ghost" disabled />
        </State>
      </Section>
    </>
  )
}

export function SelectionSections() {
  const [seg2, setSeg2] = useState('v60')
  const [seg3, setSeg3] = useState('v60')
  const [chipSel, setChipSel] = useState(true)
  const [single2, setSingle2] = useState<string | null>('dulce')
  const [multi3, setMulti3] = useState<string[]>(['acido'])
  const [toggleA, setToggleA] = useState(false)
  const [toggleB, setToggleB] = useState(true)

  return (
    <>
      <Section name="SegmentedControl" note="2 a 3 segmentos. Flechas ← → cambian el segmento.">
        <State label="2 segmentos">
          <SegmentedControl
            aria-label="Modo"
            value={seg2}
            onChange={setSeg2}
            options={[
              { value: 'v60', label: 'V60' },
              { value: 'aero', label: 'AeroPress' },
            ]}
          />
        </State>
        <State label="3 segmentos">
          <SegmentedControl
            aria-label="Método"
            value={seg3}
            onChange={setSeg3}
            options={[
              { value: 'v60', label: 'V60' },
              { value: 'aero', label: 'AeroPress' },
              { value: 'esp', label: 'Espresso' },
            ]}
          />
        </State>
        <State label="Con un segmento deshabilitado">
          <SegmentedControl
            aria-label="Método con opción no disponible"
            value="v60"
            onChange={() => {}}
            options={[
              { value: 'v60', label: 'V60' },
              { value: 'aero', label: 'AeroPress' },
              { value: 'esp', label: 'Espresso', disabled: true },
            ]}
          />
        </State>
      </Section>

      <Section name="Chip" note="40 px de alto. Alternancia con aria-pressed.">
        <State label="default · selected · disabled · con ícono" row>
          <Chip selected={false}>Natural</Chip>
          <Chip selected={chipSel} onClick={() => setChipSel((s) => !s)}>
            Lavado
          </Chip>
          <Chip disabled>Honey</Chip>
          <Chip icon={Coffee}>Con ícono</Chip>
          <Chip icon={Star} selected>
            Con ícono
          </Chip>
        </State>
      </Section>

      <Section name="ChipGrid" note="Objetivo de taza (única) y síntomas (múltiple). Chips de 48 px.">
        <State label="2 columnas · selección única (radiogroup)">
          <ChipGrid
            aria-label="Objetivo de la taza"
            columns={2}
            options={OBJECTIVES}
            value={single2}
            onChange={setSingle2}
          />
        </State>
        <State label="3 columnas · selección múltiple (aria-pressed)">
          <ChipGrid
            aria-label="Síntomas"
            columns={3}
            multiple
            options={SYMPTOMS}
            value={multi3}
            onChange={setMulti3}
          />
        </State>
      </Section>

      <Section name="Toggle" note="Fila completa clicable de 48 px, label a la izquierda.">
        <State label="off · on · deshabilitado">
          <Toggle label="Vibración" checked={toggleA} onChange={setToggleA} />
          <Toggle label="Sonido" checked={toggleB} onChange={setToggleB} />
          <Toggle label="Modo automático" checked={false} onChange={() => {}} disabled />
          <Toggle label="Pantalla siempre encendida" checked onChange={() => {}} disabled />
        </State>
      </Section>
    </>
  )
}

export function ValueSections() {
  const [grams, setGrams] = useState(15)
  const [atMin, setAtMin] = useState(1)
  const [atMax, setAtMax] = useState(6)
  const [ratio, setRatio] = useState(16)
  const [range, setRange] = useState<[number, number]>([80, 92])
  const [dialTemp, setDialTemp] = useState(92)
  const [dialClicks, setDialClicks] = useState(18)

  return (
    <>
      <Section name="Stepper" note="Mantén pulsado − o + para acelerar (400 ms de espera, luego cada 120 ms).">
        <State label="Gramos de café">
          <Stepper
            aria-label="Gramos de café"
            value={grams}
            onChange={setGrams}
            min={5}
            max={60}
            step={0.5}
            display={formatGrams(grams)}
          />
        </State>
        <State label="Mínimo alcanzado (− deshabilitado)">
          <Stepper aria-label="Tazas" value={atMin} onChange={setAtMin} min={1} max={6} />
        </State>
        <State label="Máximo alcanzado (+ deshabilitado)">
          <Stepper aria-label="Tazas al máximo" value={atMax} onChange={setAtMax} min={1} max={6} />
        </State>
      </Section>

      <Section name="Slider" note="Track 6 px, thumb 28 px, escala con 3 o más marcas.">
        <State label="Simple">
          <Slider
            title="Ratio"
            min={12}
            max={20}
            step={1}
            value={ratio}
            onChange={setRatio}
            valueText={`1:${ratio}`}
            scale={['1:12', '1:16', '1:20']}
          />
        </State>
        <State label="Range (dos thumbs)">
          <Slider
            range
            title="Temperatura"
            min={80}
            max={100}
            step={1}
            value={range}
            onChange={setRange}
            valueText={`${range[0]} – ${range[1]} °C`}
            scale={['80', '90', '100']}
          />
        </State>
        <State label="Deshabilitado">
          <Slider
            title="Molienda"
            min={0}
            max={30}
            value={18}
            onChange={() => {}}
            valueText="18 clicks"
            scale={['0', '15', '30']}
            disabled
          />
        </State>
      </Section>

      <Section name="Gauge" note="Dial de instrumento. El valor va fuera del dial en num-lg.">
        <State label="270° · mínimo, medio y máximo" row>
          <div className="w-28">
            <Gauge aria-label="Temperatura mínima" min={80} max={100} value={80} valueText={formatTemp(80)} />
          </div>
          <div className="w-28">
            <Gauge aria-label="Temperatura media" min={80} max={100} value={90} valueText={formatTemp(90)} />
          </div>
          <div className="w-28">
            <Gauge aria-label="Temperatura máxima" min={80} max={100} value={100} valueText={formatTemp(100)} />
          </div>
        </State>
        <State label="180°" row>
          <div className="w-28">
            <Gauge aria-label="Ventana de tueste" min={0} max={30} value={12} sweep={180} valueText="12 días" />
          </div>
        </State>
        <State label="DialInput · arrastra la aguja o usa el Stepper / flechas (temperatura 80–100 °C)">
          <DialInput
            aria-label="Temperatura"
            min={80}
            max={100}
            step={0.5}
            value={dialTemp}
            onChange={setDialTemp}
            format={(v) => formatTemp(v)}
          />
        </State>
        <State label="DialInput 180° · molienda en clicks">
          <DialInput
            aria-label="Molienda"
            min={0}
            max={30}
            step={1}
            sweep={180}
            value={dialClicks}
            onChange={setDialClicks}
            format={(v) => `${formatNumber(v)} clicks`}
          />
        </State>
      </Section>
    </>
  )
}

export function FieldSections() {
  const [text, setText] = useState('')
  const [rating, setRating] = useState<RatingLevel | null>(null)
  const levels: RatingLevel[] = [1, 2, 3, 4, 5]

  return (
    <>
      <Section name="TextField" note="Label flotante. Foco: borde 2 px. Error: borde y mensaje en danger.">
        <State label="Default (escribe para ver el label flotar)">
          <TextField label="Nombre del café" value={text} onChange={(e) => setText(e.target.value)} />
        </State>
        <State label="Con valor">
          <TextField label="Tostador" defaultValue="Café del Altiplano" />
        </State>
        <State label="Error">
          <TextField label="Nombre del café" defaultValue="" error="Escribe el nombre del café." />
        </State>
        <State label="Numérico con unidad (inputMode decimal)">
          <TextField label="Peso de la bolsa" numeric suffix="g" defaultValue="250" />
        </State>
        <State label="Deshabilitado">
          <TextField label="Origen" defaultValue="Ecuador" disabled />
        </State>
        <State label="Multilínea (TODO(ds): variante pendiente de confirmación)">
          <TextField multiline label="Nota de la taza" defaultValue="" />
        </State>
      </Section>

      <Section name="RatingScale" note="Pregunta de cierre. Al seleccionar avanza solo. Usa ↑ ↓ para moverte.">
        <State label="Sin selección">
          <RatingScale value={rating} onChange={setRating} />
        </State>
        {levels.map((l) => (
          <State key={l} label={`Nivel ${l} seleccionado`}>
            <RatingScale value={l} onChange={() => {}} />
          </State>
        ))}
      </Section>
    </>
  )
}
