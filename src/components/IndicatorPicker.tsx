import { faceLabel, okeyFromIndicator, sameFace, type Face } from '../engine/tiles'
import { FaceGrid } from './FaceGrid'

interface Props {
  indicator: Face | null
  onChange: (face: Face) => void
}

export function IndicatorPicker({ indicator, onChange }: Props) {
  const okey = indicator ? okeyFromIndicator(indicator) : null
  return (
    <section className="panel">
      <h2>
        Indicator tile{' '}
        {indicator && okey && (
          <small>
            {faceLabel(indicator)} → okey is <b className={okey.color}>{faceLabel(okey)}</b>
          </small>
        )}
      </h2>
      <FaceGrid okey={null} onPick={onChange} isSelected={(f) => indicator !== null && sameFace(f, indicator)} />
    </section>
  )
}
