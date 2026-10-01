import { IndicatorPicker } from './components/IndicatorPicker'
import { Tile } from './components/Tile'
import { TilePicker } from './components/TilePicker'
import { okeyFromIndicator, type Face, type HandTile } from './engine/tiles'
import { usePersistentState } from './hooks/usePersistentState'
import './App.css'

export default function App() {
  const [indicator, setIndicator] = usePersistentState<Face | null>('okey101.indicator', null)
  const [tiles, setTiles] = usePersistentState<HandTile[]>('okey101.tiles', [])
  const okey = indicator ? okeyFromIndicator(indicator) : null

  const addTile = (t: { kind: 'false' } | Face) => {
    const id = crypto.randomUUID()
    const tile: HandTile = 'kind' in t ? { id, kind: 'false' } : { id, kind: 'face', ...t }
    setTiles([...tiles, tile])
  }

  return (
    <>
      <h1>Okey 101 Optimizer</h1>
      <IndicatorPicker indicator={indicator} onChange={setIndicator} />
      <TilePicker tiles={tiles} indicator={indicator} okey={okey} onAdd={addTile} />
      <section className="panel">
        <h2>Hand</h2>
        <div className="hand">
          {tiles.map((t) => (
            <Tile key={t.id} tile={t} okey={okey} />
          ))}
        </div>
      </section>
    </>
  )
}
