import { describe, expect, it } from 'vitest'
import { readTableMeld } from '../table'
import { faceLabel, parseFace, parseHand, resolveHand } from '../tiles'

// Okey = K1, so "K1" is an okey.
const read = (s: string, opts = {}) =>
  readTableMeld(resolveHand(parseHand(s), parseFace('K13')), opts).map(
    (m) => `${m.kind}: ${m.tiles.map((t) => (t.joker ? '*' : '') + faceLabel(t.face)).join(' ')}`,
  )

describe('readTableMeld', () => {
  it('reads a run and places the okey by position', () => {
    expect(read('R5 K1 R7')).toEqual(['run: R5 *R6 R7'])
    expect(read('K1 R6 R7')).toEqual(['run: *R5 R6 R7'])
  })

  it('reads a set and gives the okey a missing color', () => {
    expect(read('R9 Y9 K1')).toEqual(['set: R9 Y9 *B9'])
  })

  it('offers both readings when ambiguous', () => {
    expect(read('R5 K1 K1')).toEqual(['set: R5 *Y5 *B5', 'run: R5 *R6 *R7'])
  })

  it('rejects tiles out of order or mixed', () => {
    expect(read('R7 R5 R6')).toEqual([])
    expect(read('R5 Y6 R7')).toEqual([])
    expect(read('R5 R5 R5')).toEqual([])
  })

  it('does not run below 1', () => {
    expect(read('K1 R1 R2')).toEqual([])
  })

  it('reads 12-13-1 only with wrapRuns', () => {
    expect(read('R12 R13 R1')).toEqual([])
    expect(read('R12 R13 R1', { wrapRuns: true })).toEqual(['run: R12 R13 R1'])
    expect(read('R12 R13 K1', { wrapRuns: true })).toEqual(['run: R12 R13 *R1'])
  })
})
