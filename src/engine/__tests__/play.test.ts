import { describe, expect, it } from 'vitest'
import { planOpened } from '../opened'
import { planTiles, removeFromHand, tableAfter } from '../play'
import { DEFAULT_RULES } from '../rules'
import { readTableMeld, type TableMeld } from '../table'
import { faceLabel, parseFace, parseHand, resolveHand, toCounts, type HandTile } from '../tiles'

// Okey = K1, so "K1" is an okey and "F" a false okey (plays as K1).
const indicator = parseFace('K13')
const meldOf = (s: string): TableMeld => readTableMeld(resolveHand(parseHand(s), indicator)).at(-1)!
const label = (tiles: HandTile[]) =>
  resolveHand(tiles, indicator).map((t) => (t.joker ? '*' : '') + faceLabel(t.face))
const show = (m: TableMeld) => m.tiles.map((t) => (t.joker ? '*' : '') + faceLabel(t.face)).join(' ')

describe('removeFromHand', () => {
  it('removes the played tiles, okeys and false okeys included', () => {
    const hand = parseHand('R5 K1 R7 F Y9 Y9')
    const used = [...meldOf('R5 K1 R7').tiles, { face: parseFace('K1'), joker: false }, { face: parseFace('Y9'), joker: false }]
    expect(label(removeFromHand(hand, indicator, used))).toEqual(['Y9'])
  })

  it('plays okeys taken from the table before the hand’s own', () => {
    const hand = parseHand('K1 R5 R7')
    expect(label(removeFromHand(hand, indicator, meldOf('R5 K1 R7').tiles, 1))).toEqual(['*K1'])
  })

  it('refuses tiles the hand does not hold', () => {
    expect(() => removeFromHand(parseHand('R5'), indicator, meldOf('R5 R6 R7').tiles)).toThrow()
  })
})

describe('playing a plan', () => {
  it('updates the hand and table: swap, lay off, new meld', () => {
    const table = [meldOf('R5 K1 R7'), meldOf('Y9 Y10 Y11')]
    const hand = parseHand('R6 Y12 B1 B2 B3 K4')
    const plan = planOpened(toCounts(resolveHand(hand, indicator)), table, {
      openedWith: 'melds',
      openedThisTurn: false,
      rules: DEFAULT_RULES,
    })
    expect(plan.swaps).toHaveLength(1)
    expect(label(removeFromHand(hand, indicator, planTiles(plan), plan.swaps.length))).toEqual(plan.leftover.map(faceLabel))
    const after = tableAfter(table, plan)
    expect(after.slice(0, 2).map(show)).toEqual(['R5 R6 R7', 'Y9 Y10 Y11 Y12'])
    expect(after.slice(2).every((m) => m.tiles.length >= 3)).toBe(true)
  })
})
