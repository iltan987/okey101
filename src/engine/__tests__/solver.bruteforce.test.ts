import { describe, expect, it } from 'vitest'
import { DEFAULT_JOKER_PENALTY, solve } from '../solver'
import { COLORS, faceIndex, FACE_COUNT, MAX_N, type Color, type Face } from '../tiles'
import { mulberry32 } from './helpers'

type BruteTile = Face | 'joker'

/**
 * Best gain of a single meld made from exactly these tiles, or null if they can't form one.
 * `jokerGain` is what a joker is worth given the face it stands in for.
 */
function meldGain(tiles: BruteTile[], jokerGain: (n: number) => number): number | null {
  const real = tiles.filter((t): t is Face => t !== 'joker')
  const jokers = tiles.length - real.length
  if (real.length === 0 || tiles.length < 3) return null
  let best: number | null = null

  // Set: one number, distinct colors, at most 4 tiles.
  const n = real[0].n
  if (tiles.length <= 4 && real.every((f) => f.n === n) && new Set(real.map((f) => f.color)).size === real.length) {
    best = real.length * n + jokers * jokerGain(n)
  }

  // Run: one color, distinct numbers; jokers fill gaps, extras extend the ends (no wrap).
  const color = real[0].color
  const ns = real.map((f) => f.n).sort((a, b) => a - b)
  if (real.every((f) => f.color === color) && new Set(ns).size === ns.length) {
    const len = tiles.length
    const lo = ns[0]
    const hi = ns[ns.length - 1]
    if (hi - lo + 1 <= len && len <= MAX_N) {
      for (let start = Math.max(1, hi - len + 1); start <= lo && start + len - 1 <= MAX_N; start++) {
        let gain = 0
        for (let k = start; k < start + len; k++) gain += ns.includes(k) ? k : jokerGain(k)
        if (best === null || gain > best) best = gain
      }
    }
  }
  return best
}

/** Exhaustive search: the first tile is either left over or melded with any subset of the rest. */
function bruteBest(tiles: BruteTile[], jokerGain: (n: number) => number): number {
  if (tiles.length === 0) return 0
  const [first, ...rest] = tiles
  let best = bruteBest(rest, jokerGain)
  if (first === 'joker') return best // jokers are sorted last, so only jokers remain
  for (let mask = 1; mask < 1 << rest.length; mask++) {
    const chosen = [first, ...rest.filter((_, i) => mask & (1 << i))]
    if (chosen.length > MAX_N) continue
    const gain = meldGain(chosen, jokerGain)
    if (gain === null) continue
    best = Math.max(best, gain + bruteBest(rest.filter((_, i) => !(mask & (1 << i))), jokerGain))
  }
  return best
}

/** Random hand from a narrow pool (few colors, low numbers) so melds overlap and compete. */
function randomPoolHand(rand: () => number, size: number): BruteTile[] {
  const colors: Color[] = COLORS.slice(0, 2 + Math.floor(rand() * 3))
  const maxN = 4 + Math.floor(rand() * 4)
  const pool: BruteTile[] = []
  for (const color of colors) for (let n = 1; n <= maxN; n++) pool.push({ color, n }, { color, n })
  pool.push('joker', 'joker')
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const hand = pool.slice(0, size)
  // Real tiles first, jokers last (bruteBest relies on it).
  return [...hand.filter((t) => t !== 'joker'), ...hand.filter((t) => t === 'joker')]
}

function toSolverCounts(tiles: BruteTile[]) {
  const counts = new Array<number>(FACE_COUNT).fill(0)
  let jokers = 0
  for (const t of tiles) {
    if (t === 'joker') jokers++
    else counts[faceIndex(t)]++
  }
  return { counts, jokers }
}

describe('solve matches exhaustive search', () => {
  const rand = mulberry32(2026)
  const hands = Array.from({ length: 300 }, () => randomPoolHand(rand, 6 + Math.floor(rand() * 5)))

  it('finds the maximum meld points', () => {
    for (const hand of hands) {
      const expected = bruteBest(hand, (n) => n)
      expect(solve(toSolverCounts(hand)).points, JSON.stringify(hand)).toBe(expected)
    }
  })

  it('finds the minimum leftover penalty', () => {
    for (const hand of hands) {
      const total =
        hand.reduce((s, t) => s + (t === 'joker' ? DEFAULT_JOKER_PENALTY : t.n), 0)
      const expected = total - bruteBest(hand, () => DEFAULT_JOKER_PENALTY)
      expect(solve(toSolverCounts(hand), { objective: 'penalty' }).penalty, JSON.stringify(hand)).toBe(expected)
    }
  })
})
