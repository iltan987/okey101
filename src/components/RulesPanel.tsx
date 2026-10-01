import type { ReactNode } from 'react'
import { DEFAULT_RULES, type Rules } from '../engine/rules'
import './RulesPanel.css'

interface Props {
  rules: Rules
  onChange: (rules: Rules) => void
}

type NumberRule = { [K in keyof Rules]: Rules[K] extends number ? K : never }[keyof Rules]
type BooleanRule = { [K in keyof Rules]: Rules[K] extends boolean ? K : never }[keyof Rules]

/** Table rules (house rules vary), collapsed by default. */
export function RulesPanel({ rules, onChange }: Props) {
  const set = <K extends keyof Rules>(key: K, value: Rules[K]) => onChange({ ...rules, [key]: value })
  const changed = (Object.keys(DEFAULT_RULES) as (keyof Rules)[]).some((k) => rules[k] !== DEFAULT_RULES[k])

  const number = (key: NumberRule, label: ReactNode, min: number, prefix = '') => (
    <label className="rule">
      <span>{label}</span>
      <span className="rule-input">
        {prefix}
        <input
          type="number"
          inputMode="numeric"
          min={min}
          value={rules[key]}
          onChange={(e) => {
            const v = Math.round(Number(e.target.value))
            if (e.target.value !== '' && Number.isFinite(v) && v >= min) set(key, v)
          }}
        />
      </span>
    </label>
  )

  const toggle = (key: BooleanRule, label: ReactNode) => (
    <label className="rule">
      <span>{label}</span>
      <input type="checkbox" checked={rules[key]} onChange={(e) => set(key, e.target.checked)} />
    </label>
  )

  return (
    <details className="panel rules-panel">
      <summary>
        <h2>Kurallar</h2>
        {changed && <small>(değiştirildi)</small>}
      </summary>
      <div className="rules-grid">
        {number('openPoints', 'Per ile açmak için puan', 1)}
        {number('pairsToOpen', 'Çift ile açmak için çift sayısı', 1)}
        {number('jokerPenalty', 'Elde kalan okey cezası', 0)}
        {number('pairsPenaltyMultiplier', 'Çift açanın cezası', 1, '×')}
        {toggle('wrapRuns', '12-13-1 serisi geçerli')}
        {toggle('okeyInPairs', 'Okey çift tamamlayabilir')}
      </div>
      <h3>İşleme</h3>
      <div className="rules-grid">
        {toggle('layoffSameTurn', 'Açtığın el işleyebilirsin')}
        {number('layoffMaxPerSide', 'Bir perin bir ucuna en fazla (0 = sınırsız)', 0)}
        {toggle('pairsOpenerCanMeld', 'Çift açan yeni per açabilir')}
        {toggle('okeySwap', 'Masadaki okeyi alma önerisi')}
      </div>
      <button type="button" className="rules-reset" disabled={!changed} onClick={() => onChange(DEFAULT_RULES)}>
        Varsayılana dön
      </button>
    </details>
  )
}
