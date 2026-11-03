import { notFound } from 'next/navigation'
import { BrewMode } from '@/features/brew-mode/BrewMode'
import { SEED_IDS, seedRecipe } from '@/lib/recipes'

/** Las 3 recetas seed se prerenderizan para que Brew Mode abra sin conexión. */
export const dynamicParams = false
export function generateStaticParams() {
  return SEED_IDS.map((versionId) => ({ versionId }))
}

export default async function BrewModePage({ params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params
  const recipe = seedRecipe(versionId)
  if (!recipe) notFound()
  return <BrewMode recipe={recipe} />
}
