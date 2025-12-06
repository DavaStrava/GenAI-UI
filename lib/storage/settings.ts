"use client"

import { encrypt, decrypt } from "@/lib/utils/encryption"
import { getAllProviders } from "@/lib/llm/provider-factory"

const SETTINGS_KEY = "genai_settings"

export interface Settings {
  apiKeys: {
    openai?: string
    anthropic?: string
    google?: string
  }
  defaultProvider?: string
  defaultModel?: string
}

const defaultSettings: Settings = {
  apiKeys: {},
  defaultProvider: "openai",
  defaultModel: "gpt-4o-mini",
}

/**
 * Get settings from localStorage
 */
export function getSettings(): Settings {
  if (typeof window === "undefined") {
    return defaultSettings
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (!stored) {
      return defaultSettings
    }

    const parsed = JSON.parse(stored)
    
    // Decrypt API keys
    const decrypted: Settings = {
      ...parsed,
      apiKeys: {
        openai: parsed.apiKeys?.openai ? decrypt(parsed.apiKeys.openai) : undefined,
        anthropic: parsed.apiKeys?.anthropic ? decrypt(parsed.apiKeys.anthropic) : undefined,
        google: parsed.apiKeys?.google ? decrypt(parsed.apiKeys.google) : undefined,
      },
    }

    return decrypted
  } catch (error) {
    console.error("Error loading settings:", error)
    return defaultSettings
  }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    // Encrypt API keys before storing
    const encrypted: Omit<Settings, "apiKeys"> & {
      apiKeys: {
        openai?: string
        anthropic?: string
        google?: string
      }
    } = {
      ...settings,
      apiKeys: {
        openai: settings.apiKeys?.openai ? encrypt(settings.apiKeys.openai) : undefined,
        anthropic: settings.apiKeys?.anthropic ? encrypt(settings.apiKeys.anthropic) : undefined,
        google: settings.apiKeys?.google ? encrypt(settings.apiKeys.google) : undefined,
      },
    }

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(encrypted))
  } catch (error) {
    console.error("Error saving settings:", error)
    throw error
  }
}

/**
 * Get API key for a specific provider
 */
export function getApiKey(providerId: string): string | undefined {
  const settings = getSettings()
  return settings.apiKeys[providerId as keyof typeof settings.apiKeys]
}

/**
 * Update API key for a specific provider
 */
export function updateApiKey(providerId: string, apiKey: string | undefined): void {
  const settings = getSettings()
  const newSettings: Settings = {
    ...settings,
    apiKeys: {
      ...settings.apiKeys,
      [providerId]: apiKey,
    },
  }
  saveSettings(newSettings)
}

/**
 * Validate that required settings are present
 */
export function validateSettings(): { valid: boolean; missing: string[] } {
  const settings = getSettings()
  const missing: string[] = []

  const providers = getAllProviders()
  for (const provider of providers) {
    if (!settings.apiKeys[provider.id as keyof typeof settings.apiKeys]) {
      missing.push(provider.name)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

