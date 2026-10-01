import { useState } from 'react'

/** In-memory stack of previous states (cleared on page reload). */
export function useUndoHistory<T>(limit = 50) {
  const [stack, setStack] = useState<T[]>([])
  return {
    canUndo: stack.length > 0,
    push: (state: T) => setStack((s) => [...s.slice(-(limit - 1)), state]),
    pop: (): T | undefined => {
      const last = stack.at(-1)
      if (last !== undefined) setStack((s) => s.slice(0, -1))
      return last
    },
  }
}
