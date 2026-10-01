import { canAddTile, MAX_HAND, type Face, type HandTile } from '../engine/tiles'
import { FaceGrid } from './FaceGrid'
import { Tile } from './Tile'

interface Props {
  tiles: HandTile[]
  indicator: Face | null
  okey: Face | null
  onAdd: (tile: { kind: 'false' } | Face) => void
}

export function TilePicker({ tiles, indicator, okey, onAdd }: Props) {
  const falseOkey = { kind: 'false' } as const
  return (
    <section className="panel">
      <h2>
        Taş ekle <small>{tiles.length} / {MAX_HAND}</small>
      </h2>
      <FaceGrid okey={okey} onPick={onAdd} isDisabled={(f) => !canAddTile(tiles, indicator, f)}>
        <div className="face-row">
          <Tile
            small
            tile={{ id: '', ...falseOkey }}
            okey={okey}
            disabled={!canAddTile(tiles, indicator, falseOkey)}
            onClick={() => onAdd(falseOkey)}
            title="Sahte okey"
          />
          <span className="hint">Sahte okey</span>
        </div>
      </FaceGrid>
    </section>
  )
}
