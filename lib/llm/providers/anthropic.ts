import { LLMProvider, type LLMStreamOptions, type LLMModel } from "./base"

/**
 * Anthropic Claude provider implementation
 * 
 * Note: Model identifiers may change. If you encounter 404 errors, 
 * the model may have been deprecated. Check Anthropic's documentation
 * or use the /v1/models endpoint to get current available models.
 */
export class AnthropicProvider implements LLMProvider {
  readonly id = "anthropic"
  readonly name = "Anthropic (Claude)"
  
  // Model identifiers - updated based on actual available models from Anthropic API
  readonly models: LLMModel[] = [
    // Claude 4.5 models (latest)
    { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5" },
    { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
    // Claude 4 models
    { id: "claude-opus-4-1-20250805", name: "Claude Opus 4.1" },
    { id: "claude-opus-4-20250514", name: "Claude Opus 4" },
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
    // Claude 3.5 models
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
    // Claude 3 models
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
  ]

  getModelId(modelNameOrId: string): string | undefined {
    const model = this.models.find(
      (m) => m.id === modelNameOrId || m.name === modelNameOrId
    )
    return model?.id
  }

  /**
   * Fetch available models from Anthropic API
   * This can be used to validate which models are actually available
   */
  static async fetchAvailableModels(apiKey: string): Promise<string[]> {
    try {
      const response = await fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`)
      }

      const data = await response.json()
      return data.data?.map((m: any) => m.id) || []
    } catch (error) {
      console.error("Error fetching Anthropic models:", error)
      return []
    }
  }

  async *stream(
    options: LLMStreamOptions,
    apiKey: string
  ): AsyncGenerator<string, void, unknown> {
    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: options.model,
          messages: options.messages.filter(
            (m) => m.role !== "system"
          ) as Array<{ role: "user" | "assistant"; content: string }>,
          system: options.messages.find((m) => m.role === "system")?.content,
          max_tokens: options.maxTokens ?? 4096,
          temperature: options.temperature ?? 0.7,
          stream: true,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Anthropic API error: ${response.status} ${errorText}`
      
      // Provide helpful error message for 404 (model not found)
      if (response.status === 404) {
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.error?.message?.includes("model")) {
            errorMessage = `Model "${options.model}" not found. This model may have been deprecated. ` +
              `Please check Anthropic's documentation for available models, or try a different model. ` +
              `Available models in this app: ${this.models.map(m => m.name).join(", ")}`
          }
        } catch {
          // If we can't parse, use the original error
        }
      }
      
      throw new Error(errorMessage)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error("No reader available")
    }

    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      
      // Anthropic uses SSE format (data: {...})
      let newlineIndex
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)

        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") {
            return
          }

          try {
            const parsed = JSON.parse(data)
            // Anthropic uses different structure for streaming
            if (parsed.type === "content_block_delta") {
              const content = parsed.delta?.text
              if (content) {
                yield content
              }
            } else if (parsed.type === "content_block_start" || parsed.type === "message_start") {
              // These events don't contain text content
              continue
            }
          } catch (e) {
            // Continue processing other lines
          }
        }
      }
    }

    // Process remaining buffer if any
    if (buffer.trim().startsWith("data: ")) {
      const data = buffer.trim().slice(6)
      if (data !== "[DONE]") {
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === "content_block_delta") {
            const content = parsed.delta?.text
            if (content) {
              yield content
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
}

