import { describe, expect, it } from 'vitest'
import { isValidMeld, meldPoints } from '../melds'
import { solve } from '../solver'
import { COLORS, faceLabel, parseFace, parseHand, resolveHand, toCounts } from '../tiles'
import { mulberry32, randomHand } from './helpers'

// Okey = K1 unless stated, so "K1" in a hand is a joker.
const solveHand = (hand: string, indicator = 'K13', opts = {}) =>
  solve(toCounts(resolveHand(parseHand(hand), parseFace(indicator))), opts)

const labels = (s: ReturnType<typeof solve>) =>
  s.melds.map((m) => m.tiles.map((t) => (t.joker ? `*${faceLabel(t.face)}` : faceLabel(t.face))).join(' '))

describe('solve', () => {
  it('finds a 101+ opening', () => {
    const s = solveHand('R10 R11 R12 R13 Y11 B11 K11 B5 B6 B7 B8 Y2 K3')
    expect(s.points).toBe(46 + 33 + 26)
    expect(s.leftover.map(faceLabel).sort()).toEqual(['K3', 'Y2'])
  })

  it('fills a run gap with a joker', () => {
    const s = solveHand('R5 K1 R7')
    expect(labels(s)).toEqual(['R5 *R6 R7'])
    expect(s.points).toBe(18)
  })

  it('completes a set with a joker', () => {
    const s = solveHand('R9 Y9 B9 K1')
    expect(s.points).toBe(36)
    expect(s.melds).toHaveLength(1)
    expect(s.melds[0].kind).toBe('set')
  })

  it('treats a false okey as the okey face', () => {
    // Indicator K4 → okey K5, so F plays as K5.
    const s = solveHand('K3 K4 F', 'K4')
    expect(labels(s)).toEqual(['K3 K4 K5'])
  })

  it('does not wrap runs from 13 to 1', () => {
    expect(solveHand('R12 R13 R1').points).toBe(0)
  })

  describe('with 12-13-1 runs allowed', () => {
    const wrap = { wrapRuns: true }
    it('accepts a 1 after 13', () => {
      expect(labels(solveHand('R12 R13 R1', 'K13', wrap))).toEqual(['R12 R13 R1'])
      expect(solveHand('R11 R12 R13 R1', 'K13', wrap).points).toBe(37)
    })
    it('still rejects 13-1-2', () => {
      expect(solveHand('R13 R1 R2', 'K13', wrap).points).toBe(0)
    })
    it('lets an okey be the 1 after 13', () => {
      // R12 R13 + okey: as R11 (11 points) beats as R1 (1 point) when maximizing points.
      expect(solveHand('R12 R13 K1', 'K13', wrap).points).toBe(36)
    })
    it('never builds a 2-tile run with a wrapped okey', () => {
      const s = solveHand('R13 K1', 'K13', wrap)
      expect(s.melds).toHaveLength(0)
    })
    it('only produces valid melds on random hands', () => {
      const rand = mulberry32(99)
      for (let k = 0; k < 200; k++) {
        const s = solve(toCounts(resolveHand(randomHand(rand, 22), { color: 'red', n: 1 + Math.floor(rand() * 13) })), wrap)
        for (const m of s.melds) expect(isValidMeld(m, wrap)).toBe(true)
      }
    })
  })

  it('picks the higher-scoring meld when tiles overlap', () => {
    // R7-R8-R9 = 24 vs. R9-Y9-B9 = 27
    expect(solveHand('R7 R8 R9 Y9 B9').points).toBe(27)
  })

  it('uses both copies of a tile', () => {
    expect(solveHand('R3 R4 R5 R3 R4 R5').points).toBe(24)
  })

  it('keeps a long run whole instead of splitting it on ties', () => {
    expect(labels(solveHand('R1 R2 R3 R4 R5 R6'))).toEqual(['R1 R2 R3 R4 R5 R6'])
  })

  it('charges the joker penalty for an unplayed okey', () => {
    const s = solveHand('K1 R1', 'K13', { objective: 'penalty' })
    expect(s.leftoverJokers).toBe(1)
    expect(s.penalty).toBe(1 + 101)
  })

  it('prefers melding the joker when minimizing penalty', () => {
    // Points mode: R11 R12 R13 + joker as R10 = 46. Penalty mode does the same here,
    // but must never leave the joker in hand if it can be played.
    const s = solveHand('R11 R12 R13 K1 Y2', 'K13', { objective: 'penalty' })
    expect(s.leftoverJokers).toBe(0)
    expect(s.penalty).toBe(2)
  })

  it('only produces valid melds and conserves tiles on random hands', () => {
    const rand = mulberry32(42)
    for (let k = 0; k < 200; k++) {
      const hand = randomHand(rand, 22)
      const indicator = { color: COLORS[Math.floor(rand() * 4)], n: 1 + Math.floor(rand() * 13) }
      const resolved = resolveHand(hand, indicator)
      const s = solve(toCounts(resolved))
      for (const m of s.melds) expect(isValidMeld(m)).toBe(true)
      const used = s.melds.reduce((n, m) => n + m.tiles.length, 0)
      expect(used + s.leftover.length + s.leftoverJokers).toBe(22)
      expect(s.points).toBe(s.melds.reduce((n, m) => n + meldPoints(m), 0))
    }
  })

  it('solves 22-tile hands quickly', () => {
    const rand = mulberry32(7)
    const hands = Array.from({ length: 50 }, () =>
      toCounts(resolveHand(randomHand(rand, 22), { color: 'red', n: 1 + Math.floor(rand() * 13) })),
    )
    const t0 = performance.now()
    for (const h of hands) solve(h)
    expect((performance.now() - t0) / hands.length).toBeLessThan(50)
  })
})
