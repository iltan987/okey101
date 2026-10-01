import { OPEN_POINTS, type Analysis } from '../engine/analyze'
import type { DiscardOption } from '../engine/discard'
import type { MeldTile } from '../engine/melds'
import { PAIRS_TO_OPEN } from '../engine/pairs'
import type { Face } from '../engine/tiles'
import { faceName, tileFor } from './labels'
import { Tile } from './Tile'
import './ResultsPanel.css'

interface Props {
  analysis: Analysis | null
  okey: Face | null
  pending: boolean
  /** Removes one copy of the face from the hand. */
  onDiscard: (face: Face) => void
}

export function ResultsPanel({ analysis, okey, pending, onDiscard }: Props) {
  if (!okey) {
    return (
      <section className="panel results">
        <p className="hint">Başlamak için gösterge taşını seç.</p>
      </section>
    )
  }
  if (!analysis) {
    return (
      <section className="panel results">
        <p className="hint">{pending ? 'Hesaplanıyor…' : 'Eline taş ekle.'}</p>
      </section>
    )
  }

  const { melds, pairs, lowestPenalty, canOpenMelds, discards } = analysis
  const recommendation = canOpenMelds
    ? 'Per / seri ile açabilirsin.'
    : pairs.canOpen
      ? 'Çift ile açabilirsin.'
      : `Henüz açamazsın: ${OPEN_POINTS - melds.points} puan ya da ${PAIRS_TO_OPEN - pairs.pairs.length} çift eksik.`

  return (
    <section className={`panel results${pending ? ' stale' : ''}`}>
      <h2>Sonuçlar</h2>
      <p className="recommendation">{recommendation}</p>

      <div className="stats">
        <Stat label="Per puanı" value={`${melds.points} / ${OPEN_POINTS}`} ok={canOpenMelds} />
        <Stat label="Çift sayısı" value={`${pairs.pairs.length} / ${PAIRS_TO_OPEN}`} ok={pairs.canOpen} />
        <Stat
          label="En düşük ceza"
          value={String(lowestPenalty.penalty)}
          note={lowestPenalty.leftoverJokers > 0 ? 'elde kalan okey dahil' : undefined}
        />
      </div>

      {melds.melds.length > 0 && (
        <>
          <h3>En iyi perler</h3>
          <div className="groups">
            {melds.melds.map((m, i) => (
              <Group key={i} tiles={m.tiles} okey={okey} />
            ))}
          </div>
        </>
      )}

      {discards && (
        <>
          <h3>Önerilen atış</h3>
          <div className="discards">
            <Discards
              title="Per oynarken"
              options={discards.melds}
              okey={okey}
              detail={(o) => `${o.points} puan`}
              disabled={pending}
              onDiscard={onDiscard}
            />
            <Discards
              title="Çift oynarken"
              options={discards.pairs}
              okey={okey}
              detail={(o) => `${o.pairs} çift`}
              disabled={pending}
              onDiscard={onDiscard}
            />
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
      {tiles.map((t, i) => (
        <Tile
          key={i}
          small
          tile={tileFor(t.face, t.joker, okey)}
          okey={okey}
          title={t.joker ? `Okey, ${faceName(t.face)} yerine` : undefined}
        />
      ))}
    </div>
  )
}

function Discards({
  title,
  options,
  okey,
  detail,
  disabled,
  onDiscard,
}: {
  title: string
  options: DiscardOption[]
  okey: Face
  detail: (o: DiscardOption) => string
  disabled: boolean
  onDiscard: (face: Face) => void
}) {
  return (
    <div>
      <div className="stat-label">{title}</div>
      <ol>
        {options.map((o, i) => (
          <li key={i}>
            <button type="button" className="discard-option" disabled={disabled} onClick={() => onDiscard(o.face)}>
              <Tile small tile={tileFor(o.face, false, okey)} okey={okey} />
              <span>{detail(o)}</span>
              <span className="discard-action">At</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
