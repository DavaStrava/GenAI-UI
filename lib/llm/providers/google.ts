import { LLMProvider, Model } from "./base"

export class GoogleProvider extends LLMProvider {
  id = "google"
  name = "Google (Gemini)"
  models: Model[] = [
    { id: "gemini-3", name: "Gemini 3" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    { id: "gemini-pro", name: "Gemini Pro" },
  ]
}
