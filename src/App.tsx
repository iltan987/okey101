import { useEffect, useMemo } from 'react'
import { DiscardNotice } from './components/DiscardNotice'
import { IndicatorPicker } from './components/IndicatorPicker'
import { Rack } from './components/Rack'
import { ResultsPanel } from './components/ResultsPanel'
import { RotateHint } from './components/RotateHint'
import { RulesPanel } from './components/RulesPanel'
import { TablePanel } from './components/TablePanel'
import { TilePicker } from './components/TilePicker'
import type { OpenedState } from './engine/analyze'
import { layoutGroups, RACK_SLOTS, syncRack, type Rack as RackSlots } from './engine/layout'
import type { MeldTile } from './engine/melds'
import { planTiles, removeFromHand, tableAfter } from './engine/play'
import { withDefaults, type Rules } from './engine/rules'
import type { TableMeld } from './engine/table'
import { okeyFromIndicator, resolveHand, sameFace, type Face, type HandTile } from './engine/tiles'
import { useAnalysis } from './hooks/useAnalysis'
import { usePersistentState } from './hooks/usePersistentState'
import { useUndoHistory } from './hooks/useUndoHistory'
import './App.css'

const EMPTY_RACK: RackSlots = new Array(RACK_SLOTS).fill(null)

interface Snapshot {
  indicator: Face | null
  tiles: HandTile[]
  rack: RackSlots
  opened: OpenedState | null
  table: TableMeld[]
}

export default function App() {
  const [indicator, setIndicator] = usePersistentState<Face | null>('okey101.indicator', null)
  const [tiles, setTiles] = usePersistentState<HandTile[]>('okey101.tiles', [])
  const [savedRack, setRack] = usePersistentState<RackSlots>('okey101.rack', EMPTY_RACK)
  const [savedRules, setRules] = usePersistentState<Partial<Rules>>('okey101.rules', {})
  const rules = withDefaults(savedRules)
  const [opened, setOpened] = usePersistentState<OpenedState | null>('okey101.opened', null)
  const [table, setTable] = usePersistentState<TableMeld[]>('okey101.table', [])
  const okey = indicator ? okeyFromIndicator(indicator) : null
  // Always reconcile, so the rack can never lose or duplicate a tile.
  const rack = syncRack(savedRack, tiles.map((t) => t.id))

  const input = useMemo(
    () => (indicator && tiles.length > 0 ? { tiles, indicator, rules: savedRules, opened, table } : null),
    [tiles, indicator, savedRules, opened, table],
  )
  const { result, pending } = useAnalysis(input)

  // Every change goes through these, so each one can be undone.
  const history = useUndoHistory<Snapshot>()
  const remember = () => history.push({ indicator, tiles, rack, opened, table })

  const updateTiles = (next: HandTile[]) => {
    remember()
    setTiles(next)
    setRack(syncRack(rack, next.map((t) => t.id)))
  }

  const changeRack = (next: RackSlots) => {
    if (next.every((id, i) => id === rack[i])) return
    remember()
    setRack(next)
  }

  const changeIndicator = (face: Face) => {
    if (indicator && sameFace(face, indicator)) return
    remember()
    setIndicator(face)
  }

  const undo = () => {
    const prev = history.pop()
    if (!prev) return
    setIndicator(prev.indicator)
    setTiles(prev.tiles)
    setRack(prev.rack)
    setOpened(prev.opened)
    setTable(prev.table)
  }

  const changeOpened = (next: OpenedState | null) => {
    remember()
    setOpened(next)
  }

  const changeTable = (next: TableMeld[]) => {
    remember()
    setTable(next)
  }

  /** Plays tiles from the hand onto the table, as one undoable step. */
  const play = (used: MeldTile[], jokersFromTable: number, nextTable: TableMeld[], nextOpened: OpenedState) => {
    if (!indicator) return
    const next = removeFromHand(tiles, indicator, used, jokersFromTable)
    remember()
    setTiles(next)
    setRack(syncRack(rack, next.map((t) => t.id)))
    setTable(nextTable)
    setOpened(nextOpened)
  }

  const open = (by: 'melds' | 'pairs') => {
    if (!result || pending) return
    const opening = { with: by, thisTurn: true }
    if (by === 'melds') {
      const { melds } = result.melds
      play(melds.flatMap((m) => m.tiles), 0, [...table, ...melds], opening)
    } else {
      play(result.pairs.pairs.flat(), 0, table, opening)
    }
  }

  const playPlan = () => {
    const plan = result?.opened?.plan
    if (!plan || !opened || pending) return
    play(planTiles(plan), plan.swaps.length, tableAfter(table, plan), opened)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const autoSort = (groups: MeldTile[][]) => {
    if (indicator) changeRack(layoutGroups(resolveHand(tiles, indicator), groups))
  }

  // Of two copies, throw the one further along the rack: after auto-sort that's the leftover one.
  const discard = (face: Face) => {
    if (!indicator) return
    const [target] = resolveHand(tiles, indicator)
      .filter((t) => !t.joker && sameFace(t.face, face))
      .sort((a, b) => rack.indexOf(b.id) - rack.indexOf(a.id))
    if (target) updateTiles(tiles.filter((t) => t.id !== target.id))
  }

  const addTile = (t: { kind: 'false' } | Face) => {
    const id = crypto.randomUUID()
    updateTiles([...tiles, 'kind' in t ? { id, kind: 'false' } : { id, kind: 'face', ...t }])
  }

  return (
    <>
      <h1 className="app-title">
        <img src="/favicon.svg" alt="" width={40} height={40} />
        Okey 101 Yardımcısı
      </h1>
      <RotateHint />
      <IndicatorPicker indicator={indicator} onChange={changeIndicator} />
      <TilePicker
        tiles={tiles}
        indicator={indicator}
        okey={okey}
        onAdd={addTile}
        onRemoveLast={() => updateTiles(tiles.slice(0, -1))}
      />
      <Rack
        rack={rack}
        tiles={tiles}
        okey={okey}
        onChange={changeRack}
        onRemove={(id) => updateTiles(tiles.filter((t) => t.id !== id))}
        notice={
          <DiscardNotice
            tileCount={tiles.length}
            analysis={result}
            okey={okey}
            pending={pending}
            onDiscard={discard}
          />
        }
        actions={
          <>
            <button
              type="button"
              className="primary"
              disabled={!result || pending}
              onClick={() => result && autoSort(result.melds.melds.map((m) => m.tiles))}
            >
              Otomatik diz: per / seri
            </button>
            <button type="button" disabled={!result || pending} onClick={() => result && autoSort(result.pairs.pairs)}>
              Otomatik diz: çift
            </button>
            <button type="button" disabled={!history.canUndo} onClick={undo} title="Geri al (Ctrl+Z)">
              ↶ Geri al
            </button>
            <button type="button" disabled={tiles.length === 0} onClick={() => updateTiles([])}>
              Eli temizle
            </button>
          </>
        }
      />
      <TablePanel
        indicator={indicator}
        okey={okey}
        rules={rules}
        opened={opened}
        onOpenedChange={changeOpened}
        table={table}
        onTableChange={changeTable}
      />
      <ResultsPanel
        analysis={result}
        okey={okey}
        pending={pending}
        onDiscard={discard}
        onOpen={open}
        onPlay={playPlan}
      />
      <RulesPanel rules={rules} onChange={setRules} />
    </>
  )
}
