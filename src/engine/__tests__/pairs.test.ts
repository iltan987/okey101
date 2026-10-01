import { describe, expect, it } from 'vitest'
import { findPairs } from '../pairs'
import { faceLabel, parseFace, parseHand, resolveHand, toCounts } from '../tiles'

// Okey = K1, so "K1" is a joker.
const pairsOf = (hand: string) => findPairs(toCounts(resolveHand(parseHand(hand), parseFace('K13'))))

describe('findPairs', () => {
  it('opens with 5 identical pairs', () => {
    const r = pairsOf('R1 R1 Y4 Y4 B7 B7 K9 K9 R13 R13 Y2')
    expect(r.pairs).toHaveLength(5)
    expect(r.canOpen).toBe(true)
    expect(r.leftover.map(faceLabel)).toEqual(['Y2'])
    expect(r.penalty).toBe(2)
  })

  it('cannot open with 4 pairs', () => {
    expect(pairsOf('R1 R1 Y4 Y4 B7 B7 K9 K9 R13').canOpen).toBe(false)
  })

  it('pairs jokers with the highest singles', () => {
    const r = pairsOf('R2 R12 K1')
    expect(r.pairs).toHaveLength(1)
    expect(faceLabel(r.pairs[0][0].face)).toBe('R12')
    expect(r.leftover.map(faceLabel)).toEqual(['R2'])
  })

  it('pairs two jokers together when no singles are left', () => {
    const r = pairsOf('R3 R3 K1 K1')
    expect(r.pairs).toHaveLength(2)
    expect(r.leftoverJokers).toBe(0)
  })
})
