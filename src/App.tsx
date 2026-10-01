import { useMemo } from 'react'
import { IndicatorPicker } from './components/IndicatorPicker'
import { Rack } from './components/Rack'
import { ResultsPanel } from './components/ResultsPanel'
import { RotateHint } from './components/RotateHint'
import { TilePicker } from './components/TilePicker'
import { layoutGroups, RACK_SLOTS, syncRack, type Rack as RackSlots } from './engine/layout'
import type { MeldTile } from './engine/melds'
import { okeyFromIndicator, resolveHand, sameFace, type Face, type HandTile } from './engine/tiles'
import { useAnalysis } from './hooks/useAnalysis'
import { usePersistentState } from './hooks/usePersistentState'
import './App.css'

const EMPTY_RACK: RackSlots = new Array(RACK_SLOTS).fill(null)

export default function App() {
  const [indicator, setIndicator] = usePersistentState<Face | null>('okey101.indicator', null)
  const [tiles, setTiles] = usePersistentState<HandTile[]>('okey101.tiles', [])
  const [savedRack, setRack] = usePersistentState<RackSlots>('okey101.rack', EMPTY_RACK)
  const okey = indicator ? okeyFromIndicator(indicator) : null
  // Always reconcile, so the rack can never lose or duplicate a tile.
  const rack = syncRack(savedRack, tiles.map((t) => t.id))

  const input = useMemo(
    () => (indicator && tiles.length > 0 ? { tiles, indicator } : null),
    [tiles, indicator],
  )
  const { result, pending } = useAnalysis(input)

  const updateTiles = (next: HandTile[]) => {
    setTiles(next)
    setRack(syncRack(rack, next.map((t) => t.id)))
  }

  const autoSort = (groups: MeldTile[][]) => {
    if (indicator) setRack(layoutGroups(resolveHand(tiles, indicator), groups))
  }

  // Of two copies, throw the one further along the rack: after auto-sort that's the leftover one.
  const discard = (face: Face) => {
    if (!indicator) return
    const [target] = resolveHand(tiles, indicator)
      .filter((t) => !t.joker && sameFace(t.face, face))
      .sort((a, b) => rack.indexOf(b.id) - rack.indexOf(a.id))
    if (target) updateTiles(tiles.filter((t) => t.id !== target.id))
  }

  const addTile = (t: { kind: 'false' } | Face) => {
    const id = crypto.randomUUID()
    updateTiles([...tiles, 'kind' in t ? { id, kind: 'false' } : { id, kind: 'face', ...t }])
  }

  return (
    <>
      <h1 className="app-title">
        <img src="/favicon.svg" alt="" width={40} height={40} />
        Okey 101 Yardımcısı
      </h1>
      <RotateHint />
      <IndicatorPicker indicator={indicator} onChange={setIndicator} />
      <TilePicker tiles={tiles} indicator={indicator} okey={okey} onAdd={addTile} />
      <Rack
        rack={rack}
        tiles={tiles}
        okey={okey}
        onChange={setRack}
        onRemove={(id) => updateTiles(tiles.filter((t) => t.id !== id))}
        actions={
          <>
            <button
              type="button"
              className="primary"
              disabled={!result || pending}
              onClick={() => result && autoSort(result.melds.melds.map((m) => m.tiles))}
            >
              Otomatik diz: per / seri
            </button>
            <button type="button" disabled={!result || pending} onClick={() => result && autoSort(result.pairs.pairs)}>
              Otomatik diz: çift
            </button>
            <button type="button" disabled={tiles.length === 0} onClick={() => updateTiles([])}>
              Eli temizle
            </button>
          </>
        }
      />
      <ResultsPanel analysis={result} okey={okey} pending={pending} onDiscard={discard} />
    </>
  )
}
