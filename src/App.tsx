import { IndicatorPicker } from './components/IndicatorPicker'
import { Rack } from './components/Rack'
import { TilePicker } from './components/TilePicker'
import { RACK_SLOTS, syncRack, type Rack as RackSlots } from './engine/layout'
import { okeyFromIndicator, type Face, type HandTile } from './engine/tiles'
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

  const updateTiles = (next: HandTile[]) => {
    setTiles(next)
    setRack(syncRack(rack, next.map((t) => t.id)))
  }

  const addTile = (t: { kind: 'false' } | Face) => {
    const id = crypto.randomUUID()
    updateTiles([...tiles, 'kind' in t ? { id, kind: 'false' } : { id, kind: 'face', ...t }])
  }

  return (
    <>
      <h1>Okey 101 Optimizer</h1>
      <IndicatorPicker indicator={indicator} onChange={setIndicator} />
      <TilePicker tiles={tiles} indicator={indicator} okey={okey} onAdd={addTile} />
      <Rack
        rack={rack}
        tiles={tiles}
        okey={okey}
        onChange={setRack}
        onRemove={(id) => updateTiles(tiles.filter((t) => t.id !== id))}
        actions={
          <button type="button" disabled={tiles.length === 0} onClick={() => updateTiles([])}>
            Clear hand
          </button>
        }
      />
    </>
  )
}
