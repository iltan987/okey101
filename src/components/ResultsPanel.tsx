import type { Analysis } from '../engine/analyze'
import type { Face } from '../engine/tiles'
import { OpenedResults } from './OpenedResults'
import { Discards, Group, Stat } from './ResultParts'
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

  if (analysis.opened) {
    return <OpenedResults analysis={analysis} opened={analysis.opened} okey={okey} pending={pending} onDiscard={onDiscard} />
  }

  const { melds, pairs, lowestPenalty, canOpenMelds, discards, rules } = analysis
  const recommendation = canOpenMelds
    ? 'Per / seri ile açabilirsin.'
    : pairs.canOpen
      ? 'Çift ile açabilirsin.'
      : `Henüz açamazsın: ${rules.openPoints - melds.points} puan ya da ${rules.pairsToOpen - pairs.pairs.length} çift eksik.`

  return (
    <section className={`panel results${pending ? ' stale' : ''}`}>
      <h2>Sonuçlar</h2>
      <p className="recommendation">{recommendation}</p>

      <div className="stats">
        <Stat label="Per puanı" value={`${melds.points} / ${rules.openPoints}`} ok={canOpenMelds} />
        <Stat label="Çift sayısı" value={`${pairs.pairs.length} / ${rules.pairsToOpen}`} ok={pairs.canOpen} />
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
