"use client"

import type { Message } from "@/components/chat/chat-message"

const CHATS_PREFIX = "genai_chats_"
const INDEPENDENT_CHATS_KEY = "genai_chats_independent" // Chats not associated with any project

export interface Chat {
  id: string
  projectId: string | null // null for independent chats
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
 * Get all independent chats (not associated with any project)
 */
export function getIndependentChats(): Chat[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const stored = localStorage.getItem(INDEPENDENT_CHATS_KEY)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)
    return parsed.map((c: any) => ({
      ...c,
      projectId: null, // Ensure projectId is null for independent chats
      messages: c.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
    }))
  } catch (error) {
    console.error("Error loading independent chats:", error)
    return []
  }
}

/**
 * Save independent chats
 */
export function saveIndependentChats(chats: Chat[]): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(INDEPENDENT_CHATS_KEY, JSON.stringify(chats))
  } catch (error) {
    console.error("Error saving independent chats:", error)
    throw error
  }
}

/**
 * Get all chats for a project (or independent chats if projectId is null)
 */
export function getChats(projectId: string | null): Chat[] {
  if (projectId === null) {
    return getIndependentChats()
  }

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
 * Save chats for a project (or independent chats if projectId is null)
 */
export function saveChats(projectId: string | null, chats: Chat[]): void {
  if (projectId === null) {
    saveIndependentChats(chats)
    return
  }

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
 * Get a chat by ID (searches in project chats or independent chats)
 */
export function getChat(projectId: string | null, chatId: string): Chat | undefined {
  const chats = getChats(projectId)
  return chats.find((c) => c.id === chatId)
}

/**
 * Create a new chat (projectId can be null for independent chats)
 */
export function createChat(
  projectId: string | null,
  chatData: Omit<Chat, "id" | "createdAt" | "updatedAt" | "projectId">
): Chat {
  const chats = getChats(projectId)
  const newChat: Chat = {
    ...chatData,
    projectId,
    id: `chat-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  saveChats(projectId, [...chats, newChat])
  return newChat
}

/**
 * Update a chat (projectId can be null for independent chats)
 */
export function updateChat(
  projectId: string | null,
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
 * Delete a chat (projectId can be null for independent chats)
 */
export function deleteChat(projectId: string | null, chatId: string): void {
  const chats = getChats(projectId)
  const filtered = chats.filter((c) => c.id !== chatId)
  saveChats(projectId, filtered)
}

/**
 * Rename a chat (projectId can be null for independent chats)
 */
export function renameChat(
  projectId: string | null,
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

