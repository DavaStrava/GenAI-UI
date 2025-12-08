import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { encrypt } from "@/lib/utils/encryption"

// Use Node.js runtime for Prisma
export const runtime = "nodejs"

// Default user ID for single-user mode
const DEFAULT_USER_ID = "default-user"

interface LocalStorageProject {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface LocalStorageMessage {
  id: string
  role: string
  content: string
  timestamp: string
}

interface LocalStorageChat {
  id: string
  projectId: string | null
  name: string
  messages: LocalStorageMessage[]
  llmProvider: string
  llmModel: string
  temperature?: number
  maxTokens?: number
  createdAt: string
  updatedAt: string
}

interface LocalStorageSettings {
  apiKeys: {
    openai?: string
    anthropic?: string
    google?: string
  }
  defaultProvider?: string
  defaultModel?: string
}

interface MigrationData {
  projects: LocalStorageProject[]
  chats: LocalStorageChat[]
  settings: LocalStorageSettings
}

/**
 * POST /api/migrate - Migrate localStorage data to database
 */
export async function POST(req: NextRequest) {
  try {
    const data: MigrationData = await req.json()
    const results = {
      projects: { migrated: 0, skipped: 0 },
      chats: { migrated: 0, skipped: 0 },
      messages: { migrated: 0 },
      settings: { migrated: false },
    }

    // Ensure default user exists
    await prisma.user.upsert({
      where: { id: DEFAULT_USER_ID },
      update: {},
      create: {
        id: DEFAULT_USER_ID,
        name: "Default User",
      },
    })

    // Map old project IDs to new project IDs
    const projectIdMap = new Map<string, string>()

    // Migrate projects
    for (const project of data.projects || []) {
      try {
        // Check if project already exists
        const existing = await prisma.project.findFirst({
          where: {
            name: project.name,
          },
        })

        if (existing) {
          projectIdMap.set(project.id, existing.id)
          results.projects.skipped++
          continue
        }

        const newProject = await prisma.project.create({
          data: {
            name: project.name,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
          },
        })
        projectIdMap.set(project.id, newProject.id)
        results.projects.migrated++
      } catch (error) {
        console.error(`Error migrating project ${project.name}:`, error)
        results.projects.skipped++
      }
    }

    // Migrate chats
    for (const chat of data.chats || []) {
      try {
        // Check if chat already exists (by name and similar timestamp)
        const existing = await prisma.chat.findFirst({
          where: {
            name: chat.name,
          },
        })

        if (existing) {
          results.chats.skipped++
          continue
        }

        // Map old projectId to new projectId
        const newProjectId = chat.projectId ? projectIdMap.get(chat.projectId) : null

        const newChat = await prisma.chat.create({
          data: {
            name: chat.name,
            projectId: newProjectId,
            llmProvider: chat.llmProvider,
            llmModel: chat.llmModel,
            temperature: chat.temperature,
            maxTokens: chat.maxTokens,
            createdAt: new Date(chat.createdAt),
            updatedAt: new Date(chat.updatedAt),
          },
        })

        // Migrate messages for this chat
        for (const message of chat.messages || []) {
          await prisma.message.create({
            data: {
              chatId: newChat.id,
              role: message.role,
              content: message.content,
              timestamp: new Date(message.timestamp),
            },
          })
          results.messages.migrated++
        }

        results.chats.migrated++
      } catch (error) {
        console.error(`Error migrating chat ${chat.name}:`, error)
        results.chats.skipped++
      }
    }

    // Migrate settings
    if (data.settings) {
      try {
        const userSettings = await prisma.userSettings.upsert({
          where: { userId: DEFAULT_USER_ID },
          update: {
            defaultProvider: data.settings.defaultProvider,
            defaultModel: data.settings.defaultModel,
          },
          create: {
            userId: DEFAULT_USER_ID,
            defaultProvider: data.settings.defaultProvider,
            defaultModel: data.settings.defaultModel,
          },
        })

        // Delete existing API keys
        await prisma.apiKey.deleteMany({
          where: { settingsId: userSettings.id },
        })

        // Create new API keys
        const apiKeyEntries = Object.entries(data.settings.apiKeys || {}).filter(
          ([, value]) => value !== undefined && value !== ""
        )

        for (const [provider, key] of apiKeyEntries) {
          if (key) {
            await prisma.apiKey.create({
              data: {
                provider,
                encryptedKey: encrypt(key),
                settingsId: userSettings.id,
              },
            })
          }
        }

        results.settings.migrated = true
      } catch (error) {
        console.error("Error migrating settings:", error)
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Migration complete: ${results.projects.migrated} projects, ${results.chats.migrated} chats, ${results.messages.migrated} messages migrated`,
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      { error: "Migration failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

