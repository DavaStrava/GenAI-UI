import { LLMProvider, type LLMStreamOptions } from "./base"

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  readonly id = "openai"
  readonly name = "OpenAI"
  readonly models = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
  ]

  async *stream(
    options: LLMStreamOptions,
    apiKey: string
  ): AsyncGenerator<string, void, unknown> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        stream: true,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${error}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error("No reader available")
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split("\n").filter((line) => line.trim() !== "")

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") {
            return
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              yield content
            }
          } catch (e) {
            // Continue processing other lines
          }
        }
      }
    }
  }
}




