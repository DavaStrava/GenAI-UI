import { LLMProvider, type LLMStreamOptions, type LLMModel } from "./base"

/**
 * Google Gemini provider implementation
 */
export class GoogleProvider implements LLMProvider {
  readonly id = "google"
  readonly name = "Google (Gemini)"
  readonly models: LLMModel[] = [
    { id: "gemini-3.0-pro", name: "Gemini 3.0 Pro" },
    { id: "gemini-3.0-flash", name: "Gemini 3.0 Flash" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
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
    // Convert messages to Gemini format
    const contents = this.convertMessages(options.messages)

    const url = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:streamGenerateContent`,
    )

    // Create an AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    let response: Response
    try {
      response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens,
          },
        }),
        signal: controller.signal,
      })
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request to Google API timed out after 60 seconds. The model may be experiencing issues.")
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Google API error: ${response.status}`
      
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error) {
          const error = errorJson.error
          
          // Handle rate limit/quota errors with user-friendly messages
          if (response.status === 429 || error.status === "RESOURCE_EXHAUSTED") {
            errorMessage = `Quota exceeded: You've reached your Google API rate limit or quota. `
            
            // Check if it's a free tier limit
            if (error.message?.includes("free_tier")) {
              errorMessage += `The free tier for ${options.model} has been exhausted. `
              errorMessage += `Try using "gemini-2.5-flash" instead (it has higher free tier limits), `
              errorMessage += `or wait for your quota to reset. `
              errorMessage += `See https://ai.google.dev/gemini-api/docs/rate-limits for more info.`
            } else {
              errorMessage += error.message || "Please check your billing and quota limits."
            }
            
            // Extract retry delay if available
            if (error.details) {
              const retryInfo = error.details.find((d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo")
              if (retryInfo?.retryDelay) {
                const seconds = Math.ceil(parseInt(retryInfo.retryDelay.replace("s", "")))
                errorMessage += ` Please retry in ${seconds} seconds.`
              }
            }
          } else {
            // For other errors, use the API's error message
            errorMessage = error.message || errorMessage
          }
        }
      } catch {
        // If we can't parse the error, use the raw text
        errorMessage = `Google API error: ${response.status} ${errorText}`
      }
      
      throw new Error(errorMessage)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error("No reader available")
    }

    let buffer = ""
    let hasYielded = false

    // Helper function to find complete JSON objects in buffer
    const findCompleteJsonObjects = (text: string): { objects: string[], remaining: string } => {
      const objects: string[] = []
      let remaining = text
      let depth = 0
      let start = -1
      let inString = false
      let escapeNext = false

      for (let i = 0; i < remaining.length; i++) {
        const char = remaining[i]

        if (escapeNext) {
          escapeNext = false
          continue
        }

        if (char === '\\') {
          escapeNext = true
          continue
        }

        if (char === '"') {
          inString = !inString
          continue
        }

        if (inString) continue

        if (char === '{') {
          if (depth === 0) start = i
          depth++
        } else if (char === '}') {
          depth--
          if (depth === 0 && start !== -1) {
            // Found a complete JSON object
            const jsonStr = remaining.slice(start, i + 1)
            objects.push(jsonStr)
            remaining = remaining.slice(i + 1)
            i = -1 // Reset to start of remaining
            start = -1
          }
        }
      }

      return { objects, remaining }
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      
      // Try to find complete JSON objects in the buffer
      const { objects, remaining } = findCompleteJsonObjects(buffer)
      buffer = remaining

      // Process each complete JSON object
      for (const jsonStr of objects) {
        try {
          const parsed = JSON.parse(jsonStr)
          
          // Check for errors in the response
          if (parsed.error) {
            throw new Error(`Google API error: ${JSON.stringify(parsed.error)}`)
          }
          
          const candidates = parsed.candidates
          if (candidates && candidates[0]) {
            // Check for finish reason (might indicate blocking)
            if (candidates[0].finishReason) {
              // If finish reason is SAFETY, RECITATION, or other blocking reasons
              if (candidates[0].finishReason !== "STOP" && candidates[0].finishReason !== "MAX_TOKENS") {
                throw new Error(`Response blocked: ${candidates[0].finishReason}. ${candidates[0].finishMessage || ""}`)
              }
            }
            
            if (candidates[0].content?.parts) {
              for (const part of candidates[0].content.parts) {
                if (part.text) {
                  hasYielded = true
                  yield part.text
                }
              }
            }
          }
        } catch (e) {
          // If it's an error we threw, re-throw it
          if (e instanceof Error && e.message.includes("Google API error")) {
            throw e
          }
          // Otherwise, log and continue (might be a parsing issue)
          console.warn("Failed to parse Google API response object:", e)
        }
      }
    }

    // Process any remaining buffer that might contain a complete JSON object
    if (buffer.trim()) {
      const { objects } = findCompleteJsonObjects(buffer)
      for (const jsonStr of objects) {
        try {
          const parsed = JSON.parse(jsonStr)
          
          if (parsed.error) {
            throw new Error(`Google API error: ${JSON.stringify(parsed.error)}`)
          }
          
          const candidates = parsed.candidates
          if (candidates && candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
              if (part.text) {
                hasYielded = true
                yield part.text
              }
            }
          }
        } catch (e) {
          if (e instanceof Error && e.message.includes("Google API error")) {
            throw e
          }
        }
      }
    }
    
    // If we never yielded anything, the response might be empty or blocked
    if (!hasYielded) {
      throw new Error("No content received from Google API. The response may have been blocked or empty. Check the model's safety settings.")
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

