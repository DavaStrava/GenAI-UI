"use client"

import { useState } from "react"
import { useLLM } from "@/lib/contexts/llm-context"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown, Sparkles } from "lucide-react"
import { getApiKey } from "@/lib/storage/settings"

export function LLMSelector() {
  const { provider, model, setProvider, setModel, availableProviders, getCurrentApiKey } = useLLM()
  const [isOpen, setIsOpen] = useState(false)

  const currentProvider = availableProviders.find((p) => p.id === provider)
  const currentApiKey = getCurrentApiKey()
  const hasApiKey = !!currentApiKey

  const handleProviderChange = (providerId: string) => {
    setProvider(providerId)
    setIsOpen(false)
  }

  const handleModelChange = (modelId: string) => {
    setModel(modelId)
    setIsOpen(false)
  }

  if (!currentProvider) {
    return null
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">
          {currentProvider.name} / {model}
        </span>
        <span className="sm:hidden">{model}</span>
        {!hasApiKey && (
          <span className="h-2 w-2 rounded-full bg-yellow-500" title="API key not configured" />
        )}
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-20">
            <div className="p-2 space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                Provider
              </div>
              {availableProviders.map((p) => {
                const hasKey = !!getApiKey(p.id)
                const isSelected = p.id === provider
                return (
                  <button
                    key={p.id}
                    onClick={() => handleProviderChange(p.id)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-accent ${
                      isSelected ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{p.name}</span>
                      {!hasKey && (
                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                )
              })}
            </div>

            <div className="border-t border-border p-2 space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                Model
              </div>
              {currentProvider.models.map((m) => {
                const isSelected = m === model
                return (
                  <button
                    key={m}
                    onClick={() => handleModelChange(m)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-accent ${
                      isSelected ? "bg-accent" : ""
                    }`}
                  >
                    <span className="text-xs font-mono">{m}</span>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                )
              })}
            </div>

            {!hasApiKey && (
              <div className="border-t border-border p-2">
                <div className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                  ⚠️ API key not configured. Please configure it in Settings.
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

