import type { MeldTile } from './melds'
import { applyLayoffs, type OpenedPlan } from './opened'
import type { TableMeld } from './table'
import { resolveHand, sameFace, type Face, type HandTile } from './tiles'

/**
 * The hand after playing `used` tiles from it. Okeys taken from the table (`jokersFromTable`) are
 * played first, so only the rest come out of the hand. Throws if the hand doesn't hold a tile.
 */
export function removeFromHand(tiles: HandTile[], indicator: Face, used: MeldTile[], jokersFromTable = 0): HandTile[] {
  const left = resolveHand(tiles, indicator)
  let jokers = used.filter((t) => t.joker).length - jokersFromTable
  const take = (match: (t: (typeof left)[number]) => boolean) => {
    const k = left.findIndex(match)
    if (k < 0) throw new Error('Tile not in hand')
    left.splice(k, 1)
  }
  for (const t of used) if (!t.joker) take((x) => !x.joker && sameFace(x.face, t.face))
  for (; jokers > 0; jokers--) take((x) => x.joker)
  const ids = new Set(left.map((t) => t.id))
  return tiles.filter((t) => ids.has(t.id))
}

/** Every tile a plan plays from the hand, including those given for table okeys. */
export function planTiles(plan: OpenedPlan): MeldTile[] {
  return [
    ...plan.swaps.map((s) => ({ face: s.give, joker: false })),
    ...plan.melds.flatMap((m) => m.tiles),
    ...plan.pairs.flat(),
    ...plan.layoffs.flatMap((l) => l.tiles),
  ]
}

/** The table after a plan: okeys swapped out, lay-offs added, new melds put down. */
export function tableAfter(table: TableMeld[], plan: OpenedPlan): TableMeld[] {
  const swapped = table.map((m, i) => ({
    ...m,
    tiles: m.tiles.map((t, j) => {
      const s = plan.swaps.find((x) => x.meld === i && x.index === j)
      return s ? { face: s.give, joker: false } : t
    }),
  }))
  return [...applyLayoffs(swapped, plan.layoffs), ...plan.melds]
}
