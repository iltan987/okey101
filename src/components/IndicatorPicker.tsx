import { useState } from 'react'
import { okeyFromIndicator, sameFace, type Face } from '../engine/tiles'
import { FaceGrid } from './FaceGrid'
import { faceName } from './labels'
import { Tile } from './Tile'
import './IndicatorPicker.css'

interface Props {
  indicator: Face | null
  onChange: (face: Face) => void
}

/** Grid to pick the indicator; collapses to a one-line summary once picked. */
export function IndicatorPicker({ indicator, onChange }: Props) {
  const [editing, setEditing] = useState(false)

  if (indicator && !editing) {
    const okey = okeyFromIndicator(indicator)
    return (
      <section className="panel indicator-summary">
        <h2>Gösterge taşı</h2>
        <Tile small tile={{ id: '', kind: 'face', ...indicator }} okey={null} title={faceName(indicator)} />
        <span className="arrow">→</span>
        <Tile small tile={{ id: '', kind: 'face', ...okey }} okey={okey} title={`Okey: ${faceName(okey)}`} />
        <span className="okey-name">
          okey: <b className={okey.color}>{faceName(okey)}</b>
        </span>
        <button type="button" className="indicator-btn" onClick={() => setEditing(true)}>
          Değiştir
        </button>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="indicator-head">
        <h2>Gösterge taşı</h2>
        {indicator && (
          <button type="button" className="indicator-btn" onClick={() => setEditing(false)}>
            Vazgeç
          </button>
        )}
      </div>
      <FaceGrid
        okey={null}
        onPick={(face) => {
          onChange(face)
          setEditing(false)
        }}
        isSelected={(f) => indicator !== null && sameFace(f, indicator)}
      />
    </section>
  )
}
