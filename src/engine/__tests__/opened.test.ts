import { describe, expect, it } from 'vitest'
import { isValidMeld } from '../melds'
import { applyLayoffs, findOkeySwaps, planOpened, type OpenedOptions } from '../opened'
import { DEFAULT_RULES, type Rules } from '../rules'
import { readTableMeld, type TableMeld } from '../table'
import { COLORS, faceLabel, parseFace, parseHand, resolveHand, toCounts } from '../tiles'
import { mulberry32, randomHand } from './helpers'

// Okey = K1, so "K1" is an okey.
const indicator = parseFace('K13')
const tableOf = (...melds: string[]): TableMeld[] =>
  melds.map((s) => readTableMeld(resolveHand(parseHand(s), indicator), { wrapRuns: true }).at(-1)!)
const plan = (hand: string, table: TableMeld[], opts: Partial<Omit<OpenedOptions, 'rules'>> = {}, rules: Partial<Rules> = {}) =>
  planOpened(toCounts(resolveHand(parseHand(hand), indicator)), table, {
    openedWith: 'melds',
    openedThisTurn: false,
    ...opts,
    rules: { ...DEFAULT_RULES, ...rules },
  })
const show = (tiles: { face: { color: string; n: number }; joker: boolean }[]) =>
  tiles.map((t) => (t.joker ? '*' : '') + faceLabel(t.face as never)).join(' ')

describe('planOpened', () => {
  it('lays off at most 2 tiles per end of a run per turn (table rule example)', () => {
    // Table 6-7-8: 4 5 and 9 10 can be added, 3 and 11 must wait. A pairs opener can't meld them instead.
    const p = plan('R3 R4 R5 R9 R10 R11', tableOf('R6 R7 R8'), { openedWith: 'pairs' })
    expect(p.layoffs.map((l) => `${l.side}: ${show(l.tiles)}`).sort()).toEqual(['high: R9 R10', 'low: R4 R5'])
    expect(p.leftover.map(faceLabel)).toEqual(['R3', 'R11'])
    expect(p.penalty).toBe((3 + 11) * 2) // pairs opener: doubled
  })

  it('lays off everything when there is no per-side limit', () => {
    const p = plan('R3 R4 R5 R9 R10 R11', tableOf('R6 R7 R8'), { openedWith: 'pairs' }, { layoffMaxPerSide: 0 })
    expect(p.leftover).toHaveLength(0)
    expect(p.penalty).toBe(0)
  })

  it('waits a turn before laying off, unless same-turn lay-offs are allowed', () => {
    const table = tableOf('R6 R7 R8')
    const now = plan('R9 Y2', table, { openedThisTurn: true })
    expect(now.canLayOff).toBe(false)
    expect(now.layoffs).toHaveLength(0)
    const allowed = plan('R9 Y2', table, { openedThisTurn: true }, { layoffSameTurn: true })
    expect(allowed.layoffs).toHaveLength(1)
  })

  it('lets a melds opener lay down new melds as well as lay off', () => {
    const p = plan('B1 B2 B3 R9 Y5', tableOf('R6 R7 R8'))
    expect(p.melds.map((m) => show(m.tiles))).toEqual(['B1 B2 B3'])
    expect(p.layoffs.map((l) => show(l.tiles))).toEqual(['R9'])
    expect(p.leftover.map(faceLabel)).toEqual(['Y5'])
  })

  it('stops a pairs opener from laying down new melds, but allows new pairs', () => {
    const p = plan('B1 B2 B3 Y5 Y5', [], { openedWith: 'pairs' })
    expect(p.canMeld).toBe(false)
    expect(p.melds).toHaveLength(0)
    expect(p.pairs.map(show)).toEqual(['Y5 Y5'])
    expect(p.leftover.map(faceLabel)).toEqual(['B1', 'B2', 'B3'])
    const relaxed = plan('B1 B2 B3 Y5 Y5', [], { openedWith: 'pairs' }, { pairsOpenerCanMeld: true })
    expect(relaxed.melds).toHaveLength(1)
  })

  it('adds the missing color to a set, but not to a full set', () => {
    expect(plan('K9', tableOf('R9 Y9 B9')).layoffs.map((l) => show(l.tiles))).toEqual(['K9'])
    expect(plan('K9', tableOf('R9 Y9 B9 K9')).leftover.map(faceLabel)).toEqual(['K9'])
  })

  it('lays off a lone okey rather than keep it', () => {
    const p = plan('K1', tableOf('R6 R7 R8'))
    expect(p.leftoverJokers).toBe(0)
    expect(p.penalty).toBe(0)
  })

  it('fills a gap with an okey, and counts it toward the per-side limit', () => {
    const table = tableOf('R6 R7 R8')
    expect(plan('K1 R10', table).layoffs.map((l) => show(l.tiles))).toEqual(['*R9 R10'])
    // With a limit of 1, *R9 R10 is too many on one end: only the okey goes. (Pairs opener without
    // okey-in-pairs, so R10 can't be melded or paired instead.)
    const limited = plan('K1 R10', table, { openedWith: 'pairs' }, { layoffMaxPerSide: 1, okeyInPairs: false })
    expect(limited.layoffs.map((l) => show(l.tiles))).toEqual(['*R9'])
    expect(limited.leftover.map(faceLabel)).toEqual(['R10'])
  })

  it('merges tiles laid off on the same end into one lay-off', () => {
    const p = plan('R9 R10', tableOf('R6 R7 R8'), { openedWith: 'pairs' })
    expect(p.layoffs.map((l) => `${l.side}: ${show(l.tiles)}`)).toEqual(['high: R9 R10'])
  })

  it('adds a 1 after 13 only with 12-13-1 runs', () => {
    const table = tableOf('R11 R12 R13')
    expect(plan('R1', table).leftover.map(faceLabel)).toEqual(['R1'])
    expect(plan('R1', table, {}, { wrapRuns: true }).layoffs.map((l) => show(l.tiles))).toEqual(['R1'])
  })

  describe('taking an okey from the table', () => {
    it('finds the tile an okey stands for in a run, or any missing color in a set', () => {
      const hand = toCounts(resolveHand(parseHand('R6 B9 K9'), indicator))
      const swaps = findOkeySwaps(hand, tableOf('R5 K1 R7', 'R9 Y9 K1'))
      expect(swaps.map((s) => `${s.meld}:${s.index}:${faceLabel(s.give)}`)).toEqual(['0:1:R6', '1:2:B9', '1:2:K9'])
    })

    it('swaps when the taken okey can be played', () => {
      // Give R6 for the okey, then lay the okey off on 9-10-11 → nothing left.
      const p = plan('R6', tableOf('R5 K1 R7', 'Y9 Y10 Y11'))
      expect(p.swaps.map((s) => faceLabel(s.give))).toEqual(['R6'])
      expect(p.penalty).toBe(0)
    })

    it('does not swap when the taken okey could not be played', () => {
      // A full 1-13 run has no room left: taking its okey would leave 101 in hand instead of 6.
      const p = plan('R6', tableOf('R1 R2 R3 R4 R5 K1 R7 R8 R9 R10 R11 R12 R13'))
      expect(p.swaps).toHaveLength(0)
      expect(p.penalty).toBe(6)
    })

    it('waits for lay-offs to be allowed, like other lay-offs', () => {
      expect(plan('R6', tableOf('R5 K1 R7', 'Y9 Y10 Y11'), { openedThisTurn: true }).swaps).toHaveLength(0)
    })

    it('can be turned off', () => {
      expect(plan('R6', tableOf('R5 K1 R7', 'Y9 Y10 Y11'), {}, { okeySwap: false }).swaps).toHaveLength(0)
    })
  })

  it('keeps table melds valid and conserves tiles on random hands', () => {
    const rand = mulberry32(5)
    for (let k = 0; k < 150; k++) {
      const rules: Rules = { ...DEFAULT_RULES, wrapRuns: rand() < 0.5, layoffMaxPerSide: Math.floor(rand() * 3) }
      const hand = randomHand(rand, 8 + Math.floor(rand() * 10))
      const resolved = resolveHand(hand, indicator)
      const table = randomTable(rand)
      const openedWith = rand() < 0.5 ? 'melds' : 'pairs'
      const p = planOpened(toCounts(resolved), table, { openedWith, openedThisTurn: false, rules })
      const after = applyLayoffs(table, p.layoffs)
      for (const m of [...after, ...p.melds]) expect(isValidMeld(m, rules), JSON.stringify(m)).toBe(true)
      // Per-side limit holds.
      if (rules.layoffMaxPerSide > 0) {
        for (const [i, m] of table.entries()) {
          for (const side of ['low', 'high'] as const) {
            const added = p.layoffs.filter((l) => l.meld === i && l.side === side).reduce((n, l) => n + l.tiles.length, 0)
            if (m.kind === 'run') expect(added).toBeLessThanOrEqual(rules.layoffMaxPerSide)
          }
        }
      }
      const used =
        p.melds.reduce((n, m) => n + m.tiles.length, 0) +
        p.pairs.length * 2 +
        p.layoffs.reduce((n, l) => n + l.tiles.length, 0)
      expect(used + p.leftover.length + p.leftoverJokers).toBe(hand.length)
      if (openedWith === 'pairs') expect(p.melds).toHaveLength(0)
    }
  })
})

/** A few random valid table melds (runs and sets, with the odd okey). */
function randomTable(rand: () => number): TableMeld[] {
  const out: TableMeld[] = []
  for (let k = 0; k < 1 + Math.floor(rand() * 4); k++) {
    const color = COLORS[Math.floor(rand() * 4)]
    if (rand() < 0.5) {
      const len = 3 + Math.floor(rand() * 3)
      const start = 1 + Math.floor(rand() * (14 - len))
      out.push({ kind: 'run', tiles: Array.from({ length: len }, (_, i) => ({ face: { color, n: start + i }, joker: rand() < 0.1 })) })
    } else {
      const n = 1 + Math.floor(rand() * 13)
      const colors = COLORS.filter(() => rand() < 0.8).slice(0, 4)
      if (colors.length < 3) continue
      out.push({ kind: 'set', tiles: colors.map((c) => ({ face: { color: c, n }, joker: rand() < 0.1 })) })
    }
  }
  return out
}
