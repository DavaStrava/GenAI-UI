"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { getAllProviders, getProvider } from "@/lib/llm/provider-factory"

interface LLMContextType {
  provider: string
  model: string
  temperature: number
  maxTokens: number | undefined
  isLoading: boolean
  setProvider: (provider: string) => void
  setModel: (model: string) => void
  setTemperature: (temperature: number) => void
  setMaxTokens: (maxTokens: number | undefined) => void
  availableProviders: ReturnType<typeof getAllProviders>
  getCurrentApiKey: () => Promise<string | undefined>
  refreshSettings: () => Promise<void>
}

const LLMContext = createContext<LLMContextType | undefined>(undefined)

export function LLMProvider({ children }: { children: React.ReactNode }) {
  const providers = getAllProviders()

  const [provider, setProviderState] = useState("openai")
  const [model, setModelState] = useState(providers[0]?.models[0] || "")
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
          setModelState(settings.defaultModel)
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
