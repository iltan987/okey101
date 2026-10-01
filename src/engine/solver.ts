import { meldPoints, type Meld, type MeldTile } from './melds'
import { COLORS, faceAt, faceIndex, MAX_N, type Counts, type Face } from './tiles'

/** Standard 101 penalty for an okey left in hand. */
export const DEFAULT_JOKER_PENALTY = 101

export interface SolveOptions {
  /**
   * - `points`: maximize meld points (to reach the 101 opening).
   * - `penalty`: minimize the value of tiles left in hand, where an unplayed joker costs `jokerPenalty`.
   */
  objective?: 'points' | 'penalty'
  jokerPenalty?: number
}

export interface Solution {
  melds: Meld[]
  /** Unmelded non-joker faces. */
  leftover: Face[]
  leftoverJokers: number
  /** Sum of meld points (opening value). */
  points: number
  /** Value of everything left in hand. */
  penalty: number
}

interface Candidate {
  meld: Meld
  /** Face indices of the real tiles used. */
  real: number[]
  jokers: number
}

interface State {
  gain: number
  /** Number of melds in the best continuation. */
  melds: number
  /** Meld containing the lowest remaining tile, or null if that tile stays in hand. */
  choice: Candidate | null
}

const EMPTY: State = { gain: 0, melds: 0, choice: null }

/**
 * Finds the best way to split the hand into sets and runs.
 *
 * Depth-first search over the lowest remaining tile: it is either left in hand,
 * or placed in a set or run (with that tile as the run's lowest real tile).
 * States are memoized on (counts, jokers), so a 22-tile hand solves in milliseconds.
 */
export function solve(hand: Counts, opts: SolveOptions = {}): Solution {
  const objective = opts.objective ?? 'points'
  const jokerPenalty = opts.jokerPenalty ?? DEFAULT_JOKER_PENALTY
  const counts = hand.counts.slice()
  const memo = new Map<string, State>()

  const gainOf = (m: Meld) =>
    m.tiles.reduce((sum, t) => sum + (t.joker && objective === 'penalty' ? jokerPenalty : t.face.n), 0)

  const take = (c: Candidate, delta: number) => {
    for (const r of c.real) counts[r] += delta
  }

  function candidates(i: number, jokers: number): Candidate[] {
    const face = faceAt(i)
    return [...setCandidates(i, face, jokers), ...runCandidates(i, face, jokers)]
  }

  function setCandidates(i: number, face: Face, jokers: number): Candidate[] {
    const out: Candidate[] = []
    const others = COLORS.filter((c) => c !== face.color)
    // Every subset of the other colors that are actually in hand.
    for (let mask = 0; mask < 1 << others.length; mask++) {
      const chosen = others.filter((_, b) => mask & (1 << b))
      const real = chosen.map((color) => faceIndex({ color, n: face.n }))
      if (real.some((r) => counts[r] === 0)) continue
      const used = new Set([face.color, ...chosen])
      const free = COLORS.filter((c) => !used.has(c))
      for (let size = 3; size <= 4; size++) {
        const need = size - used.size
        if (need < 0 || need > jokers || need > free.length) continue
        const jokerColors = new Set(free.slice(0, need))
        const tiles: MeldTile[] = COLORS.filter((c) => used.has(c) || jokerColors.has(c)).map((color) => ({
          face: { color, n: face.n },
          joker: jokerColors.has(color),
        }))
        out.push({ meld: { kind: 'set', tiles }, real: [i, ...real], jokers: need })
      }
    }
    return out
  }

  function runCandidates(i: number, face: Face, jokers: number): Candidate[] {
    const out: Candidate[] = []
    // Tiles below `face` in this color are already gone, so anything below it must be a joker.
    for (let start = face.n; start >= Math.max(1, face.n - jokers); start--) {
      const below = face.n - start
      const tiles: MeldTile[] = []
      for (let n = start; n < face.n; n++) tiles.push({ face: { color: face.color, n }, joker: true })
      tiles.push({ face, joker: false })
      extend(tiles, [i], jokers - below)
    }
    return out

    function extend(tiles: MeldTile[], real: number[], jokersLeft: number) {
      if (tiles.length >= 3) {
        out.push({ meld: { kind: 'run', tiles: tiles.slice() }, real: real.slice(), jokers: jokers - jokersLeft })
      }
      const n = tiles[tiles.length - 1].face.n + 1
      if (n > MAX_N) return
      const next = { color: face.color, n }
      const idx = faceIndex(next)
      if (counts[idx] > 0) {
        tiles.push({ face: next, joker: false })
        real.push(idx)
        extend(tiles, real, jokersLeft)
        real.pop()
        tiles.pop()
      }
      // A joker may also stand in for a tile we hold, keeping that tile free for another meld.
      if (jokersLeft > 0) {
        tiles.push({ face: next, joker: true })
        extend(tiles, real, jokersLeft - 1)
        tiles.pop()
      }
    }
  }

  /** Best gain from the current state; ties go to fewer (so longer) melds, which read better on the rack. */
  function best(jokers: number): State {
    const i = counts.findIndex((x) => x > 0)
    if (i < 0) return EMPTY
    const key = counts.join('') + jokers
    const hit = memo.get(key)
    if (hit) return hit

    counts[i]--
    let state: State = { ...best(jokers), choice: null }
    counts[i]++

    for (const c of candidates(i, jokers)) {
      take(c, -1)
      const rest = best(jokers - c.jokers)
      take(c, +1)
      const gain = gainOf(c.meld) + rest.gain
      const melds = rest.melds + 1
      if (gain > state.gain || (gain === state.gain && melds < state.melds)) state = { gain, melds, choice: c }
    }
    memo.set(key, state)
    return state
  }

  best(hand.jokers)

  // Walk the memoized choices to rebuild the solution.
  const melds: Meld[] = []
  const leftover: Face[] = []
  let jokers = hand.jokers
  for (;;) {
    const i = counts.findIndex((x) => x > 0)
    if (i < 0) break
    const { choice } = memo.get(counts.join('') + jokers)!
    if (choice) {
      melds.push(choice.meld)
      take(choice, -1)
      jokers -= choice.jokers
    } else {
      leftover.push(faceAt(i))
      counts[i]--
    }
  }

  const points = melds.reduce((sum, m) => sum + meldPoints(m), 0)
  const penalty = leftover.reduce((sum, f) => sum + f.n, 0) + jokers * jokerPenalty
  return { melds, leftover, leftoverJokers: jokers, points, penalty }
}
