import type { MeldTile } from './melds'
import { faceIndex, type ResolvedTile } from './tiles'

/** A rack always has 30 slots: 2 rows of 15 on wide screens, 3 rows of 10 on phones. */
export const RACK_SLOTS = 30
export const RACK_COLS = 15

/** Tile id per rack slot, row by row (`cols` per row); null = empty slot. */
export type Rack = (string | null)[]

/**
 * Lays out groups (melds or pairs) left to right with a gap between each, never splitting
 * a group across rows, then the leftover tiles sorted by color and number.
 * Falls back to fewer gaps if the rack would overflow.
 */
export function layoutGroups(tiles: ResolvedTile[], groups: MeldTile[][], cols = RACK_COLS): Rack {
  const { groupIds, leftoverIds } = assignIds(tiles, groups)
  return (
    place(groupIds, leftoverIds, cols, { gaps: true, keepRows: true }) ??
    place(groupIds, leftoverIds, cols, { gaps: false, keepRows: true }) ??
    place(groupIds, leftoverIds, cols, { gaps: false, keepRows: false })!
  )
}

/** Matches each group tile to a concrete tile id from the hand. */
function assignIds(tiles: ResolvedTile[], groups: MeldTile[][]) {
  const byFace = new Map<number, string[]>()
  const jokers: string[] = []
  for (const t of tiles) {
    if (t.joker) jokers.push(t.id)
    else {
      const k = faceIndex(t.face)
      byFace.set(k, [...(byFace.get(k) ?? []), t.id])
    }
  }
  const groupIds = groups.map((g) =>
    g.map((t) => (t.joker ? jokers.shift() : byFace.get(faceIndex(t.face))?.shift())).filter((id) => id !== undefined),
  )
  const leftoverIds = [...[...byFace.entries()].sort(([a], [b]) => a - b).flatMap(([, ids]) => ids), ...jokers]
  return { groupIds, leftoverIds }
}

function place(
  groups: string[][],
  leftovers: string[],
  cols: number,
  opts: { gaps: boolean; keepRows: boolean },
): Rack | null {
  const rack: Rack = new Array(RACK_SLOTS).fill(null)
  let pos = 0
  for (const g of groups) {
    const col = pos % cols
    if (opts.keepRows && col + g.length > cols) pos += cols - col
    if (pos + g.length > RACK_SLOTS) return null
    for (const id of g) rack[pos++] = id
    if (opts.gaps && pos % cols !== 0) pos++
  }
  if (pos + leftovers.length > RACK_SLOTS) return null
  for (const id of leftovers) rack[pos++] = id
  return rack
}

/** Keeps a manually arranged rack in sync with the hand: drops removed tiles, adds new ones in the first free slot. */
export function syncRack(rack: Rack, ids: string[]): Rack {
  const keep = new Set(ids)
  const next = rack.map((id) => (id !== null && keep.has(id) ? id : null))
  const placed = new Set(next)
  for (const id of ids) {
    if (placed.has(id)) continue
    const free = next.indexOf(null)
    if (free < 0) break
    next[free] = id
  }
  return next
}

/** Moves the tile at `from` to `to`, swapping if `to` is occupied. */
export function moveTile(rack: Rack, from: number, to: number): Rack {
  const next = rack.slice()
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}
