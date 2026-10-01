import { useState } from 'react'
import type { OpenedState } from '../engine/analyze'
import type { Rules } from '../engine/rules'
import { readTableMeld, type TableMeld } from '../engine/table'
import { resolveHand, type Face, type HandTile } from '../engine/tiles'
import { FaceGrid } from './FaceGrid'
import { tileFor } from './labels'
import { Tile } from './Tile'
import './TablePanel.css'

interface Props {
  indicator: Face | null
  okey: Face | null
  rules: Rules
  opened: OpenedState | null
  onOpenedChange: (opened: OpenedState | null) => void
  table: TableMeld[]
  onTableChange: (table: TableMeld[]) => void
}

const STATES = [
  { value: null, label: 'Açmadım' },
  { value: 'melds', label: 'Per ile açtım' },
  { value: 'pairs', label: 'Çift ile açtım' },
] as const

/** Whether (and how) the player has opened, and the melds on the table for lay-offs. */
export function TablePanel({ indicator, okey, rules, opened, onOpenedChange, table, onTableChange }: Props) {
  const [entry, setEntry] = useState<HandTile[] | null>(null)
  const readings = indicator && entry ? readTableMeld(resolveHand(entry, indicator), rules) : []

  const add = (meld: TableMeld) => {
    onTableChange([...table, meld])
    setEntry(null)
  }
  const push = (t: HandTile) => entry && entry.length < 13 && setEntry([...entry, t])

  return (
    <section className="panel table-panel">
      <h2>Masa</h2>

      <div className="opened-state" role="radiogroup" aria-label="Açma durumu">
        {STATES.map((s) => (
          <button
            key={s.label}
            type="button"
            role="radio"
            aria-checked={(opened?.with ?? null) === s.value}
            className={(opened?.with ?? null) === s.value ? 'tp-btn on' : 'tp-btn'}
            onClick={() => onOpenedChange(s.value ? { with: s.value, thisTurn: opened?.thisTurn ?? true } : null)}
          >
            {s.label}
          </button>
        ))}
        {opened && (
          <label className="this-turn">
            <input
              type="checkbox"
              checked={opened.thisTurn}
              onChange={(e) => onOpenedChange({ ...opened, thisTurn: e.target.checked })}
            />
            Bu el açtım
          </label>
        )}
      </div>

      {table.length > 0 ? (
        <ol className="table-melds">
          {table.map((m, i) => (
            <li key={i}>
              <span className="meld-no">{i + 1}</span>
              <span className="meld-tiles">
                {okey && m.tiles.map((t, j) => <Tile key={j} small tile={tileFor(t.face, t.joker, okey)} okey={okey} />)}
              </span>
              <button
                type="button"
                className="tp-btn meld-remove"
                aria-label={`${i + 1}. peri sil`}
                onClick={() => onTableChange(table.filter((_, k) => k !== i))}
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="hint">Masada per yok. Açtıktan sonra işleme önerileri için masadaki perleri ekle.</p>
      )}

      {entry === null ? (
        <div className="table-actions">
          <button type="button" className="tp-btn" disabled={!indicator} onClick={() => setEntry([])}>
            + Masaya per ekle
          </button>
          {table.length > 0 && (
            <button type="button" className="tp-btn" onClick={() => onTableChange([])}>
              Masayı temizle
            </button>
          )}
        </div>
      ) : (
        <div className="meld-builder">
          <p className="hint">Perin taşlarına masadaki sırayla (soldan sağa) dokun. Okey için okey taşına dokun.</p>
          <div className="builder-row">
            {entry.length === 0 ? (
              <span className="hint">—</span>
            ) : (
              entry.map((t, i) => <Tile key={i} small tile={t} okey={okey} />)
            )}
          </div>
          <FaceGrid okey={okey} onPick={(f) => push({ id: '', kind: 'face', ...f })}>
            <div className="face-extra">
              <Tile small tile={{ id: '', kind: 'false' }} okey={okey} onClick={() => push({ id: '', kind: 'false' })} />
              <span className="hint">Sahte okey</span>
            </div>
          </FaceGrid>
          <div className="table-actions">
            {readings.map((m) => (
              <button key={m.kind} type="button" className="tp-btn primary" onClick={() => add(m)}>
                {readings.length > 1 ? (m.kind === 'set' ? 'Per olarak ekle' : 'Seri olarak ekle') : 'Ekle'}
              </button>
            ))}
            {entry.length >= 3 && readings.length === 0 && <span className="invalid">Geçerli bir per değil</span>}
            <button
              type="button"
              className="tp-btn"
              disabled={entry.length === 0}
              onClick={() => setEntry(entry.slice(0, -1))}
            >
              Geri
            </button>
            <button type="button" className="tp-btn" onClick={() => setEntry(null)}>
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
