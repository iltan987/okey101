import type { Analysis, AnalyzeInput } from './analyze'
import type { WorkerRequest } from './worker'

/** Runs analysis in a Web Worker; only the latest request's result is delivered, with the input it was for. */
export function createAnalyzer(onResult: (result: Analysis, input: AnalyzeInput) => void) {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  let latest = 0
  let latestInput: AnalyzeInput | null = null
  worker.onmessage = (e: MessageEvent<{ id: number; result: Analysis }>) => {
    if (e.data.id === latest && latestInput) onResult(e.data.result, latestInput)
  }
  return {
    run(input: AnalyzeInput) {
      latestInput = input
      const req: WorkerRequest = { id: ++latest, input }
      worker.postMessage(req)
    },
    dispose: () => worker.terminate(),
  }
}
