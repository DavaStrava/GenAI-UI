/**
 * Base interface for all LLM providers
 */
export interface LLMMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface LLMStreamOptions {
  model: string
  messages: LLMMessage[]
  temperature?: number
  maxTokens?: number
}

export interface LLMProvider {
  /**
   * Unique identifier for the provider
   */
  readonly id: string

  /**
   * Display name for the provider
   */
  readonly name: string

  /**
   * List of available models for this provider
   */
  readonly models: string[]

  /**
   * Stream a chat completion response
   * @param options - Stream options including model, messages, and parameters
   * @param apiKey - API key for the provider
   * @returns Async generator that yields content chunks
   */
  stream(
    options: LLMStreamOptions,
    apiKey: string
  ): AsyncGenerator<string, void, unknown>
}






