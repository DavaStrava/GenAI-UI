"use client"

import type { Message } from "@/components/chat/chat-message"

const CHATS_PREFIX = "genai_chats_"

export interface Chat {
  id: string
  projectId: string
  name: string
  messages: Message[]
  llmProvider: string
  llmModel: string
  temperature?: number
  maxTokens?: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Get all chats for a project
 */
export function getChats(projectId: string): Chat[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const stored = localStorage.getItem(`${CHATS_PREFIX}${projectId}`)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)
    return parsed.map((c: any) => ({
      ...c,
      messages: c.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
    }))
  } catch (error) {
    console.error("Error loading chats:", error)
    return []
  }
}

/**
 * Save chats for a project
 */
export function saveChats(projectId: string, chats: Chat[]): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(`${CHATS_PREFIX}${projectId}`, JSON.stringify(chats))
  } catch (error) {
    console.error("Error saving chats:", error)
    throw error
  }
}

/**
 * Get a chat by ID
 */
export function getChat(projectId: string, chatId: string): Chat | undefined {
  const chats = getChats(projectId)
  return chats.find((c) => c.id === chatId)
}

/**
 * Create a new chat
 */
export function createChat(
  projectId: string,
  chatData: Omit<Chat, "id" | "createdAt" | "updatedAt">
): Chat {
  const chats = getChats(projectId)
  const newChat: Chat = {
    ...chatData,
    id: `chat-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  saveChats(projectId, [...chats, newChat])
  return newChat
}

/**
 * Update a chat
 */
export function updateChat(
  projectId: string,
  chatId: string,
  updates: Partial<Chat>
): void {
  const chats = getChats(projectId)
  const updated = chats.map((c) =>
    c.id === chatId ? { ...c, ...updates, updatedAt: new Date() } : c
  )
  saveChats(projectId, updated)
}

/**
 * Delete a chat
 */
export function deleteChat(projectId: string, chatId: string): void {
  const chats = getChats(projectId)
  const filtered = chats.filter((c) => c.id !== chatId)
  saveChats(projectId, filtered)
}

/**
 * Rename a chat
 */
export function renameChat(
  projectId: string,
  chatId: string,
  newName: string
): void {
  updateChat(projectId, chatId, { name: newName })
}

/**
 * Generate a chat name from the first message
 */
export function generateChatName(firstMessage: string): string {
  const maxLength = 50
  const trimmed = firstMessage.trim()
  if (trimmed.length <= maxLength) {
    return trimmed
  }
  return trimmed.slice(0, maxLength - 3) + "..."
}

