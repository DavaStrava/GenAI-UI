import { NextRequest, NextResponse } from "next/server"
import * as settingsDb from "@/lib/db/settings"

// Use Node.js runtime for Prisma (SQLite doesn't work with Edge)
export const runtime = "nodejs"

/**
 * GET /api/settings/db - Get settings from database
 */
export async function GET() {
  try {
    const settings = await settingsDb.getSettings()
    
    // Don't return raw API keys - return masked versions for display
    const maskedSettings = {
      ...settings,
      apiKeys: {
        openai: settings.apiKeys.openai ? maskApiKey(settings.apiKeys.openai) : undefined,
        anthropic: settings.apiKeys.anthropic ? maskApiKey(settings.apiKeys.anthropic) : undefined,
        google: settings.apiKeys.google ? maskApiKey(settings.apiKeys.google) : undefined,
      },
      // Also return which providers have keys configured
      hasApiKey: {
        openai: !!settings.apiKeys.openai,
        anthropic: !!settings.apiKeys.anthropic,
        google: !!settings.apiKeys.google,
      },
    }
    
    return NextResponse.json(maskedSettings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/db - Save settings to database
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { apiKeys, defaultProvider, defaultModel } = body

    await settingsDb.saveSettings({
      apiKeys: apiKeys || {},
      defaultProvider,
      defaultModel,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving settings:", error)
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    )
  }
}

/**
 * Mask an API key for display (show first 4 and last 4 characters)
 */
function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return "****"
  }
  return key.slice(0, 4) + "..." + key.slice(-4)
}

