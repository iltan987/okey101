import { FULL_HAND, type Analysis } from '../engine/analyze'
import type { Face } from '../engine/tiles'
import { faceName, tileFor } from './labels'
import { Tile } from './Tile'
import './DiscardNotice.css'

interface Props {
  tileCount: number
  analysis: Analysis | null
  okey: Face | null
  pending: boolean
  onDiscard: (face: Face) => void
}

/** With 22 tiles (round start or after drawing), a discard is due: say so and offer the best one. */
export function DiscardNotice({ tileCount, analysis, okey, pending, onDiscard }: Props) {
  if (tileCount < FULL_HAND) return null

  // Follow the opening the results recommend: pairs only when melds can't open but pairs can.
  const byPairs = analysis !== null && !analysis.canOpenMelds && analysis.pairs.canOpen
  const best = analysis?.discards?.[byPairs ? 'pairs' : 'melds'][0]

  return (
    <div className="discard-notice" role="status">
      <span className="discard-notice-text">
        <b>{FULL_HAND} taş:</b> bir taş atman gerekiyor.
      </span>
      {best && okey && (
        <button
          type="button"
          className="discard-notice-btn"
          disabled={pending}
          onClick={() => onDiscard(best.face)}
          title={`${faceName(best.face)} at`}
        >
          <span>Öneri:</span>
          <Tile small tile={tileFor(best.face, false, okey)} okey={okey} />
          <b>At</b>
        </button>
      )}
    </div>
  )
}
