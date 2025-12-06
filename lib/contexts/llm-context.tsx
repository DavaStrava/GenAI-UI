"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { getAllProviders, getProvider } from "@/lib/llm/provider-factory"
import { getSettings, getApiKey } from "@/lib/storage/settings"

interface LLMContextType {
  provider: string
  model: string
  temperature: number
  maxTokens: number | undefined
  setProvider: (provider: string) => void
  setModel: (model: string) => void
  setTemperature: (temperature: number) => void
  setMaxTokens: (maxTokens: number | undefined) => void
  availableProviders: ReturnType<typeof getAllProviders>
  getCurrentApiKey: () => string | undefined
}

const LLMContext = createContext<LLMContextType | undefined>(undefined)

export function LLMProvider({ children }: { children: React.ReactNode }) {
  const settings = getSettings()
  const providers = getAllProviders()

  // Initialize from settings or defaults
  const [provider, setProviderState] = useState(
    settings.defaultProvider || "openai"
  )
  const [model, setModelState] = useState(
    settings.defaultModel || providers[0]?.models[0] || ""
  )
  const [temperature, setTemperatureState] = useState(0.7)
  const [maxTokens, setMaxTokensState] = useState<number | undefined>(undefined)

  // Sync with settings when they change
  useEffect(() => {
    const currentSettings = getSettings()
    if (currentSettings.defaultProvider) {
      setProviderState(currentSettings.defaultProvider)
    }
    if (currentSettings.defaultModel) {
      setModelState(currentSettings.defaultModel)
    }
  }, [])

  const setProvider = (newProvider: string) => {
    const providerObj = getProvider(newProvider)
    if (providerObj) {
      setProviderState(newProvider)
      // Set model to first available model for the provider
      if (!providerObj.models.includes(model)) {
        setModelState(providerObj.models[0])
      }
    }
  }

  const setModel = (newModel: string) => {
    const providerObj = getProvider(provider)
    if (providerObj?.models.includes(newModel)) {
      setModelState(newModel)
    }
  }

  const getCurrentApiKey = () => {
    return getApiKey(provider)
  }

  return (
    <LLMContext.Provider
      value={{
        provider,
        model,
        temperature,
        maxTokens,
        setProvider,
        setModel,
        setTemperature: setTemperatureState,
        setMaxTokens: setMaxTokensState,
        availableProviders: providers,
        getCurrentApiKey,
      }}
    >
      {children}
    </LLMContext.Provider>
  )
}

export function useLLM() {
  const context = useContext(LLMContext)
  if (context === undefined) {
    throw new Error("useLLM must be used within an LLMProvider")
  }
  return context
}

