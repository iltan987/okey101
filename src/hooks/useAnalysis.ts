import { useEffect, useRef, useState } from 'react'
import type { Analysis, AnalyzeInput } from '../engine/analyze'
import { createAnalyzer } from '../engine/client'

/**
 * Analyzes the hand in a worker whenever `input` changes. While a new result is on its way,
 * the previous one is still returned and `pending` is true.
 */
export function useAnalysis(input: AnalyzeInput | null) {
  const [latest, setLatest] = useState<{ input: AnalyzeInput; result: Analysis } | null>(null)
  const analyzer = useRef<ReturnType<typeof createAnalyzer> | null>(null)

  useEffect(() => {
    const a = createAnalyzer((result, input) => setLatest({ input, result }))
    analyzer.current = a
    return () => a.dispose()
  }, [])

  useEffect(() => {
    if (input) analyzer.current?.run(input)
  }, [input])

  return {
    result: input ? (latest?.result ?? null) : null,
    pending: input !== null && latest?.input !== input,
  }
}
