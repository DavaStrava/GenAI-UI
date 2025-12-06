import { LLMProvider, type LLMStreamOptions } from "./base"

/**
 * Anthropic Claude provider implementation
 */
export class AnthropicProvider implements LLMProvider {
  readonly id = "anthropic"
  readonly name = "Anthropic (Claude)"
  readonly models = [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
  ]

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
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} ${error}`)
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

