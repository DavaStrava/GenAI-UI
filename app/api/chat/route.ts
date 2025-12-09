import { NextRequest } from "next/server"
import { getProvider } from "@/lib/llm/provider-factory"
import type { LLMMessage } from "@/lib/llm/providers/base"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      provider = "openai",
      model,
      apiKey,
      temperature,
      maxTokens,
    } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    if (!provider) {
      return new Response(
        JSON.stringify({ error: "Provider is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get API key from request or fallback to environment variables (for development)
    let finalApiKey = apiKey
    if (!finalApiKey) {
      // Fallback to environment variables for development/backward compatibility
      if (provider === "openai") {
        finalApiKey = process.env.OPENAI_API_KEY || ""
      } else if (provider === "anthropic") {
        finalApiKey = process.env.ANTHROPIC_API_KEY || ""
      } else if (provider === "google") {
        finalApiKey = process.env.GOOGLE_API_KEY || ""
      }
    }

    if (!finalApiKey) {
      return new Response(
        JSON.stringify({ 
          error: `API key is required for ${provider}. Please configure it in Settings.` 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const llmProvider = getProvider(provider)
    if (!llmProvider) {
      return new Response(
        JSON.stringify({ error: `Unknown provider: ${provider}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Convert model display name to API ID, or use provided model (could be ID or name)
    const modelNameOrId = model || llmProvider.models[0]?.name || llmProvider.models[0]?.id
    const selectedModelId = llmProvider.getModelId(modelNameOrId || "")

    if (!selectedModelId) {
      return new Response(
        JSON.stringify({
          error: `Model ${modelNameOrId} is not available for provider ${provider}`,
        }),
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
          const streamOptions = {
            model: selectedModelId,
            messages: messages as LLMMessage[],
            temperature: temperature !== undefined ? temperature : 0.7,
            maxTokens: maxTokens,
          }

          // Use the provider's stream method
          for await (const content of llmProvider.stream(streamOptions, finalApiKey)) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            )
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error"
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: errorMessage })}\n\n`
            )
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
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error"
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

