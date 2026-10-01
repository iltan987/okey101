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
  /** Small corner count (e.g. copies already in hand); hidden when 0. */
  badge?: number
}

export function Tile({ tile, okey, selected, disabled, small, onClick, title, badge }: Props) {
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

  const face =
    tile.kind === 'face' ? (
      <>
        <span className="num">{tile.n}</span>
        {isJoker && <span className="tag">OKEY</span>}
      </>
    ) : (
      <>
        <span className="num">★</span>
        {okey && <span className={`tag ${okey.color}`}>{okey.n}</span>}
      </>
    )
  // Keyed by the count so it pops again each time it changes.
  const counter = badge ? (
    <span key={badge} className="badge" aria-hidden="true">
      {badge}
    </span>
  ) : null

  // Display-only tiles aren't buttons, so they can sit inside other buttons.
  if (!onClick) {
    return (
      <span className={classes} title={title}>
        {face}
        {counter}
      </span>
    )
  }
  return (
    <button type="button" className={classes} disabled={disabled} onClick={onClick} title={title}>
      {face}
      {counter}
    </button>
  )
}
