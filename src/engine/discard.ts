import { findPairs } from './pairs'
import { DEFAULT_RULES, type Rules } from './rules'
import { solve } from './solver'
import { COLORS, faceAt, faceIndex, MAX_N, type Counts, type Face } from './tiles'

export interface DiscardOption {
  face: Face
  /** Best meld points after discarding this tile. */
  points: number
  /** Pairs after discarding this tile. */
  pairs: number
  /** Leftover penalty after discarding, for the chosen strategy. */
  penalty: number
  /** How many tiles in hand could combine with this one later. Lower = safer to throw. */
  connections: number
}

/** Tiles that could form a future meld or pair with `face`. */
export function connections(hand: Counts, face: Face): number {
  const at = (f: Face) => (f.n >= 1 && f.n <= MAX_N ? hand.counts[faceIndex(f)] : 0)
  let total = at(face) - 1 // another copy makes a pair
  for (const d of [-2, -1, 1, 2]) total += at({ color: face.color, n: face.n + d })
  for (const color of COLORS) if (color !== face.color) total += at({ color, n: face.n })
  return total
}

/**
 * Tries discarding each distinct non-joker tile and ranks the results.
 * - `melds`: most meld points, then fewest connections, then highest value (lowers penalty).
 * - `pairs`: most pairs, then lowest penalty, then fewest connections.
 * The okey is never suggested.
 */
export function suggestDiscards(
  hand: Counts,
  strategy: 'melds' | 'pairs' = 'melds',
  rules: Rules = DEFAULT_RULES,
  limit = 3,
): DiscardOption[] {
  const options: DiscardOption[] = []
  hand.counts.forEach((c, i) => {
    if (c === 0) return
    const face = faceAt(i)
    const counts = hand.counts.slice()
    counts[i]--
    const rest = { counts, jokers: hand.jokers }
    const melds = solve(rest, { jokerPenalty: rules.jokerPenalty })
    const pairs = findPairs(rest, rules)
    options.push({
      face,
      points: melds.points,
      pairs: pairs.pairs.length,
      penalty: strategy === 'melds' ? melds.penalty : pairs.penalty,
      connections: connections(hand, face),
    })
  })

  options.sort((a, b) =>
    strategy === 'melds'
      ? b.points - a.points || a.connections - b.connections || b.face.n - a.face.n
      : b.pairs - a.pairs || a.penalty - b.penalty || a.connections - b.connections,
  )
  return options.slice(0, limit)
}
