"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { getSettings, saveSettings } from "@/lib/storage/settings"
import { getAllProviders } from "@/lib/llm/provider-factory"

interface LLMContextType {
  provider: string
  model: string
  temperature: number
  maxTokens: number
  setProvider: (provider: string) => void
  setModel: (model: string) => void
  setTemperature: (temperature: number) => void
  setMaxTokens: (maxTokens: number) => void
  getCurrentApiKey: () => Promise<string | undefined>
}

const LLMContext = createContext<LLMContextType | undefined>(undefined)

const DEFAULT_PROVIDER = "openai"
const DEFAULT_MODEL = "gpt-4o-mini"
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 2000

export function LLMProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProviderState] = useState<string>(DEFAULT_PROVIDER)
  const [model, setModelState] = useState<string>(DEFAULT_MODEL)
  const [temperature, setTemperatureState] = useState<number>(DEFAULT_TEMPERATURE)
  const [maxTokens, setMaxTokensState] = useState<number>(DEFAULT_MAX_TOKENS)
  const isValidatingRef = useRef(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const settings = getSettings()
    const providers = getAllProviders()
    
    // Validate and set provider
    let providerToUse = DEFAULT_PROVIDER
    if (settings.defaultProvider) {
      const providerExists = providers.some((p) => p.id === settings.defaultProvider)
      if (providerExists) {
        providerToUse = settings.defaultProvider
        setProviderState(providerToUse)
      } else {
        setProviderState(DEFAULT_PROVIDER)
      }
    } else {
      setProviderState(DEFAULT_PROVIDER)
    }
    
    // Validate and set model - ensure it exists for the selected provider
    const selectedProvider = providers.find((p) => p.id === providerToUse)
    if (selectedProvider) {
      let modelToUse = DEFAULT_MODEL
      if (settings.defaultModel) {
        // Check if the stored model exists in the provider's model list
        const modelExists = selectedProvider.models.some((m) => m.id === settings.defaultModel)
        if (modelExists) {
          modelToUse = settings.defaultModel
        } else {
          // Model doesn't exist, use first available model for this provider
          modelToUse = selectedProvider.models[0]?.id || DEFAULT_MODEL
          // Update stored settings with the valid model
          saveSettings({
            ...settings,
            defaultProvider: providerToUse,
            defaultModel: modelToUse,
          })
        }
      } else {
        // No model stored, use first available model for this provider
        modelToUse = selectedProvider.models[0]?.id || DEFAULT_MODEL
      }
      setModelState(modelToUse)
    } else {
      setModelState(DEFAULT_MODEL)
    }
    
    // Load temperature and maxTokens from localStorage if available
    if (typeof window !== "undefined") {
      const storedTemp = localStorage.getItem("genai_temperature")
      const storedMaxTokens = localStorage.getItem("genai_max_tokens")
      if (storedTemp) {
        setTemperatureState(parseFloat(storedTemp))
      }
      if (storedMaxTokens) {
        setMaxTokensState(parseInt(storedMaxTokens, 10))
      }
    }
  }, [])

  const setModel = useCallback((newModel: string) => {
    setModelState(newModel)
    const settings = getSettings()
    saveSettings({
      ...settings,
      defaultModel: newModel,
    })
  }, [])

  const setProvider = useCallback((newProvider: string) => {
    setProviderState(newProvider)
    const settings = getSettings()
    saveSettings({
      ...settings,
      defaultProvider: newProvider,
    })
    
    // Reset model to first available model for the new provider
    const providers = getAllProviders()
    const selectedProvider = providers.find((p) => p.id === newProvider)
    if (selectedProvider && selectedProvider.models.length > 0) {
      setModel(selectedProvider.models[0].id)
    }
  }, [setModel])

  const setTemperature = useCallback((newTemperature: number) => {
    setTemperatureState(newTemperature)
    if (typeof window !== "undefined") {
      localStorage.setItem("genai_temperature", newTemperature.toString())
    }
  }, [])

  const setMaxTokens = useCallback((newMaxTokens: number) => {
    setMaxTokensState(newMaxTokens)
    if (typeof window !== "undefined") {
      localStorage.setItem("genai_max_tokens", newMaxTokens.toString())
    }
  }, [])

  // Validate model whenever provider changes (to ensure model is valid for new provider)
  useEffect(() => {
    if (isValidatingRef.current) return
    isValidatingRef.current = true
    
    const providers = getAllProviders()
    const selectedProvider = providers.find((p) => p.id === provider)
    
    if (selectedProvider) {
      // Check if current model exists for this provider
      const modelExists = selectedProvider.models.some((m) => m.id === model)
      if (!modelExists) {
        // Model doesn't exist, reset to first available model
        const firstModel = selectedProvider.models[0]?.id
        if (firstModel && firstModel !== model) {
          console.warn(`Model "${model}" not found for provider "${provider}", resetting to "${firstModel}"`)
          setModelState(firstModel)
          const settings = getSettings()
          saveSettings({
            ...settings,
            defaultProvider: provider,
            defaultModel: firstModel,
          })
        }
      }
    }
    
    isValidatingRef.current = false
  }, [provider]) // Only run when provider changes, not model

  const getCurrentApiKey = useCallback(async (): Promise<string | undefined> => {
    try {
      const response = await fetch(`/api/settings/apikey?provider=${provider}`)
      if (response.ok) {
        const data = await response.json()
        if (data.apiKey) {
          return data.apiKey
        }
        console.warn(`API key for ${provider} is empty`)
        return undefined
      } else if (response.status === 404) {
        console.warn(`No API key configured for ${provider}. Please configure it in Settings.`)
        return undefined
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error(`Failed to fetch API key for ${provider}:`, response.status, errorData)
        return undefined
      }
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
        setProvider,
        setModel,
        setTemperature,
        setMaxTokens,
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
