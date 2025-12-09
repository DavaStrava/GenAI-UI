"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { getAllProviders, getProvider } from "@/lib/llm/provider-factory"

interface LLMContextType {
  provider: string
  model: string // Display name
  temperature: number
  maxTokens: number | undefined
  isLoading: boolean
  setProvider: (provider: string) => void
  setModel: (model: string) => void
  setTemperature: (temperature: number) => void
  setMaxTokens: (maxTokens: number | undefined) => void
  availableProviders: ReturnType<typeof getAllProviders>
  getCurrentApiKey: () => Promise<string | undefined>
  getModelId: () => string | undefined // Get API model ID from display name
  refreshSettings: () => Promise<void>
}

const LLMContext = createContext<LLMContextType | undefined>(undefined)

export function LLMProvider({ children }: { children: React.ReactNode }) {
  const providers = getAllProviders()

  const [provider, setProviderState] = useState("openai")
  const [model, setModelState] = useState(providers[0]?.models[0]?.name || "")
  const [temperature, setTemperatureState] = useState(0.7)
  const [maxTokens, setMaxTokensState] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/db")
      if (response.ok) {
        const settings = await response.json()
        if (settings.defaultProvider) {
          setProviderState(settings.defaultProvider)
        }
        if (settings.defaultModel) {
          // Convert stored model (could be ID or name) to display name
          const providerObj = getProvider(settings.defaultProvider || "openai")
          if (providerObj) {
            const modelObj = providerObj.models.find(
              (m) => m.id === settings.defaultModel || m.name === settings.defaultModel
            )
            setModelState(modelObj?.name || settings.defaultModel)
          } else {
            setModelState(settings.defaultModel)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }, [])

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      await refreshSettings()
      setIsLoading(false)
    }

    loadSettings()
  }, [refreshSettings])

  const setProvider = (newProvider: string) => {
    const providerObj = getProvider(newProvider)
    if (providerObj) {
      setProviderState(newProvider)
      // Check if current model exists in new provider
      const currentModelExists = providerObj.models.some(
        (m) => m.name === model || m.id === model
      )
      if (!currentModelExists) {
        setModelState(providerObj.models[0]?.name || "")
      }
    }
  }

  const setModel = (newModel: string) => {
    const providerObj = getProvider(provider)
    if (providerObj) {
      // Check if the model name or ID exists
      const modelExists = providerObj.models.some(
        (m) => m.name === newModel || m.id === newModel
      )
      if (modelExists) {
        // Store the display name
        const modelObj = providerObj.models.find(
          (m) => m.name === newModel || m.id === newModel
        )
        setModelState(modelObj?.name || newModel)
      }
    }
  }

  const getCurrentApiKey = useCallback(async (): Promise<string | undefined> => {
    try {
      const response = await fetch(`/api/settings/apikey?provider=${provider}`)
      if (response.ok) {
        const data = await response.json()
        return data.apiKey
      }
      return undefined
    } catch (error) {
      console.error("Error fetching API key:", error)
      return undefined
    }
  }, [provider])

  const getModelId = useCallback((): string | undefined => {
    const providerObj = getProvider(provider)
    if (providerObj && model) {
      return providerObj.getModelId(model)
    }
    return undefined
  }, [provider, model])

  return (
    <LLMContext.Provider
      value={{
        provider,
        model,
        temperature,
        maxTokens,
        isLoading,
        setProvider,
        setModel,
        setTemperature: setTemperatureState,
        setMaxTokens: setMaxTokensState,
        availableProviders: providers,
        getCurrentApiKey,
        getModelId,
        refreshSettings,
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
