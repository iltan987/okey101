import { describe, expect, it } from 'vitest'
import { analyze } from '../analyze'
import { parseFace, parseHand } from '../tiles'
import { mulberry32, randomHand } from './helpers'

describe('analyze', () => {
  it('reports opening, pairs and racks for a hand', () => {
    const a = analyze({
      tiles: parseHand('R10 R11 R12 R13 Y11 B11 K11 B5 B6 B7 B8 Y2 K3'),
      indicator: parseFace('K13'),
    })
    expect(a.melds.points).toBe(105)
    expect(a.canOpenMelds).toBe(true)
    expect(a.meldRack.filter((x) => x !== null)).toHaveLength(13)
    expect(a.pairsRack.filter((x) => x !== null)).toHaveLength(13)
    expect(a.discards).toBeNull()
  })

  it('suggests discards for a full hand within a reasonable time', () => {
    const rand = mulberry32(3)
    const t0 = performance.now()
    for (let k = 0; k < 10; k++) {
      const a = analyze({ tiles: randomHand(rand, 22), indicator: parseFace('Y7') })
      expect(a.discards?.melds.length).toBeGreaterThan(0)
    }
    expect((performance.now() - t0) / 10).toBeLessThan(500)
  })
})
