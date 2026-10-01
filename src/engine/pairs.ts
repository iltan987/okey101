import type { MeldTile } from './melds'
import { DEFAULT_JOKER_PENALTY } from './solver'
import { faceAt, type Counts, type Face } from './tiles'

/** Pairs needed to open with çift. */
export const PAIRS_TO_OPEN = 5

export interface PairsResult {
  /** Each pair is two identical tiles, or a joker plus the tile it copies. */
  pairs: [MeldTile, MeldTile][]
  leftover: Face[]
  leftoverJokers: number
  canOpen: boolean
  penalty: number
}

/**
 * Builds as many pairs as possible. Jokers pair with the highest single tiles first,
 * which keeps the leftover penalty as low as possible.
 */
export function findPairs(hand: Counts, jokerPenalty = DEFAULT_JOKER_PENALTY): PairsResult {
  const pairs: [MeldTile, MeldTile][] = []
  const singles: Face[] = []
  hand.counts.forEach((c, i) => {
    const face = faceAt(i)
    for (let k = 0; k < Math.floor(c / 2); k++) pairs.push([{ face, joker: false }, { face, joker: false }])
    if (c % 2) singles.push(face)
  })

  singles.sort((a, b) => b.n - a.n)
  let jokers = hand.jokers
  while (jokers > 0 && singles.length > 0) {
    const face = singles.shift()!
    pairs.push([{ face, joker: false }, { face, joker: true }])
    jokers--
  }
  // Two okeys are identical tiles, so they form a pair too. The face is a placeholder.
  if (jokers >= 2) {
    const face = { color: 'black', n: 0 } as const
    pairs.push([{ face, joker: true }, { face, joker: true }])
    jokers -= 2
  }

  const penalty = singles.reduce((sum, f) => sum + f.n, 0) + jokers * jokerPenalty
  return { pairs, leftover: singles, leftoverJokers: jokers, canOpen: pairs.length >= PAIRS_TO_OPEN, penalty }
}
