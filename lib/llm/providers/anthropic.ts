import { LLMProvider, Model } from "./base"

export class AnthropicProvider extends LLMProvider {
  id = "anthropic"
  name = "Anthropic (Claude)"
  models: Model[] = [
    // Only include models that are confirmed to work
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
    { id: "claude-opus-4-20250514", name: "Claude Opus 4" },
    { id: "claude-opus-4-1-20250805", name: "Claude Opus 4.1" },
    // Note: Claude 4.5 models are not yet available via API or have different naming
    // When 4.5 models become available, add them here with the correct format
  ]
}
