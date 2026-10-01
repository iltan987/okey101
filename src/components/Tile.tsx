import { sameFace, type Face, type HandTile } from '../engine/tiles'
import './Tile.css'

interface Props {
  tile: HandTile
  /** Current okey, used to mark jokers and show what a false okey stands for. */
  okey: Face | null
  selected?: boolean
  disabled?: boolean
  small?: boolean
  onClick?: () => void
  title?: string
}

export function Tile({ tile, okey, selected, disabled, small, onClick, title }: Props) {
  const isJoker = tile.kind === 'face' && okey !== null && sameFace(tile, okey)
  const classes = [
    'tile',
    tile.kind === 'face' ? tile.color : 'false-okey',
    isJoker && 'joker',
    selected && 'selected',
    small && 'small',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={classes} disabled={disabled} onClick={onClick} title={title}>
      {tile.kind === 'face' ? (
        <>
          <span className="num">{tile.n}</span>
          {isJoker && <span className="tag">OKEY</span>}
        </>
      ) : (
        <>
          <span className="num">★</span>
          {okey && <span className={`tag ${okey.color}`}>{okey.n}</span>}
        </>
      )}
    </button>
  )
}
