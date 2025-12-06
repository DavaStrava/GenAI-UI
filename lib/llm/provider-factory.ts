import { LLMProvider } from "./providers/base"
import { OpenAIProvider } from "./providers/openai"
import { AnthropicProvider } from "./providers/anthropic"
import { GoogleProvider } from "./providers/google"

/**
 * Registry of all available LLM providers
 */
const providers = new Map<string, LLMProvider>([
  ["openai", new OpenAIProvider()],
  ["anthropic", new AnthropicProvider()],
  ["google", new GoogleProvider()],
])

/**
 * Get a provider by ID
 */
export function getProvider(providerId: string): LLMProvider | undefined {
  return providers.get(providerId)
}

/**
 * Get all available providers
 */
export function getAllProviders(): LLMProvider[] {
  return Array.from(providers.values())
}

/**
 * Check if a provider exists
 */
export function hasProvider(providerId: string): boolean {
  return providers.has(providerId)
}

/**
 * Get provider IDs
 */
export function getProviderIds(): string[] {
  return Array.from(providers.keys())
}

