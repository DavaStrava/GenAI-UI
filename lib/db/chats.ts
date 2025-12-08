import { prisma } from "./client"
import type { Chat, Message } from "@/lib/generated/prisma"

export type ChatWithMessages = Chat & {
  messages: Message[]
}

/**
 * Get all chats, optionally filtered by projectId
 * Pass null for projectId to get chats not associated with any project
 */
export async function getChats(projectId: string | null): Promise<ChatWithMessages[]> {
  return prisma.chat.findMany({
    where: projectId === null ? { projectId: null } : { projectId },
    include: { messages: true },
    orderBy: { updatedAt: "desc" },
  })
}

/**
 * Get a chat by ID
 */
export async function getChat(id: string): Promise<ChatWithMessages | null> {
  return prisma.chat.findUnique({
    where: { id },
    include: { messages: true },
  })
}

/**
 * Create a new chat
 */
export async function createChat(data: {
  name: string
  projectId?: string | null
  llmProvider: string
  llmModel: string
  temperature?: number
  maxTokens?: number
}): Promise<Chat> {
  return prisma.chat.create({
    data: {
      ...data,
      projectId: data.projectId || null,
    },
  })
}

/**
 * Update a chat
 */
export async function updateChat(
  id: string,
  data: Partial<{
    name: string
    projectId: string | null
    llmProvider: string
    llmModel: string
    temperature: number
    maxTokens: number
  }>
): Promise<Chat> {
  return prisma.chat.update({
    where: { id },
    data,
  })
}

/**
 * Delete a chat
 */
export async function deleteChat(id: string): Promise<void> {
  await prisma.chat.delete({
    where: { id },
  })
}

/**
 * Rename a chat
 */
export async function renameChat(id: string, name: string): Promise<Chat> {
  return updateChat(id, { name })
}

/**
 * Add a message to a chat
 */
export async function addMessage(
  chatId: string,
  role: string,
  content: string
): Promise<Message> {
  // Also update the chat's updatedAt timestamp
  await prisma.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  })

  return prisma.message.create({
    data: {
      chatId,
      role,
      content,
    },
  })
}

/**
 * Get messages for a chat
 */
export async function getMessages(chatId: string): Promise<Message[]> {
  return prisma.message.findMany({
    where: { chatId },
    orderBy: { timestamp: "asc" },
  })
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

