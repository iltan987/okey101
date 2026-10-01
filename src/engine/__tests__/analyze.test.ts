import { describe, expect, it } from 'vitest'
import { analyze } from '../analyze'
import { parseFace, parseHand } from '../tiles'
import { mulberry32, randomHand } from './helpers'

describe('analyze', () => {
  it('reports opening and pairs for a hand', () => {
    const a = analyze({
      tiles: parseHand('R10 R11 R12 R13 Y11 B11 K11 B5 B6 B7 B8 Y2 K3'),
      indicator: parseFace('K13'),
    })
    expect(a.melds.points).toBe(105)
    expect(a.canOpenMelds).toBe(true)
    expect(a.discards).toBeNull()
  })

  it('applies opening thresholds and okey penalty from the rules', () => {
    const tiles = parseHand('R10 R11 R12 R13 Y11 B11 K11 B5 B6 B7 B8 Y2 K3 R1 R1 Y4 Y4 B12 K9 K9 R2 K1')
    const indicator = parseFace('K13') // okey = K1
    const standard = analyze({ tiles, indicator })
    expect(standard.canOpenMelds).toBe(true)
    expect(standard.pairs.canOpen).toBe(false)

    const strict = analyze({ tiles, indicator, rules: { openPoints: 200, pairsToOpen: 4, jokerPenalty: 50 } })
    expect(strict.canOpenMelds).toBe(false)
    expect(strict.pairs.canOpen).toBe(true)
    expect(strict.rules.openPoints).toBe(200)
    expect(strict.rules.okeyInPairs).toBe(true) // untouched rules keep their defaults
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
