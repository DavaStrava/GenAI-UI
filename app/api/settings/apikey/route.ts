import { NextRequest, NextResponse } from "next/server"
import * as settingsDb from "@/lib/db/settings"

// Use Node.js runtime for Prisma (SQLite doesn't work with Edge)
export const runtime = "nodejs"

/**
 * GET /api/settings/apikey - Get raw API key for a provider (for use in chat requests)
 * Query params:
 *   - provider: string (openai, anthropic, google)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const provider = searchParams.get("provider")

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      )
    }

    const apiKey = await settingsDb.getApiKey(provider)

    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key configured for ${provider}` },
        { status: 404 }
      )
    }

    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error("Error fetching API key:", error)
    return NextResponse.json(
      { error: "Failed to fetch API key" },
      { status: 500 }
    )
  }
}

