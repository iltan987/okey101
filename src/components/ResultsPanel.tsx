import { OPEN_POINTS, type Analysis } from '../engine/analyze'
import type { DiscardOption } from '../engine/discard'
import type { MeldTile } from '../engine/melds'
import { PAIRS_TO_OPEN } from '../engine/pairs'
import { faceLabel, type Face } from '../engine/tiles'
import { Tile } from './Tile'
import './ResultsPanel.css'

interface Props {
  analysis: Analysis | null
  okey: Face | null
  pending: boolean
}

export function ResultsPanel({ analysis, okey, pending }: Props) {
  if (!okey) {
    return (
      <section className="panel results">
        <p className="hint">Pick the indicator tile to start.</p>
      </section>
    )
  }
  if (!analysis) {
    return (
      <section className="panel results">
        <p className="hint">{pending ? 'Analyzing…' : 'Add tiles to your hand.'}</p>
      </section>
    )
  }

  const { melds, pairs, lowestPenalty, canOpenMelds, discards } = analysis
  const recommendation = canOpenMelds
    ? 'Open with melds (per / seri).'
    : pairs.canOpen
      ? 'Open with pairs (çift).'
      : `Not ready to open: ${OPEN_POINTS - melds.points} points or ${PAIRS_TO_OPEN - pairs.pairs.length} pairs short.`

  return (
    <section className={`panel results${pending ? ' stale' : ''}`}>
      <h2>Results</h2>
      <p className="recommendation">{recommendation}</p>

      <div className="stats">
        <Stat label="Meld points" value={`${melds.points} / ${OPEN_POINTS}`} ok={canOpenMelds} />
        <Stat label="Pairs" value={`${pairs.pairs.length} / ${PAIRS_TO_OPEN}`} ok={pairs.canOpen} />
        <Stat
          label="Lowest leftover penalty"
          value={String(lowestPenalty.penalty)}
          note={lowestPenalty.leftoverJokers > 0 ? 'includes an unplayed okey' : undefined}
        />
      </div>

      {melds.melds.length > 0 && (
        <>
          <h3>Best melds</h3>
          <div className="groups">
            {melds.melds.map((m, i) => (
              <Group key={i} tiles={m.tiles} okey={okey} />
            ))}
          </div>
        </>
      )}

      {discards && (
        <>
          <h3>Suggested discard</h3>
          <div className="discards">
            <Discards title="Playing melds" options={discards.melds} okey={okey} detail={(o) => `${o.points} pts`} />
            <Discards title="Playing pairs" options={discards.pairs} okey={okey} detail={(o) => `${o.pairs} pairs`} />
          </div>
        </>
      )}
    </section>
  )
}

function Stat({ label, value, ok, note }: { label: string; value: string; ok?: boolean; note?: string }) {
  return (
    <div className={`stat${ok ? ' ok' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {ok && ' ✓'}
      </div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  )
}

function Group({ tiles, okey }: { tiles: MeldTile[]; okey: Face }) {
  return (
    <div className="group">
      {tiles.map((t, i) => {
        const face = t.joker ? okey : t.face
        return (
          <Tile
            key={i}
            small
            tile={{ id: '', kind: 'face', ...face }}
            okey={okey}
            title={t.joker ? `Okey as ${faceLabel(t.face)}` : undefined}
          />
        )
      })}
    </div>
  )
}

function Discards({
  title,
  options,
  okey,
  detail,
}: {
  title: string
  options: DiscardOption[]
  okey: Face
  detail: (o: DiscardOption) => string
}) {
  return (
    <div>
      <div className="stat-label">{title}</div>
      <ol>
        {options.map((o, i) => (
          <li key={i}>
            <Tile small tile={{ id: '', kind: 'face', ...o.face }} okey={okey} />
            <span>{detail(o)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
