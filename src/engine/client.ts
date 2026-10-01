import type { Analysis, AnalyzeInput } from './analyze'
import type { WorkerRequest } from './worker'

/** Runs analysis in a Web Worker; only the latest request's result is delivered. */
export function createAnalyzer(onResult: (result: Analysis) => void) {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  let latest = 0
  worker.onmessage = (e: MessageEvent<{ id: number; result: Analysis }>) => {
    if (e.data.id === latest) onResult(e.data.result)
  }
  return {
    run(input: AnalyzeInput) {
      const req: WorkerRequest = { id: ++latest, input }
      worker.postMessage(req)
    },
    dispose: () => worker.terminate(),
  }
}
