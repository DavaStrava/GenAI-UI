export interface Model {
  id: string
  name: string
}

export abstract class LLMProvider {
  abstract id: string
  abstract name: string
  abstract models: Model[]
}
