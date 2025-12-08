import { NextRequest, NextResponse } from "next/server"
import * as chatsDb from "@/lib/db/chats"

// Use Node.js runtime for Prisma (SQLite doesn't work with Edge)
export const runtime = "nodejs"

/**
 * GET /api/chats/[id]/messages - Get all messages for a chat
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const messages = await chatsDb.getMessages(id)
    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/chats/[id]/messages - Add a message to a chat
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { role, content } = await req.json()

    if (!role || typeof role !== "string") {
      return NextResponse.json(
        { error: "Message role is required" },
        { status: 400 }
      )
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      )
    }

    const message = await chatsDb.addMessage(id, role, content)
    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Error adding message:", error)
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 }
    )
  }
}

