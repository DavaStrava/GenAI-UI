import { NextRequest } from "next/server"
import { getProvider, getAllProviders } from "@/lib/llm/provider-factory"

export const runtime = "edge"

/**
 * GET /api/settings - Get settings (returns structure, not actual keys)
 */
export async function GET(req: NextRequest) {
  try {
    // Return settings structure without sensitive data
    // Client-side code will handle retrieving from localStorage
    const providers = getAllProviders().map((p) => ({
      id: p.id,
      name: p.name,
      models: p.models,
    }))
    
    return new Response(
      JSON.stringify({
        message: "Settings are stored client-side in localStorage",
        providers,
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

    // Convert model display name to API ID
    const modelNameOrId = model || llmProvider.models[0]?.name || llmProvider.models[0]?.id
    const selectedModelId = llmProvider.getModelId(modelNameOrId || "")

    if (!selectedModelId) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: `Model ${modelNameOrId} is not available for provider ${provider}`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

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
        // First try to fetch available models to validate
        const modelsResponse = await fetch("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
        })
        
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json()
          const availableModels = modelsData.data?.map((m: any) => m.id) || []
          
          // Check if the selected model is available
          if (!availableModels.includes(selectedModelId)) {
            return new Response(
              JSON.stringify({
                valid: false,
                error: `Model "${selectedModelId}" is not available. Available models: ${availableModels.join(", ")}`,
                availableModels,
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          }
        }
        
        // Then test with a minimal request
        testResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: selectedModelId,
            messages: [{ role: "user", content: "test" }],
            max_tokens: 1,
          }),
        })
      } else if (provider === "google") {
        const url = new URL(
          `https://generativelanguage.googleapis.com/v1beta/models/${selectedModelId}:generateContent`,
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
        // 429 (quota exceeded) means the key is valid but quota is exhausted
        // 401/403 means the key is invalid
        // 404 means the model/endpoint is not found
        if (testResponse.status === 429) {
          return new Response(
            JSON.stringify({
              valid: true,
              message: "API key is valid, but quota exceeded. Please check your billing and quota limits.",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        }
        
        // Check for Anthropic credit balance error (returns 400 but key is valid)
        // The key authenticated successfully but the account has billing issues
        if (provider === "anthropic" && testResponse.status === 400) {
          try {
            const errorJson = JSON.parse(errorText)
            if (errorJson?.error?.message?.includes("credit balance")) {
              return new Response(
                JSON.stringify({
                  valid: true,
                  message: "API key is valid, but your Anthropic account needs credits. Visit console.anthropic.com to add credits or check your billing settings.",
                }),
                {
                  status: 200,
                  headers: { "Content-Type": "application/json" },
                }
              )
            }
          } catch {
            // If we can't parse the error, fall through to default handling
          }
        }
        
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

