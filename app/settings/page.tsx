"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getAllProviders } from "@/lib/llm/provider-factory"
import { Settings as SettingsIcon, Check, X, Loader2, Database, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Settings {
  apiKeys: {
    openai?: string
    anthropic?: string
    google?: string
  }
  defaultProvider?: string
  defaultModel?: string
}

interface HasApiKey {
  openai: boolean
  anthropic: boolean
  google: boolean
}

const defaultSettings: Settings = {
  apiKeys: {},
  defaultProvider: "openai",
  defaultModel: "gpt-4o-mini",
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [hasApiKey, setHasApiKey] = useState<HasApiKey>({ openai: false, anthropic: false, google: false })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null)
  const [validating, setValidating] = useState<Record<string, boolean>>({})
  const [validationStatus, setValidationStatus] = useState<
    Record<string, { valid: boolean; message?: string; availableModels?: string[] }>
  >({})

  const providers = getAllProviders()

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/settings/db")
        if (response.ok) {
          const data = await response.json()
          // Track which providers have API keys configured
          setHasApiKey(data.hasApiKey || { openai: false, anthropic: false, google: false })
          setSettings({
            apiKeys: {}, // Start with empty - user enters new keys to replace
            defaultProvider: data.defaultProvider || defaultSettings.defaultProvider,
            defaultModel: data.defaultModel || defaultSettings.defaultModel,
          })
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
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
      defaultModel: provider?.models[0]?.name || settings.defaultModel,
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
    // If no key in input but key is configured, fetch it from backend for validation
    let keyToValidate = apiKey
    if (!keyToValidate && hasApiKey[providerId as keyof HasApiKey]) {
      try {
        const response = await fetch(`/api/settings/apikey?provider=${providerId}`)
        if (response.ok) {
          const data = await response.json()
          keyToValidate = data.apiKey
        }
      } catch (error) {
        console.error("Error fetching API key for validation:", error)
      }
    }

    if (!keyToValidate) {
      setValidationStatus((prev) => ({
        ...prev,
        [providerId]: {
          valid: false,
          message: "Please enter an API key to validate",
        },
      }))
      return
    }

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
        apiKey: keyToValidate,
        model: provider?.models[0]?.name || provider?.models[0]?.id,
      }),
      })

      const result = await response.json()
      setValidationStatus((prev) => ({
        ...prev,
        [providerId]: {
          valid: result.valid,
          message: result.message || result.error,
          availableModels: result.availableModels, // Store available models if provided
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
      const response = await fetch("/api/settings/db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setSaveStatus("success")
        setTimeout(() => setSaveStatus(null), 3000)
      } else {
        setSaveStatus("error")
        setTimeout(() => setSaveStatus(null), 3000)
      }
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

  if (isLoading) {
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
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

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
          {/* Migration Notice */}
          <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  Database Migration Available
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  If you had existing API keys or data stored in your browser, you can migrate them to the new database.
                </p>
                <Link href="/migrate">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Database className="h-4 w-4" />
                    Open Migration Tool
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* API Keys Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">API Keys</h2>
              <p className="text-sm text-muted-foreground">
                Enter your API keys for each provider. Keys are encrypted and
                stored in the database.
              </p>
            </div>

            <div className="space-y-6">
              {providers.map((provider) => {
                const apiKey = settings.apiKeys[
                  provider.id as keyof typeof settings.apiKeys
                ] || ""
                const isValidating = validating[provider.id]
                const validation = validationStatus[provider.id]
                const keyConfigured = hasApiKey[provider.id as keyof HasApiKey]

                return (
                  <div key={provider.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">
                        {provider.name}
                      </label>
                      {keyConfigured && !apiKey && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Configured
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) =>
                          handleApiKeyChange(provider.id, e.target.value)
                        }
                        placeholder={keyConfigured ? "••••••••••••••••••••••••" : `Enter ${provider.name} API key`}
                        className={`flex-1 px-3 py-2 border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                          keyConfigured && !apiKey ? "border-green-300 dark:border-green-700" : "border-input"
                        }`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => validateApiKey(provider.id, apiKey)}
                        disabled={(!apiKey && !keyConfigured) || isValidating}
                        title={!apiKey && !keyConfigured ? "Enter an API key to validate" : "Validate API key"}
                      >
                        {isValidating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Validate"
                        )}
                      </Button>
                    </div>
                    {keyConfigured && !apiKey && (
                      <p className="text-xs text-muted-foreground">
                        API key is configured. Enter a new key above to replace it.
                      </p>
                    )}
                    {validation && (
                      <div className="space-y-1">
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
                        {validation.availableModels && (
                          <div className="text-xs text-muted-foreground pl-4">
                            Available models from API: {validation.availableModels.join(", ")}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Models in app: {provider.models.map(m => m.name).join(", ")}
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
                    value={settings.defaultModel || defaultProvider.models[0]?.name || ""}
                    onChange={(e) => handleDefaultModelChange(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {defaultProvider.models.map((model) => (
                      <option key={model.id} value={model.name}>
                        {model.name}
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
