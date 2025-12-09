import { NextRequest } from "next/server"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const { messages, provider, model, apiKey, temperature, maxTokens } = await req.json()

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    if (!provider || !model) {
      return new Response(
        JSON.stringify({ error: "Provider and model are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Create a readable stream for SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let apiUrl: string
          let headers: Record<string, string>
          let body: any

          // Configure request based on provider
          if (provider === "openai") {
            apiUrl = "https://api.openai.com/v1/chat/completions"
            headers = {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            }
            // Newer models (like GPT-5) use max_completion_tokens instead of max_tokens
            const isNewModel = model.startsWith("gpt-5") || model.startsWith("gpt-4o")
            body = {
              model,
              messages,
              stream: true,
              temperature: temperature ?? 0.7,
              ...(maxTokens && (isNewModel ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens })),
            }
          } else if (provider === "anthropic") {
            apiUrl = "https://api.anthropic.com/v1/messages"
            
            // Ensure API key is trimmed and has correct format
            const trimmedApiKey = apiKey.trim()
            if (!trimmedApiKey.startsWith("sk-ant-")) {
              console.warn("Anthropic API key may have incorrect format. Expected to start with 'sk-ant-'")
            }
            
            headers = {
              "Content-Type": "application/json",
              "x-api-key": trimmedApiKey,
              "anthropic-version": "2023-06-01",
            }
            // Anthropic requires max_tokens to be at least 1
            const anthropicMaxTokens = maxTokens && maxTokens > 0 ? maxTokens : 4096
            
            // Validate model ID format for Anthropic (only confirmed working models)
            // Note: We allow any model starting with "claude-" to support future models
            const validAnthropicModels = [
              "claude-sonnet-4-20250514",
              "claude-opus-4-20250514",
              "claude-opus-4-1-20250805",
            ]
            
            // Allow any model that starts with "claude-" to support future models
            const isValidModel = validAnthropicModels.includes(model) || model.startsWith("claude-")
            
            if (!isValidModel) {
              throw new Error(
                `Invalid Anthropic model ID: "${model}". Model must start with "claude-". Valid models include: ${validAnthropicModels.join(", ")}`
              )
            }
            
            body = {
              model,
              messages: messages.map((msg: any) => ({
                role: msg.role === "assistant" ? "assistant" : "user",
                content: msg.content,
              })),
              max_tokens: anthropicMaxTokens,
              stream: true,
              temperature: temperature ?? 0.7,
            }
            
            // Log request details for debugging (without exposing full API key)
            console.log(`Anthropic API Request: model=${model}, apiKeyPrefix=${trimmedApiKey.substring(0, 10)}..., body=${JSON.stringify(body)}`)
          } else if (provider === "google") {
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`
            headers = {
              "Content-Type": "application/json",
            }
            // Convert messages to Google's format
            const contents = messages.map((msg: any) => ({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content }],
            }))
            body = {
              contents,
              generationConfig: {
                temperature: temperature ?? 0.7,
                ...(maxTokens && { maxOutputTokens: maxTokens }),
              },
            }
          } else {
            throw new Error(`Unsupported provider: ${provider}`)
          }

          const response = await fetch(apiUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          })

          if (!response.ok) {
            const errorText = await response.text()
            let errorMessage = `${provider} API error: ${response.statusText} - ${errorText}`
            // For Anthropic, provide more helpful error messages
            if (provider === "anthropic") {
              try {
                const errorJson = JSON.parse(errorText)
                const apiError = errorJson.error
                if (apiError) {
                  // Show the actual error from Anthropic API
                  if (apiError.message) {
                    errorMessage = `Anthropic API Error: ${apiError.message}`
                    // If it's a model-related error, add helpful context
                    if (apiError.message.toLowerCase().includes("model") || apiError.message.toLowerCase().includes("not found")) {
                      errorMessage += `\n\nThe model "${model}" may not be available with your API key. Try selecting a different Claude model from the dropdown, or check your Anthropic dashboard to see which models you have access to.`
                    }
                    // If it's an authentication error, provide specific guidance
                    if (apiError.type === "authentication_error" || response.status === 401 || response.status === 403) {
                      errorMessage = `Anthropic API Authentication Error: ${apiError.message}\n\nPlease verify your API key is correct in Settings. Make sure it starts with "sk-ant-" and has no extra spaces.`
                    }
                  } else {
                    errorMessage = `Anthropic API Error: ${JSON.stringify(apiError)}`
                  }
                }
              } catch (e) {
                // Keep original error message if parsing fails, but include status code
                errorMessage = `Anthropic API Error (${response.status}): ${errorText}`
              }
            }
            throw new Error(errorMessage)
          }

          const reader = response.body?.getReader()
          const decoder = new TextDecoder()

          if (!reader) {
            throw new Error("No reader available")
          }

          // Handle streaming based on provider
          if (provider === "openai") {
            // OpenAI streaming format
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split("\n").filter((line) => line.trim() !== "")

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6)
                  if (data === "[DONE]") {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                    controller.close()
                    return
                  }

                  try {
                    const parsed = JSON.parse(data)
                    const content = parsed.choices?.[0]?.delta?.content
                    if (content) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                      )
                    }
                  } catch (e) {
                    // Continue processing other lines
                  }
                }
              }
            }
          } else if (provider === "anthropic") {
            // Anthropic streaming format
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split("\n").filter((line) => line.trim() !== "")

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6)
                  if (data === "[DONE]") {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                    controller.close()
                    return
                  }

                  try {
                    const parsed = JSON.parse(data)
                    if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ content: parsed.delta.text })}\n\n`)
                      )
                    } else if (parsed.type === "message_stop") {
                      controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                      controller.close()
                      return
                    }
                  } catch (e) {
                    // Continue processing other lines
                  }
                }
              }
            }
          } else if (provider === "google") {
            // Google streaming format
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split("\n").filter((line) => line.trim() !== "")

              for (const line of lines) {
                try {
                  const parsed = JSON.parse(line)
                  if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const content = parsed.candidates[0].content.parts[0].text
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                    )
                  }
                } catch (e) {
                  // Continue processing other lines
                }
              }
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
