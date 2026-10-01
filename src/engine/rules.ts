/** Table rules. 101 is played with many house rules, so these are all configurable. */
export interface Rules {
  /** Meld points needed to open (açmak). */
  openPoints: number
  /** Pairs needed to open with pairs (çift). */
  pairsToOpen: number
  /** Penalty for an okey left in hand. */
  jokerPenalty: number
  /** Penalty multiplier for a player who opened with pairs. */
  pairsPenaltyMultiplier: number
  /** Allow a run to continue from 13 to 1 (… 12-13-1). */
  wrapRuns: boolean
  /** The real okey can complete a pair. */
  okeyInPairs: boolean
  /** Tiles can be laid off (işlemek) on the same turn you open. */
  layoffSameTurn: boolean
  /** Max tiles laid off on one end of a run per turn; 0 = no limit. */
  layoffMaxPerSide: number
  /** A player who opened with pairs may still lay down new melds (per / seri). */
  pairsOpenerCanMeld: boolean
  /** Suggest taking an okey from the table by putting down the tile it stands for. */
  okeySwap: boolean
}

export const DEFAULT_RULES: Rules = {
  openPoints: 101,
  pairsToOpen: 5,
  jokerPenalty: 101,
  pairsPenaltyMultiplier: 2,
  wrapRuns: false,
  okeyInPairs: true,
  layoffSameTurn: true,
  layoffMaxPerSide: 2,
  pairsOpenerCanMeld: false,
  okeySwap: true,
}

/** Fills in defaults, e.g. for settings saved before a rule existed. */
export function withDefaults(rules: Partial<Rules> = {}): Rules {
  return { ...DEFAULT_RULES, ...rules }
}
