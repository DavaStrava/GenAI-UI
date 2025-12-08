import { prisma } from "./client"
import { encrypt, decrypt } from "@/lib/utils/encryption"
import type { UserSettings, ApiKey } from "@/lib/generated/prisma"

// Default user ID for single-user mode (no auth)
const DEFAULT_USER_ID = "default-user"

export interface SettingsData {
  apiKeys: {
    openai?: string
    anthropic?: string
    google?: string
  }
  defaultProvider?: string
  defaultModel?: string
}

const defaultSettings: SettingsData = {
  apiKeys: {},
  defaultProvider: "openai",
  defaultModel: "gpt-4o-mini",
}

/**
 * Ensure a default user exists for single-user mode
 */
async function ensureDefaultUser(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: {},
    create: {
      id: DEFAULT_USER_ID,
      name: "Default User",
    },
  })
  return user.id
}

/**
 * Get user settings from the database
 */
export async function getSettings(): Promise<SettingsData> {
  try {
    const userId = await ensureDefaultUser()

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      include: { apiKeys: true },
    })

    if (!settings) {
      return defaultSettings
    }

    // Decrypt API keys
    const apiKeys: SettingsData["apiKeys"] = {}
    for (const apiKey of settings.apiKeys) {
      const decrypted = decrypt(apiKey.encryptedKey)
      if (decrypted) {
        apiKeys[apiKey.provider as keyof SettingsData["apiKeys"]] = decrypted
      }
    }

    return {
      apiKeys,
      defaultProvider: settings.defaultProvider || defaultSettings.defaultProvider,
      defaultModel: settings.defaultModel || defaultSettings.defaultModel,
    }
  } catch (error) {
    console.error("Error loading settings:", error)
    return defaultSettings
  }
}

/**
 * Save user settings to the database
 * Only updates API keys that are explicitly provided (non-empty)
 * Keeps existing keys that weren't changed
 */
export async function saveSettings(settings: SettingsData): Promise<void> {
  try {
    const userId = await ensureDefaultUser()

    // Upsert the settings
    const userSettings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        defaultProvider: settings.defaultProvider,
        defaultModel: settings.defaultModel,
      },
      create: {
        userId,
        defaultProvider: settings.defaultProvider,
        defaultModel: settings.defaultModel,
      },
    })

    // Only update API keys that are explicitly provided (non-empty)
    // This preserves existing keys that weren't changed
    const apiKeyEntries = Object.entries(settings.apiKeys).filter(
      ([, value]) => value !== undefined && value !== ""
    )

    for (const [provider, key] of apiKeyEntries) {
      if (key) {
        // Upsert - update if exists, create if not
        await prisma.apiKey.upsert({
          where: {
            settingsId_provider: {
              settingsId: userSettings.id,
              provider,
            },
          },
          update: {
            encryptedKey: encrypt(key),
          },
          create: {
            provider,
            encryptedKey: encrypt(key),
            settingsId: userSettings.id,
          },
        })
      }
    }
  } catch (error) {
    console.error("Error saving settings:", error)
    throw error
  }
}

/**
 * Get API key for a specific provider
 */
export async function getApiKey(providerId: string): Promise<string | undefined> {
  const settings = await getSettings()
  return settings.apiKeys[providerId as keyof SettingsData["apiKeys"]]
}

/**
 * Update API key for a specific provider
 */
export async function updateApiKey(
  providerId: string,
  apiKey: string | undefined
): Promise<void> {
  const settings = await getSettings()
  const newSettings: SettingsData = {
    ...settings,
    apiKeys: {
      ...settings.apiKeys,
      [providerId]: apiKey,
    },
  }
  await saveSettings(newSettings)
}

/**
 * Validate that required settings are present
 */
export async function validateSettings(): Promise<{
  valid: boolean
  missing: string[]
}> {
  const settings = await getSettings()
  const missing: string[] = []

  const providers = ["OpenAI", "Anthropic", "Google"]
  const providerIds = ["openai", "anthropic", "google"]

  for (let i = 0; i < providerIds.length; i++) {
    if (!settings.apiKeys[providerIds[i] as keyof SettingsData["apiKeys"]]) {
      missing.push(providers[i])
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

