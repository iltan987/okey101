import { useMediaQuery } from '../hooks/useMediaQuery'
import { usePersistentState } from '../hooks/usePersistentState'
import './RotateHint.css'

/** Suggests landscape on phones held upright; the app still works in portrait. */
export function RotateHint() {
  const portraitPhone = useMediaQuery('(max-width: 600px) and (orientation: portrait)')
  const [dismissed, setDismissed] = usePersistentState('okey101.rotateHintDismissed', false)
  if (!portraitPhone || dismissed) return null
  return (
    <div className="rotate-hint" role="note">
      <span>Telefonu yatay çevirirsen ıstaka tek parça ve taşlar daha büyük görünür.</span>
      <button type="button" onClick={() => setDismissed(true)}>
        Tamam
      </button>
    </div>
  )
}
