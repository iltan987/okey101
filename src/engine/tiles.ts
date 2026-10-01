export const COLORS = ['red', 'yellow', 'blue', 'black'] as const
export type Color = (typeof COLORS)[number]

export const MAX_N = 13
/** Number of distinct faces (4 colors × 13 numbers). */
export const FACE_COUNT = COLORS.length * MAX_N

export interface Face {
  color: Color
  n: number
}

/** A tile as the player enters it. A false okey (sahte okey) has no face of its own. */
export type HandTile =
  | { id: string; kind: 'face'; color: Color; n: number }
  | { id: string; kind: 'false' }

/** A tile after the okey has been resolved from the indicator. */
export interface ResolvedTile {
  id: string
  /** True for the real okey (wild). */
  joker: boolean
  /** Face the tile counts as. For jokers this is the okey face. */
  face: Face
}

export function faceIndex(f: Face): number {
  return COLORS.indexOf(f.color) * MAX_N + (f.n - 1)
}

export function faceAt(index: number): Face {
  return { color: COLORS[Math.floor(index / MAX_N)], n: (index % MAX_N) + 1 }
}

export function sameFace(a: Face, b: Face): boolean {
  return a.color === b.color && a.n === b.n
}

/** The okey is the tile one above the indicator, same color; 13 wraps to 1. */
export function okeyFromIndicator(indicator: Face): Face {
  return { color: indicator.color, n: indicator.n === MAX_N ? 1 : indicator.n + 1 }
}

/** Real copies of the okey face become jokers; false okeys take the okey's face. */
export function resolveHand(tiles: HandTile[], indicator: Face): ResolvedTile[] {
  const okey = okeyFromIndicator(indicator)
  return tiles.map((t) => {
    if (t.kind === 'false') return { id: t.id, joker: false, face: okey }
    const face = { color: t.color, n: t.n }
    return { id: t.id, joker: sameFace(face, okey), face }
  })
}

/** Count of each face (by faceIndex) plus number of jokers. */
export interface Counts {
  counts: number[]
  jokers: number
}

export function toCounts(tiles: ResolvedTile[]): Counts {
  const counts = new Array<number>(FACE_COUNT).fill(0)
  let jokers = 0
  for (const t of tiles) {
    if (t.joker) jokers++
    else counts[faceIndex(t.face)]++
  }
  return { counts, jokers }
}

const LETTER: Record<Color, string> = { red: 'R', yellow: 'Y', blue: 'B', black: 'K' }
const BY_LETTER: Record<string, Color> = { R: 'red', Y: 'yellow', B: 'blue', K: 'black' }

/** Short label like "R7" (K = black). */
export function faceLabel(f: Face): string {
  return `${LETTER[f.color]}${f.n}`
}

/**
 * Parse "R7 Y12 B1 K13 F" into hand tiles (F = false okey). Used by tests.
 * Ids are assigned sequentially: t0, t1, ...
 */
export function parseHand(s: string): HandTile[] {
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((tok, i): HandTile => {
      const id = `t${i}`
      if (tok.toUpperCase() === 'F') return { id, kind: 'false' }
      const color = BY_LETTER[tok[0].toUpperCase()]
      const n = Number(tok.slice(1))
      if (!color || !Number.isInteger(n) || n < 1 || n > MAX_N) throw new Error(`Bad tile: ${tok}`)
      return { id, kind: 'face', color, n }
    })
}

export function parseFace(s: string): Face {
  const [t] = parseHand(s)
  if (t.kind !== 'face') throw new Error(`Not a face: ${s}`)
  return { color: t.color, n: t.n }
}

/** Max tiles in hand (21 dealt, +1 after drawing). */
export const MAX_HAND = 22

/**
 * Whether another copy of a tile can be added: the deck has 2 of each face and 2 false okeys,
 * and the face-up indicator uses up one copy of its face.
 */
export function canAddTile(tiles: HandTile[], indicator: Face | null, tile: { kind: 'false' } | Face): boolean {
  if (tiles.length >= MAX_HAND) return false
  if ('kind' in tile) return tiles.filter((t) => t.kind === 'false').length < 2
  const held = tiles.filter((t) => t.kind === 'face' && sameFace(t, tile)).length
  const limit = indicator && sameFace(indicator, tile) ? 1 : 2
  return held < limit
}
