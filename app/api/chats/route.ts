import { NextRequest, NextResponse } from "next/server"
import * as chatsDb from "@/lib/db/chats"

// Use Node.js runtime for Prisma (SQLite doesn't work with Edge)
export const runtime = "nodejs"

/**
 * GET /api/chats - Get all chats (optionally filtered by projectId)
 * Query params:
 *   - projectId: string | "null" (for independent chats)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectIdParam = searchParams.get("projectId")

    // Parse projectId - "null" string means get independent chats
    const projectId = projectIdParam === "null" ? null : projectIdParam

    const chats = await chatsDb.getChats(projectId)
    return NextResponse.json(chats)
  } catch (error) {
    console.error("Error fetching chats:", error)
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/chats - Create a new chat
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, projectId, llmProvider, llmModel, temperature, maxTokens } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Chat name is required" },
        { status: 400 }
      )
    }

    if (!llmProvider || typeof llmProvider !== "string") {
      return NextResponse.json(
        { error: "LLM provider is required" },
        { status: 400 }
      )
    }

    if (!llmModel || typeof llmModel !== "string") {
      return NextResponse.json(
        { error: "LLM model is required" },
        { status: 400 }
      )
    }

    const chat = await chatsDb.createChat({
      name,
      projectId: projectId || null,
      llmProvider,
      llmModel,
      temperature,
      maxTokens,
    })

    return NextResponse.json(chat, { status: 201 })
  } catch (error) {
    console.error("Error creating chat:", error)
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    )
  }
}

