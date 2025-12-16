import { LLMProvider, Model } from "./base"

export class GoogleProvider extends LLMProvider {
  id = "google"
  name = "Google (Gemini)"
  models: Model[] = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    { id: "gemini-1.5-pro-latest", name: "Gemini 1.5 Pro (Latest)" },
    { id: "gemini-1.5-flash-latest", name: "Gemini 1.5 Flash (Latest)" },
  ]
}
