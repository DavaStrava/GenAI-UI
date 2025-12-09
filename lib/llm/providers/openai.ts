import { LLMProvider, Model } from "./base"

export class OpenAIProvider extends LLMProvider {
  id = "openai"
  name = "OpenAI"
  models: Model[] = [
    { id: "gpt-5", name: "ChatGPT 5" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  ]
}
