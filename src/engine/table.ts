import { isValidMeld, type Meld, type MeldTile } from './melds'
import { COLORS, MAX_N, type Color, type ResolvedTile } from './tiles'

/** A meld on the table (any player's), tiles in table order. Jokers carry the face they stand for. */
export type TableMeld = Meld

/**
 * Reads tiles entered in table order (left to right) as a set and/or a run.
 * Returns every valid reading: usually one, two when ambiguous (e.g. R5 + two okeys).
 */
export function readTableMeld(entry: ResolvedTile[], { wrapRuns = false } = {}): TableMeld[] {
  if (entry.length < 3) return []
  const out: TableMeld[] = []
  const set = readSet(entry)
  if (set && isValidMeld(set)) out.push(set)
  const run = readRun(entry)
  if (run && isValidMeld(run, { wrapRuns })) out.push(run)
  return out
}

function readSet(entry: ResolvedTile[]): TableMeld | null {
  const real = entry.filter((t) => !t.joker)
  if (real.length === 0 || entry.length > 4) return null
  const n = real[0].face.n
  const used = new Set(real.map((t) => t.face.color))
  if (real.some((t) => t.face.n !== n) || used.size !== real.length) return null
  // Okeys stand for the missing colors, in color order.
  const free = COLORS.filter((c) => !used.has(c))
  const tiles = entry.map((t): MeldTile => (t.joker ? { face: { color: free.shift()!, n }, joker: true } : { face: t.face, joker: false }))
  return { kind: 'set', tiles }
}

function readRun(entry: ResolvedTile[]): TableMeld | null {
  const firstReal = entry.findIndex((t) => !t.joker)
  if (firstReal < 0) return null
  const color: Color = entry[firstReal].face.color
  if (entry.some((t) => !t.joker && t.face.color !== color)) return null
  // The first real tile fixes every position. A 1 at the end may stand for 14 (after 13).
  const anchor = entry[firstReal].face.n
  const start = anchor - firstReal
  if (start < 1) return null
  const tiles: MeldTile[] = []
  for (let k = 0; k < entry.length; k++) {
    const pos = start + k
    if (pos > MAX_N + 1) return null
    const n = pos === MAX_N + 1 ? 1 : pos
    const t = entry[k]
    if (!t.joker && t.face.n !== n) return null
    tiles.push({ face: { color, n }, joker: t.joker })
  }
  return { kind: 'run', tiles }
}
