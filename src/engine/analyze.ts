import { suggestDiscards, type DiscardOption } from './discard'
import { findPairs, type PairsResult } from './pairs'
import { solve, type Solution } from './solver'
import { withDefaults, type Rules } from './rules'
import { resolveHand, toCounts, type Face, type HandTile } from './tiles'
/** Tiles in hand after drawing, when a discard is due. */
export const FULL_HAND = 22

export interface AnalyzeInput {
  tiles: HandTile[]
  indicator: Face
  rules?: Partial<Rules>
}

export interface Analysis {
  /** Rules the analysis used, with defaults filled in. */
  rules: Rules
  /** Max meld points (opening). */
  melds: Solution
  /** Arrangement that leaves the least penalty in hand. */
  lowestPenalty: Solution
  pairs: PairsResult
  canOpenMelds: boolean
  /** Only when holding a full hand. */
  discards: { melds: DiscardOption[]; pairs: DiscardOption[] } | null
}

export function analyze({ tiles, indicator, rules: partialRules }: AnalyzeInput): Analysis {
  const rules = withDefaults(partialRules)
  const { jokerPenalty, wrapRuns } = rules
  const counts = toCounts(resolveHand(tiles, indicator))
  const melds = solve(counts, { jokerPenalty, wrapRuns })
  const pairs = findPairs(counts, rules)
  return {
    rules,
    melds,
    lowestPenalty: solve(counts, { objective: 'penalty', jokerPenalty, wrapRuns }),
    pairs,
    canOpenMelds: melds.points >= rules.openPoints,
    discards:
      tiles.length >= FULL_HAND
        ? { melds: suggestDiscards(counts, 'melds', rules), pairs: suggestDiscards(counts, 'pairs', rules) }
        : null,
  }
}
