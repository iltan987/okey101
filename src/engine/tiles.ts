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

/** A tile as picked: a face (the okey face means a real okey) or a false okey. */
export type TileChoice = { kind: 'false' } | Face

/** Copies in the game: 2 of each face and 2 false okeys; the face-up indicator uses up one copy of its face. */
function copiesOf(indicator: Face | null, tile: TileChoice): number {
  return 'kind' in tile || !indicator || !sameFace(indicator, tile) ? 2 : 1
}

function countOf(tiles: HandTile[], tile: TileChoice): number {
  return tiles.filter((t) => ('kind' in tile ? t.kind === 'false' : t.kind === 'face' && sameFace(t, tile))).length
}

/** How many more copies of a tile exist, given the tiles already accounted for (hand, table, ...). */
export function copiesLeft(used: HandTile[], indicator: Face | null, tile: TileChoice): number {
  return copiesOf(indicator, tile) - countOf(used, tile)
}

/** Tiles accounted for more often than the game has them, each listed once. */
export function overLimit(used: HandTile[], indicator: Face | null): TileChoice[] {
  const out: TileChoice[] = []
  for (const t of used) {
    const tile: TileChoice = t.kind === 'false' ? { kind: 'false' } : { color: t.color, n: t.n }
    const seen = out.some((o) => ('kind' in o ? 'kind' in tile : !('kind' in tile) && sameFace(o, tile)))
    if (!seen && copiesLeft(used, indicator, tile) < 0) out.push(tile)
  }
  return out
}

/**
 * Whether another copy of a tile can be added to the hand: at most 22 tiles, and copies left once
 * the hand and anything else in play (`elsewhere`, e.g. table melds) are counted.
 */
export function canAddTile(tiles: HandTile[], indicator: Face | null, tile: TileChoice, elsewhere: HandTile[] = []): boolean {
  return tiles.length < MAX_HAND && copiesLeft([...tiles, ...elsewhere], indicator, tile) > 0
}
