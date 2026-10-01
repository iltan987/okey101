import { describe, expect, it } from 'vitest'
import {
  canAddTile,
  FACE_COUNT,
  faceAt,
  faceIndex,
  faceLabel,
  okeyFromIndicator,
  parseFace,
  parseHand,
  resolveHand,
  toCounts,
} from '../tiles'

describe('faceIndex / faceAt', () => {
  it('round-trips every face', () => {
    for (let i = 0; i < FACE_COUNT; i++) expect(faceIndex(faceAt(i))).toBe(i)
  })
})

describe('okeyFromIndicator', () => {
  it('is one above the indicator in the same color', () => {
    expect(okeyFromIndicator(parseFace('R5'))).toEqual(parseFace('R6'))
  })
  it('wraps 13 to 1', () => {
    expect(okeyFromIndicator(parseFace('B13'))).toEqual(parseFace('B1'))
  })
})

describe('resolveHand', () => {
  const indicator = parseFace('Y4') // okey = Y5

  it('turns real okey copies into jokers', () => {
    const [t] = resolveHand(parseHand('Y5'), indicator)
    expect(t.joker).toBe(true)
  })

  it('makes false okeys plain tiles with the okey face', () => {
    const [t] = resolveHand(parseHand('F'), indicator)
    expect(t).toEqual({ id: 't0', joker: false, face: parseFace('Y5') })
  })

  it('leaves other tiles unchanged', () => {
    const [t] = resolveHand(parseHand('K5'), indicator)
    expect(t.joker).toBe(false)
    expect(faceLabel(t.face)).toBe('K5')
  })
})

describe('toCounts', () => {
  it('counts faces and jokers separately', () => {
    const { counts, jokers } = toCounts(resolveHand(parseHand('R1 R1 B7 Y5 F'), parseFace('Y4')))
    expect(jokers).toBe(1)
    expect(counts[faceIndex(parseFace('R1'))]).toBe(2)
    expect(counts[faceIndex(parseFace('Y5'))]).toBe(1) // the false okey
    expect(counts.reduce((a, b) => a + b, 0)).toBe(4)
  })
})

describe('parseHand', () => {
  it('rejects bad tokens', () => {
    expect(() => parseHand('R14')).toThrow()
    expect(() => parseHand('X3')).toThrow()
  })
})

describe('canAddTile', () => {
  const R5 = parseFace('R5')
  it('allows two copies of a face', () => {
    expect(canAddTile(parseHand('R5'), null, R5)).toBe(true)
    expect(canAddTile(parseHand('R5 R5'), null, R5)).toBe(false)
  })
  it('allows only one copy of the indicator face', () => {
    expect(canAddTile(parseHand('R5'), R5, R5)).toBe(false)
  })
  it('allows two false okeys', () => {
    expect(canAddTile(parseHand('F'), R5, { kind: 'false' })).toBe(true)
    expect(canAddTile(parseHand('F F'), R5, { kind: 'false' })).toBe(false)
  })
  it('caps the hand at 22 tiles', () => {
    const full = parseHand(Array.from({ length: 22 }, (_, i) => `R${(i % 11) + 1}`).join(' '))
    expect(canAddTile(full, null, parseFace('K13'))).toBe(false)
  })
})
