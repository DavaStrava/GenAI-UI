"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  getSettings,
  saveSettings,
  type Settings,
  updateApiKey,
} from "@/lib/storage/settings"
import { getAllProviders } from "@/lib/llm/provider-factory"
import { Settings as SettingsIcon, Check, X, Loader2 } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(getSettings())
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null)
  const [validating, setValidating] = useState<Record<string, boolean>>({})
  const [validationStatus, setValidationStatus] = useState<
    Record<string, { valid: boolean; message?: string }>
  >({})

  const providers = getAllProviders()

  useEffect(() => {
    setSettings(getSettings())
  }, [])

  const handleApiKeyChange = (providerId: string, value: string) => {
    const newSettings: Settings = {
      ...settings,
      apiKeys: {
        ...settings.apiKeys,
        [providerId]: value || undefined,
      },
    }
    setSettings(newSettings)
    setSaveStatus(null)
  }

  const handleDefaultProviderChange = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId)
    const newSettings: Settings = {
      ...settings,
      defaultProvider: providerId,
      defaultModel: provider?.models[0] || settings.defaultModel,
    }
    setSettings(newSettings)
  }

  const handleDefaultModelChange = (model: string) => {
    const newSettings: Settings = {
      ...settings,
      defaultModel: model,
    }
    setSettings(newSettings)
  }

  const validateApiKey = async (providerId: string, apiKey: string) => {
    if (!apiKey) return

    setValidating((prev) => ({ ...prev, [providerId]: true }))
    setValidationStatus((prev) => ({
      ...prev,
      [providerId]: { valid: false },
    }))

    try {
      const provider = providers.find((p) => p.id === providerId)
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: providerId,
          apiKey,
          model: provider?.models[0],
        }),
      })

      const result = await response.json()
      setValidationStatus((prev) => ({
        ...prev,
        [providerId]: {
          valid: result.valid,
          message: result.message || result.error,
        },
      }))
    } catch (error) {
      setValidationStatus((prev) => ({
        ...prev,
        [providerId]: {
          valid: false,
          message: "Validation request failed",
        },
      }))
    } finally {
      setValidating((prev) => ({ ...prev, [providerId]: false }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus(null)

    try {
      saveSettings(settings)
      setSaveStatus("success")
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error) {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const defaultProvider = providers.find(
    (p) => p.id === settings.defaultProvider
  )

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Back to Chat
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* API Keys Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">API Keys</h2>
              <p className="text-sm text-muted-foreground">
                Enter your API keys for each provider. Keys are encrypted and
                stored locally in your browser.
              </p>
            </div>

            <div className="space-y-6">
              {providers.map((provider) => {
                const apiKey = settings.apiKeys[
                  provider.id as keyof typeof settings.apiKeys
                ] || ""
                const isValidating = validating[provider.id]
                const validation = validationStatus[provider.id]

                return (
                  <div key={provider.id} className="space-y-2">
                    <label className="text-sm font-medium">
                      {provider.name}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) =>
                          handleApiKeyChange(provider.id, e.target.value)
                        }
                        placeholder={`Enter ${provider.name} API key`}
                        className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => validateApiKey(provider.id, apiKey)}
                        disabled={!apiKey || isValidating}
                      >
                        {isValidating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Validate"
                        )}
                      </Button>
                    </div>
                    {validation && (
                      <div
                        className={`text-xs flex items-center gap-1 ${
                          validation.valid
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {validation.valid ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        <span>{validation.message}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Available models: {provider.models.join(", ")}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Default Provider & Model Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Default Provider & Model
              </h2>
              <p className="text-sm text-muted-foreground">
                Set your preferred default LLM provider and model.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Provider</label>
                <select
                  value={settings.defaultProvider || "openai"}
                  onChange={(e) => handleDefaultProviderChange(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              {defaultProvider && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Model</label>
                  <select
                    value={settings.defaultModel || defaultProvider.models[0]}
                    onChange={(e) => handleDefaultModelChange(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {defaultProvider.models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Save Button */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
            {saveStatus === "success" && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-4 w-4" />
                Settings saved successfully
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-sm text-red-600 flex items-center gap-1">
                <X className="h-4 w-4" />
                Failed to save settings
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}






