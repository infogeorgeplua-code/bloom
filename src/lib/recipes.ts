import seedJson from '@/data/recipes.seed.json'
import { RecipeSeedFile, type RecipeVersion } from '@/lib/schemas/recipe-seed'

/** Seed validado al cargar el módulo: si el JSON está mal, falla en build y en tests, no en el teléfono. */
export const SEED: RecipeSeedFile = RecipeSeedFile.parse(seedJson)
export const SEED_VERSION = SEED._meta.version

export const seedRecipes = (): RecipeVersion[] => SEED.recipes

export function seedRecipe(id: string): RecipeVersion | undefined {
  return SEED.recipes.find((r) => r.id === id)
}

/** Ids que se prerenderizan para que Brew Mode funcione sin conexión. */
export const SEED_IDS = SEED.recipes.map((r) => r.id)

/** Ruta de Brew Mode: las seed están prerenderizadas; las del motor viven en IndexedDB (`/brew?v=`) */
export function brewHref(versionId: string): string {
  return SEED_IDS.includes(versionId) ? `/brew-mode/${versionId}` : `/brew?v=${encodeURIComponent(versionId)}`
}
