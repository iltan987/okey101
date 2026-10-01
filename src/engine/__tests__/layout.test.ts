import { describe, expect, it } from 'vitest'
import { layoutGroups, moveTile, RACK_COLS, RACK_SLOTS, syncRack } from '../layout'
import { findPairs } from '../pairs'
import { solve } from '../solver'
import { parseFace, parseHand, resolveHand, toCounts } from '../tiles'

const rackFor = (hand: string) => {
  const tiles = resolveHand(parseHand(hand), parseFace('K13')) // okey = K1
  const s = solve(toCounts(tiles))
  const rack = layoutGroups(
    tiles,
    s.melds.map((m) => m.tiles),
  )
  const label = (id: string | null) => {
    if (id === null) return '_'
    const t = tiles.find((x) => x.id === id)!
    return t.joker ? '*' : `${t.face.color[0].toUpperCase()}${t.face.n}`
  }
  return { tiles, rack, labels: rack.map(label) }
}

describe('layoutGroups', () => {
  it('places melds with gaps, then sorted leftovers', () => {
    const { labels } = rackFor('Y9 R5 K1 R7 B9 R9 B2 R1')
    // Meld order follows the solver (lowest tile first): R5 *R6 R7, then the 9s set.
    expect(labels.slice(0, 11)).toEqual(['R5', '*', 'R7', '_', 'R9', 'Y9', 'B9', '_', 'R1', 'B2', '_'])
  })

  it('places every tile exactly once', () => {
    const { tiles, rack } = rackFor('R1 R2 R3 R4 Y4 B4 K4 Y10 Y11 Y12 Y13 B6 B7 B8 K7 K8 K9 R11 R12 R13 B1 K1')
    expect(rack).toHaveLength(RACK_SLOTS)
    const placed = rack.filter((x) => x !== null)
    expect(new Set(placed).size).toBe(tiles.length)
  })

  it('moves a group to the next row instead of splitting it', () => {
    // A 12-tile run fills row 0 up to col 11 (+ gap); the next 3-set cannot fit in cols 13-14.
    const { rack } = rackFor('R1 R2 R3 R4 R5 R6 R7 R8 R9 R10 R11 R12 Y13 B13 K13')
    expect(rack.slice(12, RACK_COLS)).toEqual([null, null, null])
    expect(rack.slice(RACK_COLS, RACK_COLS + 3).every((x) => x !== null)).toBe(true)
  })

  it('fits a narrower rack by moving groups down a row', () => {
    const tiles = resolveHand(parseHand('R1 R2 R3 R4 R5 R6 R7 Y9 B9 K9'), parseFace('K13'))
    const s = solve(toCounts(tiles))
    const rack = layoutGroups(
      tiles,
      s.melds.map((m) => m.tiles),
      10,
    )
    // 7-run + gap fills cols 0-7; the 3-set does not fit in cols 8-9, so it starts row 2.
    expect(rack.slice(7, 10)).toEqual([null, null, null])
    expect(rack.slice(10, 13).every((x) => x !== null)).toBe(true)
  })

  it('lays out pairs', () => {
    const tiles = resolveHand(parseHand('R1 R1 Y4 Y4 B7'), parseFace('K13'))
    const rack = layoutGroups(tiles, findPairs(toCounts(tiles)).pairs)
    expect(rack.slice(0, 6).map((x) => x !== null)).toEqual([true, true, false, true, true, false])
  })
})

describe('syncRack', () => {
  it('keeps positions, removes missing tiles, adds new ones', () => {
    const rack = syncRack(['a', null, 'b', ...new Array(RACK_SLOTS - 3).fill(null)], ['b', 'c'])
    expect(rack.slice(0, 3)).toEqual(['c', null, 'b'])
  })
})

describe('moveTile', () => {
  it('swaps two slots', () => {
    expect(moveTile(['a', null, 'b'], 0, 2)).toEqual(['b', null, 'a'])
  })
})
