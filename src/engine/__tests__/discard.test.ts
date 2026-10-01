import { describe, expect, it } from 'vitest'
import { connections, suggestDiscards } from '../discard'
import { faceLabel, parseFace, parseHand, resolveHand, toCounts } from '../tiles'

// Okey = K1, so "K1" is a joker.
const countsOf = (hand: string) => toCounts(resolveHand(parseHand(hand), parseFace('K13')))

describe('suggestDiscards', () => {
  it('throws the isolated tile, not one from a meld', () => {
    const [top] = suggestDiscards(countsOf('R10 R11 R12 Y5 B5 K5 B9'))
    expect(faceLabel(top.face)).toBe('B9')
    expect(top.points).toBe(33 + 15)
  })

  it('prefers the tile with fewer connections when points tie', () => {
    // Y2 and B8 are both unmelded; Y2 sits next to Y3, B8 is alone.
    const [top] = suggestDiscards(countsOf('R10 R11 R12 Y2 Y3 B8'))
    expect(faceLabel(top.face)).toBe('B8')
  })

  it('never suggests the okey', () => {
    const options = suggestDiscards(countsOf('K1 R2 Y7 B11'), 'melds', 10)
    expect(options).toHaveLength(3)
  })

  it('keeps pairs intact in pairs strategy', () => {
    const [top] = suggestDiscards(countsOf('R1 R1 Y4 Y4 B7 B7 K9 K9 R13 R13 Y2'), 'pairs')
    expect(faceLabel(top.face)).toBe('Y2')
    expect(top.pairs).toBe(5)
  })
})

describe('connections', () => {
  it('counts neighbors, same-number tiles and copies', () => {
    const hand = countsOf('R5 R5 R6 R3 Y5 K5 R9')
    // copy R5, R3, R6, Y5, K5
    expect(connections(hand, parseFace('R5'))).toBe(5)
    expect(connections(hand, parseFace('R9'))).toBe(0)
  })
})
