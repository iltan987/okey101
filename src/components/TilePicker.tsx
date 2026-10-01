import { canAddTile, MAX_HAND, sameFace, type Face, type HandTile } from '../engine/tiles'
import { FaceGrid } from './FaceGrid'
import { Tile } from './Tile'
import './TilePicker.css'

interface Props {
  tiles: HandTile[]
  indicator: Face | null
  okey: Face | null
  onAdd: (tile: { kind: 'false' } | Face) => void
  /** Takes back the most recently added tile. */
  onRemoveLast: () => void
  /** Tiles on the table, which use up copies too. */
  onTable: HandTile[]
}

/** How many recent tiles the header shows, so adding gives feedback without scrolling to the rack. */
const RECENT = 6

export function TilePicker({ tiles, indicator, okey, onAdd, onRemoveLast, onTable }: Props) {
  const falseOkey = { kind: 'false' } as const
  const countOf = (f: Face) => tiles.filter((t) => t.kind === 'face' && sameFace(t, f)).length
  const falseCount = tiles.filter((t) => t.kind === 'false').length
  const recent = tiles.slice(-RECENT)

  return (
    <section className="panel tile-picker">
      <div className="picker-head">
        <h2>
          Taş ekle <small className={tiles.length >= MAX_HAND ? 'full' : undefined}>{tiles.length} / {MAX_HAND}</small>
        </h2>
        {recent.length > 0 && (
          <div className="recent" aria-live="polite">
            <span className="hint">Son:</span>
            {tiles.length > RECENT && <span className="hint">…</span>}
            {recent.map((t) => (
              <Tile key={t.id} small tile={t} okey={okey} />
            ))}
            <button type="button" className="recent-undo" onClick={onRemoveLast} title="Son eklenen taşı geri al">
              ↶
            </button>
          </div>
        )}
      </div>
      <FaceGrid okey={okey} onPick={onAdd} countOf={countOf} isDisabled={(f) => !canAddTile(tiles, indicator, f, onTable)}>
        <div className="face-extra">
          <Tile
            small
            tile={{ id: '', ...falseOkey }}
            okey={okey}
            disabled={!canAddTile(tiles, indicator, falseOkey, onTable)}
            onClick={() => onAdd(falseOkey)}
            title="Sahte okey"
            badge={falseCount}
          />
          <span className="hint">Sahte okey</span>
        </div>
      </FaceGrid>
    </section>
  )
}
