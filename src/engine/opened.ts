import type { Meld, MeldTile } from './melds'
import type { Rules } from './rules'
import { meldCandidates } from './solver'
import type { TableMeld } from './table'
import { COLORS, faceAt, faceIndex, MAX_N, type Counts, type Face } from './tiles'

/** Tiles from the hand added to a table meld (işlemek). */
export interface Layoff {
  /** Index into the table melds. */
  meld: number
  /** Before the run, after it, or into the set. */
  side: 'low' | 'high' | 'set'
  /** In table order. */
  tiles: MeldTile[]
}

export interface OpenedOptions {
  openedWith: 'melds' | 'pairs'
  /** Opened on this turn: lay-offs wait for the next turn unless rules.layoffSameTurn. */
  openedThisTurn: boolean
  rules: Rules
}

export interface OpenedPlan {
  /** New melds from the hand. */
  melds: Meld[]
  /** New pairs from the hand (pairs openers). */
  pairs: [MeldTile, MeldTile][]
  layoffs: Layoff[]
  leftover: Face[]
  leftoverJokers: number
  /** Value left in hand, multiplied for a pairs opener. */
  penalty: number
  canMeld: boolean
  canLayOff: boolean
}

interface Action {
  kind: 'meld' | 'pair' | 'layoff'
  meld?: Meld
  pair?: [MeldTile, MeldTile]
  layoff?: Layoff
  /** Face indices of the real tiles used. */
  real: number[]
  jokers: number
  /** Table extension state after this action (unchanged for melds and pairs). */
  ext: number[][]
}

interface State {
  gain: number
  actions: number
  choice: Action | null
}

/**
 * Per table meld, what has been added this turn:
 * run → [lo, hi, addedLow, addedHigh] (hi = 14 means a wrapped 1 after 13); set → [color bitmask].
 */
function initialExt(table: TableMeld[]): number[][] {
  return table.map((m) => {
    if (m.kind === 'set') return [m.tiles.reduce((mask, t) => mask | (1 << COLORS.indexOf(t.face.color)), 0)]
    const lo = m.tiles[0].face.n
    return [lo, lo + m.tiles.length - 1, 0, 0]
  })
}

/**
 * Best way to empty the hand after opening: new melds (or pairs, for a pairs opener) and
 * lay-offs on table melds, minimizing what's left in hand. Same memoized lowest-tile-first
 * search as the opening solver, with the table's growth as part of the state.
 */
export function planOpened(hand: Counts, table: TableMeld[], { openedWith, openedThisTurn, rules }: OpenedOptions): OpenedPlan {
  const { jokerPenalty, wrapRuns, okeyInPairs } = rules
  const limit = rules.layoffMaxPerSide > 0 ? rules.layoffMaxPerSide : Infinity
  const canMeld = openedWith === 'melds' || rules.pairsOpenerCanMeld
  const canPair = openedWith === 'pairs'
  const canLayOff = !openedThisTurn || rules.layoffSameTurn

  const counts = hand.counts.slice()
  const memo = new Map<string, State>()
  const keyOf = (jokers: number, ext: number[][]) => `${counts.join('')}|${jokers}|${ext.join(';')}`
  const gainOf = (tiles: MeldTile[]) => tiles.reduce((sum, t) => sum + (t.joker ? jokerPenalty : t.face.n), 0)
  const runColor = (m: number) => table[m].tiles[0].face.color
  const setNumber = (m: number) => table[m].tiles[0].face.n
  const withExt = (ext: number[][], m: number, next: number[]) => ext.map((e, k) => (k === m ? next : e))

  /** Positions a run can still grow into on each side this turn. */
  function room(ext: number[][], m: number) {
    const [lo, hi, addedLow, addedHigh] = ext[m]
    const free = MAX_N - (hi - lo + 1)
    const highEnd = wrapRuns && lo >= 2 ? MAX_N + 1 : MAX_N
    return {
      low: Math.min(limit - addedLow, lo - 1, free),
      high: Math.min(limit - addedHigh, highEnd - hi, free),
    }
  }

  const runTile = (color: Face['color'], pos: number, joker: boolean): MeldTile => ({
    face: { color, n: pos === MAX_N + 1 ? 1 : pos },
    joker,
  })

  function tileActions(i: number, jokers: number, ext: number[][]): Action[] {
    const face = faceAt(i)
    const out: Action[] = []

    if (canMeld) {
      for (const c of meldCandidates(counts, i, jokers, wrapRuns)) {
        out.push({ kind: 'meld', meld: c.meld, real: c.real, jokers: c.jokers, ext: ext })
      }
    }

    if (canPair) {
      const real = { face, joker: false }
      if (counts[i] >= 2) out.push({ kind: 'pair', pair: [real, real], real: [i, i], jokers: 0, ext: ext })
      if (okeyInPairs && jokers > 0) {
        out.push({ kind: 'pair', pair: [real, { face, joker: true }], real: [i], jokers: 1, ext: ext })
      }
    }

    if (!canLayOff) return out
    table.forEach((m, k) => {
      if (m.kind === 'set') {
        const [mask] = ext[k]
        const bit = 1 << COLORS.indexOf(face.color)
        const size = COLORS.filter((_, b) => mask & (1 << b)).length
        if (setNumber(k) === face.n && !(mask & bit) && size < 4) {
          const layoff: Layoff = { meld: k, side: 'set', tiles: [{ face, joker: false }] }
          out.push({ kind: 'layoff', layoff, real: [i], jokers: 0, ext: withExt(ext, k, [mask | bit]) })
        }
        return
      }
      if (runColor(k) !== face.color) return
      const [lo, hi, addedLow, addedHigh] = ext[k]
      const { low, high } = room(ext, k)

      // After the run: okeys fill any gap up to this tile (lower tiles are already gone).
      const pos = face.n === 1 ? MAX_N + 1 : face.n
      if (pos > hi && pos - hi <= high && pos - hi - 1 <= jokers) {
        const tiles: MeldTile[] = []
        for (let p = hi + 1; p < pos; p++) tiles.push(runTile(face.color, p, true))
        tiles.push({ face, joker: false })
        const layoff: Layoff = { meld: k, side: 'high', tiles }
        const next = [lo, pos, addedLow, addedHigh + tiles.length]
        out.push({ kind: 'layoff', layoff, real: [i], jokers: tiles.length - 1, ext: withExt(ext, k, next) })
      }

      // Before the run: this tile up to lo-1, using held tiles where possible and okeys otherwise.
      if (face.n < lo && lo - face.n <= low) {
        const tiles: MeldTile[] = [{ face, joker: false }]
        const real = [i]
        let used = 0
        for (let p = face.n + 1; p < lo; p++) {
          const idx = faceIndex({ color: face.color, n: p })
          if (counts[idx] > 0) {
            tiles.push({ face: { color: face.color, n: p }, joker: false })
            real.push(idx)
          } else {
            tiles.push(runTile(face.color, p, true))
            used++
          }
        }
        if (used <= jokers) {
          const layoff: Layoff = { meld: k, side: 'low', tiles }
          const next = [face.n, hi, addedLow + tiles.length, addedHigh]
          out.push({ kind: 'layoff', layoff, real, jokers: used, ext: withExt(ext, k, next) })
        }
      }
    })
    return out
  }

  /** With only okeys left: pair them (pairs opener) or lay them off one at a time. */
  function jokerActions(jokers: number, ext: number[][]): Action[] {
    const out: Action[] = []
    if (canPair && jokers >= 2) {
      const face = { color: 'black', n: 0 } as const // placeholder; two okeys are identical
      out.push({ kind: 'pair', pair: [{ face, joker: true }, { face, joker: true }], real: [], jokers: 2, ext: ext })
    }
    if (!canLayOff) return out
    table.forEach((m, k) => {
      if (m.kind === 'set') {
        const [mask] = ext[k]
        const missing = COLORS.findIndex((_, b) => !(mask & (1 << b)))
        if (missing >= 0) {
          const tiles = [{ face: { color: COLORS[missing], n: setNumber(k) }, joker: true }]
          const layoff: Layoff = { meld: k, side: 'set', tiles }
          out.push({ kind: 'layoff', layoff, real: [], jokers: 1, ext: withExt(ext, k, [mask | (1 << missing)]) })
        }
        return
      }
      const [lo, hi, addedLow, addedHigh] = ext[k]
      const { low, high } = room(ext, k)
      const color = runColor(k)
      if (high > 0) {
        const layoff: Layoff = { meld: k, side: 'high', tiles: [runTile(color, hi + 1, true)] }
        out.push({ kind: 'layoff', layoff, real: [], jokers: 1, ext: withExt(ext, k, [lo, hi + 1, addedLow, addedHigh + 1]) })
      } else if (low > 0) {
        const layoff: Layoff = { meld: k, side: 'low', tiles: [runTile(color, lo - 1, true)] }
        out.push({ kind: 'layoff', layoff, real: [], jokers: 1, ext: withExt(ext, k, [lo - 1, hi, addedLow + 1, addedHigh]) })
      }
    })
    return out
  }

  const take = (a: Action, delta: number) => {
    for (const r of a.real) counts[r] += delta
  }
  const actionTiles = (a: Action) => a.meld?.tiles ?? a.pair ?? a.layoff!.tiles

  function best(jokers: number, ext: number[][]): State {
    const i = counts.findIndex((x) => x > 0)
    if (i < 0 && jokers === 0) return { gain: 0, actions: 0, choice: null }
    const key = keyOf(jokers, ext)
    const hit = memo.get(key)
    if (hit) return hit

    let state: State
    let actions: Action[]
    if (i >= 0) {
      counts[i]--
      state = { ...best(jokers, ext), choice: null }
      counts[i]++
      actions = tileActions(i, jokers, ext)
    } else {
      state = { gain: 0, actions: 0, choice: null }
      actions = jokerActions(jokers, ext)
    }

    for (const a of actions) {
      take(a, -1)
      const rest = best(jokers - a.jokers, a.ext)
      take(a, +1)
      const gain = gainOf(actionTiles(a)) + rest.gain
      const n = rest.actions + 1
      if (gain > state.gain || (gain === state.gain && n < state.actions)) state = { gain, actions: n, choice: a }
    }
    memo.set(key, state)
    return state
  }

  let ext = initialExt(table)
  let jokers = hand.jokers
  best(jokers, ext)

  const plan: OpenedPlan = { melds: [], pairs: [], layoffs: [], leftover: [], leftoverJokers: 0, penalty: 0, canMeld, canLayOff }
  for (;;) {
    const i = counts.findIndex((x) => x > 0)
    if (i < 0 && jokers === 0) break
    const { choice } = memo.get(keyOf(jokers, ext))!
    if (!choice) {
      if (i < 0) break // only okeys left, and they stay in hand
      plan.leftover.push(faceAt(i))
      counts[i]--
      continue
    }
    if (choice.meld) plan.melds.push(choice.meld)
    if (choice.pair) plan.pairs.push(choice.pair)
    if (choice.layoff) addLayoff(plan.layoffs, choice.layoff)
    take(choice, -1)
    jokers -= choice.jokers
    ext = choice.ext
  }
  plan.leftoverJokers = jokers
  const left = plan.leftover.reduce((sum, f) => sum + f.n, 0) + jokers * jokerPenalty
  plan.penalty = left * (openedWith === 'pairs' ? rules.pairsPenaltyMultiplier : 1)
  return plan
}

/** Merges lay-offs on the same end of a meld into one, in table order. */
function addLayoff(layoffs: Layoff[], l: Layoff) {
  const same = layoffs.find((x) => x.meld === l.meld && x.side === l.side)
  if (!same) layoffs.push({ ...l, tiles: l.tiles.slice() })
  else if (l.side === 'low') same.tiles = [...l.tiles, ...same.tiles]
  else same.tiles = [...same.tiles, ...l.tiles]
}

/** The table melds after a plan's lay-offs (low tiles prepended, high appended, set tiles added). */
export function applyLayoffs(table: TableMeld[], layoffs: Layoff[]): TableMeld[] {
  const next = table.map((m) => ({ ...m, tiles: m.tiles.slice() }))
  for (const l of layoffs) {
    const m = next[l.meld]
    if (l.side === 'low') m.tiles = [...l.tiles, ...m.tiles]
    else if (l.side === 'high') m.tiles = [...m.tiles, ...l.tiles]
    else m.tiles = [...m.tiles, ...l.tiles].sort((a, b) => COLORS.indexOf(a.face.color) - COLORS.indexOf(b.face.color))
  }
  return next
}
