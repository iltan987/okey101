import type { MeldTile } from './melds'
import { DEFAULT_RULES, type Rules } from './rules'
import { faceAt, type Counts, type Face } from './tiles'

export interface PairsResult {
  /** Each pair is two identical tiles, or a joker plus the tile it copies. */
  pairs: [MeldTile, MeldTile][]
  leftover: Face[]
  leftoverJokers: number
  canOpen: boolean
  penalty: number
}

/**
 * Builds as many pairs as possible. If the okey may complete pairs, jokers pair with the
 * highest single tiles first, which keeps the leftover penalty as low as possible.
 * Two okeys always form a pair: they are identical tiles.
 */
export function findPairs(
  hand: Counts,
  { jokerPenalty, pairsToOpen, okeyInPairs }: Pick<Rules, 'jokerPenalty' | 'pairsToOpen' | 'okeyInPairs'> = DEFAULT_RULES,
): PairsResult {
  const pairs: [MeldTile, MeldTile][] = []
  const singles: Face[] = []
  hand.counts.forEach((c, i) => {
    const face = faceAt(i)
    for (let k = 0; k < Math.floor(c / 2); k++) pairs.push([{ face, joker: false }, { face, joker: false }])
    if (c % 2) singles.push(face)
  })

  singles.sort((a, b) => b.n - a.n)
  let jokers = hand.jokers
  while (okeyInPairs && jokers > 0 && singles.length > 0) {
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
  return { pairs, leftover: singles, leftoverJokers: jokers, canOpen: pairs.length >= pairsToOpen, penalty }
}
