import { suggestDiscards, type DiscardOption } from './discard'
import { findPairs, type PairsResult } from './pairs'
import { solve, type Solution } from './solver'
import { resolveHand, toCounts, type Face, type HandTile } from './tiles'

export const OPEN_POINTS = 101
/** Tiles in hand after drawing, when a discard is due. */
export const FULL_HAND = 22

export interface AnalyzeInput {
  tiles: HandTile[]
  indicator: Face
  jokerPenalty?: number
}

export interface Analysis {
  /** Max meld points (opening). */
  melds: Solution
  /** Arrangement that leaves the least penalty in hand. */
  lowestPenalty: Solution
  pairs: PairsResult
  canOpenMelds: boolean
  /** Only when holding a full hand. */
  discards: { melds: DiscardOption[]; pairs: DiscardOption[] } | null
}

export function analyze({ tiles, indicator, jokerPenalty }: AnalyzeInput): Analysis {
  const counts = toCounts(resolveHand(tiles, indicator))
  const melds = solve(counts, { jokerPenalty })
  const pairs = findPairs(counts, jokerPenalty)
  return {
    melds,
    lowestPenalty: solve(counts, { objective: 'penalty', jokerPenalty }),
    pairs,
    canOpenMelds: melds.points >= OPEN_POINTS,
    discards:
      tiles.length >= FULL_HAND
        ? { melds: suggestDiscards(counts, 'melds'), pairs: suggestDiscards(counts, 'pairs') }
        : null,
  }
}
