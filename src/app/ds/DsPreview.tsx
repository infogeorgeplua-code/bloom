'use client'

import { useEffect, useState } from 'react'
import { SegmentedControl, Toggle } from '@/components'
import {
  BrewSections,
  HomeSections,
  ListSections,
  NavigationSections,
  SurfaceSections,
  TrustSections,
} from './DisplaySections'
import { ButtonSections, FieldSections, SelectionSections, ValueSections } from './InputsSections'
import { TokensSection } from './TokensSection'

type Theme = 'dark' | 'light'

/**
 * Preview del design system. El tema claro "Papel" cambia data-theme en <html>.
 * "Brew Mode" fuerza oscuro: quita data-theme y marca data-mode="brew" (DS §2.1).
 */
export function DsPreview() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [brew, setBrew] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light' && !brew) root.setAttribute('data-theme', 'light')
    else root.removeAttribute('data-theme')
    if (brew) root.setAttribute('data-mode', 'brew')
    else root.removeAttribute('data-mode')
    return () => {
      root.removeAttribute('data-theme')
      root.removeAttribute('data-mode')
    }
  }, [theme, brew])

  return (
    <main className="px-5 pb-16">
      <header className="flex flex-col gap-4 pt-[max(2rem,env(safe-area-inset-top))] pb-4">
        <p className="t-label text-fg-3">Bloom · Design System v1.2 · &quot;Instrumento&quot;</p>
        <h1 className="t-display text-fg">Sistema de diseño</h1>
        <p className="t-body text-fg-2">
          Todos los componentes con todos sus estados. Los datos son de ejemplo y no se guardan.
        </p>
        <SegmentedControl
          aria-label="Tema"
          value={theme}
          onChange={(v) => setTheme(v as Theme)}
          options={[
            { value: 'dark', label: 'Oscuro' },
            { value: 'light', label: 'Claro', disabled: brew },
          ]}
        />
        <Toggle label="Modo Brew (siempre oscuro)" checked={brew} onChange={setBrew} />
      </header>

      <nav aria-label="Secciones" className="py-2">
        <p className="t-caption text-fg-3">
          Tokens · Button · IconButton · SegmentedControl · Chip · ChipGrid · Toggle · Stepper · Slider ·
          Gauge · TextField · RatingScale · CoffeeHero · MethodIllustration · Tile · Orb · DataPill ·
          Banner · TopBar · BottomNav · BottomSheet · BrewSummarySheet · ListRow · StockMeter ·
          TrustBadge · SourceCard · RecipeParams · StepTimeline · ProgressDots · TimerRing · InfoList ·
          StatRow
        </p>
      </nav>

      <TokensSection />
      <ButtonSections />
      <SelectionSections />
      <ValueSections />
      <FieldSections />
      <HomeSections />
      <SurfaceSections />
      <NavigationSections />
      <ListSections />
      <TrustSections />
      <BrewSections />
    </main>
  )
}
