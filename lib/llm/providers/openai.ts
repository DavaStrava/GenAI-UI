import { LLMProvider, type LLMStreamOptions, type LLMModel } from "./base"

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  readonly id = "openai"
  readonly name = "OpenAI"
  readonly models: LLMModel[] = [
    { id: "gpt-5", name: "GPT-5" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
    { id: "gpt-4", name: "GPT-4" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  ]

  getModelId(modelNameOrId: string): string | undefined {
    const model = this.models.find(
      (m) => m.id === modelNameOrId || m.name === modelNameOrId
    )
    return model?.id
  }

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







