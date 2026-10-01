import { COLORS, type HandTile } from '../tiles'

/** Deal `size` tiles from a full 106-tile deck (2 × 52 faces + 2 false okeys). */
export function randomHand(rand: () => number, size: number): HandTile[] {
  const deck: HandTile[] = []
  for (const color of COLORS)
    for (let n = 1; n <= 13; n++)
      for (let c = 0; c < 2; c++) deck.push({ id: `${color}${n}-${c}`, kind: 'face', color, n })
  deck.push({ id: 'f0', kind: 'false' }, { id: 'f1', kind: 'false' })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck.slice(0, size)
}

export function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
