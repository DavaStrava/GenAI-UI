import { LLMProvider, type LLMStreamOptions } from "./base"

/**
 * Google Gemini provider implementation
 */
export class GoogleProvider implements LLMProvider {
  readonly id = "google"
  readonly name = "Google (Gemini)"
  readonly models = [
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-pro",
  ]

  async *stream(
    options: LLMStreamOptions,
    apiKey: string
  ): AsyncGenerator<string, void, unknown> {
    // Convert messages to Gemini format
    const contents = this.convertMessages(options.messages)

    const url = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:streamGenerateContent`,
    )
    url.searchParams.set("key", apiKey)

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google API error: ${response.status} ${error}`)
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
      
      // Google returns NDJSON (newline-delimited JSON)
      // Process complete lines
      let newlineIndex
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)

        if (line) {
          try {
            const parsed = JSON.parse(line)
            const candidates = parsed.candidates
            if (candidates && candidates[0]?.content?.parts) {
              for (const part of candidates[0].content.parts) {
                if (part.text) {
                  yield part.text
                }
              }
            }
          } catch (e) {
            // Continue processing other lines
          }
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim())
        const candidates = parsed.candidates
        if (candidates && candidates[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.text) {
              yield part.text
            }
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  /**
   * Convert messages to Gemini format
   */
  private convertMessages(
    messages: Array<{ role: string; content: string }>
  ): Array<{ role: string; parts: Array<{ text: string }> }> {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []
    
    // Gemini uses "user" and "model" roles, and alternates between them
    for (const message of messages) {
      if (message.role === "system") {
        // Gemini doesn't support system messages directly, so we prepend to first user message
        if (contents.length === 0) {
          contents.push({
            role: "user",
            parts: [{ text: `System: ${message.content}\n\n` }],
          })
        } else {
          contents[0].parts[0].text = `System: ${message.content}\n\n${contents[0].parts[0].text}`
        }
      } else if (message.role === "user") {
        contents.push({
          role: "user",
          parts: [{ text: message.content }],
        })
      } else if (message.role === "assistant") {
        contents.push({
          role: "model",
          parts: [{ text: message.content }],
        })
      }
    }

    return contents
  }
}

