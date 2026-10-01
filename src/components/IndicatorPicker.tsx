import { okeyFromIndicator, sameFace, type Face } from '../engine/tiles'
import { FaceGrid } from './FaceGrid'
import { faceName } from './labels'

interface Props {
  indicator: Face | null
  onChange: (face: Face) => void
}

export function IndicatorPicker({ indicator, onChange }: Props) {
  const okey = indicator ? okeyFromIndicator(indicator) : null
  return (
    <section className="panel">
      <h2>
        Gösterge taşı{' '}
        {indicator && okey && (
          <small>
            {faceName(indicator)} → okey: <b className={okey.color}>{faceName(okey)}</b>
          </small>
        )}
      </h2>
      <FaceGrid okey={null} onPick={onChange} isSelected={(f) => indicator !== null && sameFace(f, indicator)} />
    </section>
  )
}
