/// <reference lib="webworker" />
import { analyze, type AnalyzeInput } from './analyze'

export interface WorkerRequest {
  id: number
  input: AnalyzeInput
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, input } = e.data
  self.postMessage({ id, result: analyze(input) })
}
