import { useState, type ReactNode } from 'react'
import { moveTile, type Rack as RackSlots } from '../engine/layout'
import type { Face, HandTile } from '../engine/tiles'
import { Tile } from './Tile'
import './Rack.css'

interface Props {
  rack: RackSlots
  tiles: HandTile[]
  okey: Face | null
  onChange: (rack: RackSlots) => void
  onRemove: (id: string) => void
  /** Extra buttons in the toolbar (e.g. auto-sort). */
  actions?: ReactNode
}

/** Two-row rack (ıstaka). Tap a tile, then tap another slot to move it there (or swap). */
export function Rack({ rack, tiles, okey, onChange, onRemove, actions }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const byId = new Map(tiles.map((t) => [t.id, t]))

  const clickSlot = (i: number) => {
    if (selected === null) {
      if (rack[i] !== null) setSelected(i)
    } else {
      if (selected !== i) onChange(moveTile(rack, selected, i))
      setSelected(null)
    }
  }

  const selectedId = selected !== null ? rack[selected] : null

  return (
    <section className="panel">
      <h2>Istaka</h2>
      <div className="rack-wrap">
        <div className="rack">
          {rack.map((id, i) => {
            const tile = id !== null ? byId.get(id) : undefined
            return (
              <div key={i} className="slot" onClick={tile ? undefined : () => clickSlot(i)}>
                {tile && <Tile tile={tile} okey={okey} selected={selected === i} onClick={() => clickSlot(i)} />}
              </div>
            )
          })}
        </div>
      </div>
      <div className="toolbar">
        {actions}
        <button
          type="button"
          disabled={selectedId === null}
          onClick={() => {
            if (selectedId) onRemove(selectedId)
            setSelected(null)
          }}
        >
          Taşı kaldır
        </button>
      </div>
    </section>
  )
}
