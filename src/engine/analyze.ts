import { connections, suggestDiscards, type DiscardOption } from './discard'
import { planOpened, type OpenedPlan } from './opened'
import { findPairs, type PairsResult } from './pairs'
import { withDefaults, type Rules } from './rules'
import { solve, type Solution } from './solver'
import type { TableMeld } from './table'
import { faceAt, resolveHand, toCounts, type Counts, type Face, type HandTile } from './tiles'

/** Tiles in hand after drawing, when a discard is due. */
export const FULL_HAND = 22

/** Set once the player has opened (laid down their opening melds or pairs). */
export interface OpenedState {
  with: 'melds' | 'pairs'
  /** Opened on this turn: lay-offs may have to wait (rules.layoffSameTurn). */
  thisTurn: boolean
}

export interface OpenedDiscard {
  face: Face
  /** Penalty left after discarding this tile and playing the rest. */
  penalty: number
  /** Discarding this tile empties the hand. */
  finishes: boolean
}

export interface AnalyzeInput {
  tiles: HandTile[]
  indicator: Face
  rules?: Partial<Rules>
  /** Null until the player has opened. */
  opened?: OpenedState | null
  /** Melds on the table (all players). */
  table?: TableMeld[]
}

export interface Analysis {
  /** Rules the analysis used, with defaults filled in. */
  rules: Rules
  /** Max meld points (opening). */
  melds: Solution
  /** Arrangement that leaves the least penalty in hand. */
  lowestPenalty: Solution
  pairs: PairsResult
  canOpenMelds: boolean
  /** Only when holding a full hand. */
  discards: { melds: DiscardOption[]; pairs: DiscardOption[] } | null
  /** After opening: what to lay down and lay off, and (with a full hand) what to discard. */
  opened: { plan: OpenedPlan; discards: OpenedDiscard[] | null } | null
}

export function analyze({ tiles, indicator, rules: partialRules, opened = null, table = [] }: AnalyzeInput): Analysis {
  const rules = withDefaults(partialRules)
  const { jokerPenalty, wrapRuns } = rules
  const counts = toCounts(resolveHand(tiles, indicator))
  const melds = solve(counts, { jokerPenalty, wrapRuns })
  const pairs = findPairs(counts, rules)
  return {
    rules,
    melds,
    lowestPenalty: solve(counts, { objective: 'penalty', jokerPenalty, wrapRuns }),
    pairs,
    canOpenMelds: melds.points >= rules.openPoints,
    discards:
      tiles.length >= FULL_HAND
        ? { melds: suggestDiscards(counts, 'melds', rules), pairs: suggestDiscards(counts, 'pairs', rules) }
        : null,
    opened: opened && analyzeOpened(counts, tiles.length, table, opened, rules),
  }
}

function analyzeOpened(counts: Counts, size: number, table: TableMeld[], opened: OpenedState, rules: Rules) {
  const opts = { openedWith: opened.with, openedThisTurn: opened.thisTurn, rules }
  const plan = planOpened(counts, table, opts)
  if (size < FULL_HAND) return { plan, discards: null }

  // Try throwing each tile (never the okey) and play the rest; lowest penalty first.
  const discards: (OpenedDiscard & { connections: number })[] = []
  counts.counts.forEach((c, i) => {
    if (c === 0) return
    const rest = counts.counts.slice()
    rest[i]--
    const p = planOpened({ counts: rest, jokers: counts.jokers }, table, opts)
    const face = faceAt(i)
    discards.push({ face, penalty: p.penalty, finishes: p.penalty === 0 && p.leftover.length === 0, connections: connections(counts, face) })
  })
  discards.sort((a, b) => a.penalty - b.penalty || a.connections - b.connections || b.face.n - a.face.n)
  return { plan, discards: discards.slice(0, 3).map(({ face, penalty, finishes }) => ({ face, penalty, finishes })) }
}
