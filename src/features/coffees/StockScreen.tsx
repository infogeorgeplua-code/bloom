'use client'

/** Stock (product §18, biblioteca de cafés · fase 3). Lista con gramos y alerta (D-09). */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Plus } from 'lucide-react'
import { Button, ListRow, Orb } from '@/components'
import { AppShell } from '@/features/shell/AppShell'
import { isLow } from '@/features/inventory/inventory'
import { stockTotals, type CoffeeSummary } from '@/features/inventory/library'
import { loadSummaries } from '@/lib/library-db'
import { ensureSeed, getDb } from '@/lib/offline-db'
import { formatNumber } from '@/lib/format'
import { PROCESS_LABEL } from '@/lib/schemas/coffee'

const thumb = <Package size={24} strokeWidth={1.5} aria-hidden="true" />

export function CoffeeRow({ s, onOpen }: { s: CoffeeSummary; onOpen: () => void }) {
  return (
    <ListRow
      thumb={thumb}
      title={s.coffee.name}
      subtitle={s.coffee.process ? PROCESS_LABEL[s.coffee.process] : (s.coffee.originCountry ?? undefined)}
      grams={s.grams !== null ? formatNumber(s.grams) : undefined}
      low={s.stock ? isLow(s.stock.level) : false}
      onClick={onOpen}
    />
  )
}

export function StockScreen() {
  const router = useRouter()
  const [list, setList] = useState<CoffeeSummary[] | null>(null)

  useEffect(() => {
    void (async () => {
      const db = getDb()
      await ensureSeed(db, Date.now())
      setList(await loadSummaries(db, Date.now()))
    })()
  }, [])

  if (!list) return <main className="min-h-dvh" aria-busy="true" />

  const visible = list.filter((s) => !s.coffee.archived)
  const open = visible.filter((s) => s.activeBag).sort((a, b) => (b.grams ?? 0) - (a.grams ?? 0))
  const closed = visible.filter((s) => !s.activeBag)
  const archived = list.filter((s) => s.coffee.archived)
  const totals = stockTotals(list)
  const go = (id: string) => router.push(`/cafe?id=${encodeURIComponent(id)}`)

  return (
    <AppShell active="stock">
      <header className="flex min-h-12 items-center pt-[env(safe-area-inset-top)]">
        <h1 className="t-title-lg text-fg">Stock</h1>
      </header>

      {visible.length ? (
        <p className="t-body text-fg-2">
          <span className="num text-fg">{formatNumber(totals.grams)}</span> g en <span className="num text-fg">{totals.coffeesInStock}</span>{' '}
          {totals.coffeesInStock === 1 ? 'café' : 'cafés'} con stock
        </p>
      ) : (
        <section className="flex flex-col items-center gap-4 rounded-tile bg-surface-2 p-6 text-center">
          <Orb variant="outline" size="sm" icon={Package} />
          <p className="t-title text-fg">Aún no tienes cafés</p>
          <p className="t-body text-fg-2">Agrega la bolsa que tienes abierta: Bloom ajusta la receta y lleva la cuenta de los gramos.</p>
        </section>
      )}

      <Button variant={visible.length ? 'secondary' : 'primary'} size="lg" fullWidth icon={Plus} onClick={() => router.push('/cafe/nuevo')}>
        Tengo un café nuevo
      </Button>

      {open.length ? (
        <section className="flex flex-col gap-1" aria-labelledby="con-bolsa">
          <h2 id="con-bolsa" className="t-label text-fg-3">
            Con bolsa abierta
          </h2>
          <div>
            {open.map((s) => (
              <CoffeeRow key={s.coffee.id} s={s} onOpen={() => go(s.coffee.id)} />
            ))}
          </div>
        </section>
      ) : null}

      {closed.length ? (
        <section className="flex flex-col gap-1" aria-labelledby="sin-bolsa">
          <h2 id="sin-bolsa" className="t-label text-fg-3">
            Sin bolsa abierta
          </h2>
          <div>
            {closed.map((s) => (
              <CoffeeRow key={s.coffee.id} s={s} onOpen={() => go(s.coffee.id)} />
            ))}
          </div>
        </section>
      ) : null}

      {archived.length ? (
        <section className="flex flex-col gap-1" aria-labelledby="archivados">
          <h2 id="archivados" className="t-label text-fg-3">
            Archivados
          </h2>
          <div>
            {archived.map((s) => (
              <CoffeeRow key={s.coffee.id} s={s} onOpen={() => go(s.coffee.id)} />
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  )
}
