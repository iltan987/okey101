import type { MeldTile } from '../engine/melds'
import type { Face } from '../engine/tiles'
import { faceName, tileFor } from './labels'
import { Tile } from './Tile'

export function Stat({ label, value, ok, note }: { label: string; value: string; ok?: boolean; note?: string }) {
  return (
    <div className={`stat${ok ? ' ok' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {ok && ' ✓'}
      </div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  )
}

export function Group({ tiles, okey }: { tiles: MeldTile[]; okey: Face }) {
  return (
    <div className="group">
      {tiles.map((t, i) => (
        <Tile
          key={i}
          small
          tile={tileFor(t.face, t.joker, okey)}
          okey={okey}
          title={t.joker ? `Okey, ${faceName(t.face)} yerine` : undefined}
        />
      ))}
    </div>
  )
}

export function Discards<T extends { face: Face }>({
  title,
  options,
  okey,
  detail,
  disabled,
  onDiscard,
}: {
  title: string
  options: T[]
  okey: Face
  detail: (o: T) => string
  disabled: boolean
  onDiscard: (face: Face) => void
}) {
  return (
    <div>
      <div className="stat-label">{title}</div>
      <ol>
        {options.map((o, i) => (
          <li key={i}>
            <button type="button" className="discard-option" disabled={disabled} onClick={() => onDiscard(o.face)}>
              <Tile small tile={tileFor(o.face, false, okey)} okey={okey} />
              <span>{detail(o)}</span>
              <span className="discard-action">At</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
