import type { ReactNode } from 'react'
import { COLORS, MAX_N, type Face } from '../engine/tiles'
import { Tile } from './Tile'
import './FaceGrid.css'

interface Props {
  okey: Face | null
  onPick: (face: Face) => void
  isDisabled?: (face: Face) => boolean
  isSelected?: (face: Face) => boolean
  /** Corner count per face (e.g. copies already in hand). */
  countOf?: (face: Face) => number
  /** Extra content after the grid rows (e.g. a false okey button). */
  children?: ReactNode
}

/** 4 colors × 13 numbers of tiles to pick from. */
export function FaceGrid({ okey, onPick, isDisabled, isSelected, countOf, children }: Props) {
  const numbers = Array.from({ length: MAX_N }, (_, i) => i + 1)
  return (
    <div className="face-grid">
      {COLORS.map((color) => (
        <div className="face-row" key={color}>
          {numbers.map((n) => {
            const face = { color, n }
            return (
              <Tile
                key={n}
                tile={{ id: '', kind: 'face', color, n }}
                okey={okey}
                disabled={isDisabled?.(face)}
                selected={isSelected?.(face)}
                badge={countOf?.(face)}
                onClick={() => onPick(face)}
              />
            )
          })}
        </div>
      ))}
      {children}
    </div>
  )
}
