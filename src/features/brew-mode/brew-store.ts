'use client'

/**
 * Pegamento entre la máquina pura y el navegador (tech §1: Zustand). La máquina decide;
 * el store guarda el estado y entrega los efectos a los handlers que registra la pantalla.
 */
import { create } from 'zustand'
import type { RecipeVersion } from '@/lib/schemas/recipe-seed'
import { initialState, transition, type BrewEffect, type BrewEvent, type BrewState } from './brew-machine'

export interface EffectHandlers {
  run: (effects: BrewEffect[], state: BrewState) => void
}

interface BrewStore {
  recipe: RecipeVersion | null
  state: BrewState
  /** Reloj de presentación: lo actualiza el loop de rAF */
  nowEpochMs: number
  handlers: EffectHandlers | null
  setRecipe: (recipe: RecipeVersion, state?: BrewState) => void
  setHandlers: (h: EffectHandlers | null) => void
  setNow: (ms: number) => void
  dispatch: (e: BrewEvent) => void
}

export const useBrewStore = create<BrewStore>((set, get) => ({
  recipe: null,
  state: initialState(),
  nowEpochMs: 0,
  handlers: null,
  setRecipe: (recipe, state) => set({ recipe, state: state ?? initialState() }),
  setHandlers: (handlers) => set({ handlers }),
  setNow: (nowEpochMs) => set({ nowEpochMs }),
  dispatch: (e) => {
    const { recipe, state, handlers } = get()
    if (!recipe) return
    const r = transition(state, e, { params: recipe.params, method: recipe.method })
    if (r.state !== state) set({ state: r.state })
    if (r.effects.length) handlers?.run(r.effects, r.state)
  },
}))
