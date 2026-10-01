import type { Analysis } from '../engine/analyze'
import type { Layoff } from '../engine/opened'
import type { Face } from '../engine/tiles'
import { tileFor } from './labels'
import { Discards, Group, Stat } from './ResultParts'
import { Tile } from './Tile'

interface Props {
  analysis: Analysis
  opened: NonNullable<Analysis['opened']>
  okey: Face
  pending: boolean
  onDiscard: (face: Face) => void
  onPlay: () => void
}

const SIDE: Record<Layoff['side'], string> = { low: 'başına', high: 'sonuna', set: 'ekle' }

/** After opening: the lay-off plan and what stays in hand. */
export function OpenedResults({ analysis, opened, okey, pending, onDiscard, onPlay }: Props) {
  const { plan, discards } = opened
  const { rules } = analysis
  const pairsOpener = opened.with === 'pairs'
  const played = plan.melds.length + plan.pairs.length + plan.layoffs.length + plan.swaps.length
  const emptied = plan.leftover.length === 0 && plan.leftoverJokers === 0

  return (
    <section className={`panel results${pending ? ' stale' : ''}`}>
      <h2>Sonuçlar</h2>
      <p className="recommendation">
        {emptied && played > 0
          ? 'Elindeki tüm taşları oynayabilirsin!'
          : played > 0
            ? 'Bu taşları oynayabilirsin:'
            : 'Şu an oynayabileceğin taş yok.'}
      </p>
      {played > 0 && (
        <div className="play-actions">
          <button type="button" className="primary" disabled={pending} onClick={onPlay}>
            Oynadım
          </button>
          <span className="hint">Taşları elinden çıkarır, masayı günceller.</span>
        </div>
      )}
      {!plan.canLayOff && <p className="hint">Açtığın el işleme yapılamaz (kural); sonraki elde işleyebilirsin.</p>}
      {pairsOpener && !rules.pairsOpenerCanMeld && <p className="hint">Çift açtığın için yeni per açamazsın; yalnızca işleyebilirsin.</p>}

      <div className="stats">
        <Stat
          label="Elde kalacak ceza"
          value={String(plan.penalty)}
          ok={emptied}
          note={
            [
              plan.leftoverJokers > 0 ? 'elde kalan okey dahil' : null,
              pairsOpener && rules.pairsPenaltyMultiplier > 1 ? `çift açan: ×${rules.pairsPenaltyMultiplier}` : null,
            ]
              .filter(Boolean)
              .join(', ') || undefined
          }
        />
      </div>

      {plan.swaps.length > 0 && (
        <>
          <h3>Masadan okeyi al</h3>
          <ul className="plan-list">
            {plan.swaps.map((s, i) => (
              <li key={i}>
                <span className="plan-target">Masa {s.meld + 1}:</span>
                <Tile small tile={tileFor(s.give, false, okey)} okey={okey} />
                <span>koy, okeyi al</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {(plan.melds.length > 0 || plan.pairs.length > 0) && (
        <>
          <h3>{plan.melds.length > 0 ? 'Yeni perler' : 'Yeni çiftler'}</h3>
          <div className="groups">
            {plan.melds.map((m, i) => (
              <Group key={`m${i}`} tiles={m.tiles} okey={okey} />
            ))}
            {plan.pairs.map((p, i) => (
              <Group key={`p${i}`} tiles={p} okey={okey} />
            ))}
          </div>
        </>
      )}

      {plan.layoffs.length > 0 && (
        <>
          <h3>İşle</h3>
          <ul className="plan-list">
            {plan.layoffs.map((l, i) => (
              <li key={i}>
                <span className="plan-target">
                  Masa {l.meld + 1} {SIDE[l.side]}:
                </span>
                <Group tiles={l.tiles} okey={okey} />
              </li>
            ))}
          </ul>
        </>
      )}

      {!emptied && (
        <>
          <h3>Elde kalacak</h3>
          <div className="groups">
            <Group
              tiles={[
                ...plan.leftover.map((face) => ({ face, joker: false })),
                ...Array.from({ length: plan.leftoverJokers }, () => ({ face: okey, joker: true })),
              ]}
              okey={okey}
            />
          </div>
        </>
      )}

      {discards && (
        <>
          <h3>Önerilen atış</h3>
          <div className="discards">
            <Discards
              title="Oynadıktan sonra"
              options={discards}
              okey={okey}
              detail={(o) => (o.finishes ? 'elin biter!' : `ceza ${o.penalty}`)}
              disabled={pending}
              onDiscard={onDiscard}
            />
          </div>
        </>
      )}
    </section>
  )
}
