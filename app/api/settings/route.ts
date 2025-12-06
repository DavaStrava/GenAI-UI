import { NextRequest } from "next/server"
import { getProvider } from "@/lib/llm/provider-factory"

export const runtime = "edge"

/**
 * GET /api/settings - Get settings (returns structure, not actual keys)
 */
export async function GET(req: NextRequest) {
  try {
    // Return settings structure without sensitive data
    // Client-side code will handle retrieving from localStorage
    return new Response(
      JSON.stringify({
        message: "Settings are stored client-side in localStorage",
        providers: [
          { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"] },
          { id: "anthropic", name: "Anthropic (Claude)", models: ["claude-3-5-sonnet-20241022", "claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"] },
          { id: "google", name: "Google (Gemini)", models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"] },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error"
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

/**
 * POST /api/settings/validate - Validate API key for a provider
 */
export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, model } = await req.json()

    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Provider and API key are required" }),
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

    const selectedModel = model || llmProvider.models[0]

    // Test the API key by making a minimal request
    try {
      let testResponse: Response

      if (provider === "openai") {
        testResponse = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })
      } else if (provider === "anthropic") {
        testResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: "user", content: "test" }],
            max_tokens: 1,
          }),
        })
      } else if (provider === "google") {
        const url = new URL(
          `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`,
        )
        url.searchParams.set("key", apiKey)
        testResponse = await fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "test" }] }],
            generationConfig: { maxOutputTokens: 1 },
          }),
        })
      } else {
        return new Response(
          JSON.stringify({ error: "Unsupported provider for validation" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        )
      }

      if (testResponse.ok) {
        return new Response(
          JSON.stringify({ valid: true, message: "API key is valid" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      } else {
        const errorText = await testResponse.text()
        return new Response(
          JSON.stringify({
            valid: false,
            error: `API key validation failed: ${testResponse.status} ${errorText}`,
          }),
          {
            status: 200, // Still 200, but with valid: false
            headers: { "Content-Type": "application/json" },
          }
        )
      }
    } catch (error) {
      return new Response(
        JSON.stringify({
          valid: false,
          error:
            error instanceof Error ? error.message : "Validation request failed",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error"
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

