import { NextRequest, NextResponse } from "next/server"
import * as chatsDb from "@/lib/db/chats"

// Use Node.js runtime for Prisma (SQLite doesn't work with Edge)
export const runtime = "nodejs"

/**
 * GET /api/chats/[id] - Get a chat by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const chat = await chatsDb.getChat(id)

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error("Error fetching chat:", error)
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/chats/[id] - Update a chat
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const chat = await chatsDb.updateChat(id, body)
    return NextResponse.json(chat)
  } catch (error) {
    console.error("Error updating chat:", error)
    return NextResponse.json(
      { error: "Failed to update chat" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/chats/[id] - Delete a chat
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await chatsDb.deleteChat(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting chat:", error)
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    )
  }
}

