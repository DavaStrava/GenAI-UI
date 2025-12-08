"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Database, ArrowRight, Check, X, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { decrypt } from "@/lib/utils/encryption"

interface MigrationResults {
  projects: { migrated: number; skipped: number }
  chats: { migrated: number; skipped: number }
  messages: { migrated: number }
  settings: { migrated: boolean }
}

export default function MigratePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [results, setResults] = useState<MigrationResults | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [localStorageData, setLocalStorageData] = useState<{
    projects: number
    chats: number
    settings: boolean
  } | null>(null)

  // Scan localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const projectsData = localStorage.getItem("genai_projects")
      const projects = projectsData ? JSON.parse(projectsData) : []

      // Count chats from various localStorage keys
      let chatCount = 0
      const independentChats = localStorage.getItem("genai_chats_independent")
      if (independentChats) {
        chatCount += JSON.parse(independentChats).length
      }
      
      // Check for project-specific chats
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith("genai_chats_") && key !== "genai_chats_independent") {
          const chats = localStorage.getItem(key)
          if (chats) {
            chatCount += JSON.parse(chats).length
          }
        }
      }

      const settingsData = localStorage.getItem("genai_settings")
      
      setLocalStorageData({
        projects: projects.length,
        chats: chatCount,
        settings: !!settingsData,
      })
    }
  }, [])

  const handleMigrate = async () => {
    if (typeof window === "undefined") return

    setStatus("loading")
    setErrorMessage(null)

    try {
      // Gather all localStorage data
      const projectsData = localStorage.getItem("genai_projects")
      const projects = projectsData ? JSON.parse(projectsData) : []

      // Gather all chats
      const allChats: any[] = []
      
      // Independent chats
      const independentChats = localStorage.getItem("genai_chats_independent")
      if (independentChats) {
        const parsed = JSON.parse(independentChats)
        allChats.push(...parsed.map((c: any) => ({ ...c, projectId: null })))
      }

      // Project-specific chats
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith("genai_chats_") && key !== "genai_chats_independent") {
          const projectId = key.replace("genai_chats_", "")
          const chats = localStorage.getItem(key)
          if (chats) {
            const parsed = JSON.parse(chats)
            allChats.push(...parsed.map((c: any) => ({ ...c, projectId })))
          }
        }
      }

      // Settings (need to decrypt API keys)
      const settingsData = localStorage.getItem("genai_settings")
      let settings = null
      if (settingsData) {
        const parsed = JSON.parse(settingsData)
        // Decrypt API keys before sending to migration endpoint
        const decryptedApiKeys: Record<string, string | undefined> = {}
        if (parsed.apiKeys) {
          for (const [provider, encryptedKey] of Object.entries(parsed.apiKeys)) {
            if (encryptedKey && typeof encryptedKey === 'string') {
              try {
                const decrypted = decrypt(encryptedKey)
                if (decrypted) {
                  decryptedApiKeys[provider] = decrypted
                }
              } catch (e) {
                console.warn(`Failed to decrypt ${provider} key:`, e)
              }
            }
          }
        }
        settings = {
          ...parsed,
          apiKeys: decryptedApiKeys,
        }
      }

      const response = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects,
          chats: allChats,
          settings,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResults(data.results)
        setStatus("success")
      } else {
        throw new Error(data.error || "Migration failed")
      }
    } catch (error) {
      console.error("Migration error:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
      setStatus("error")
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Database Migration</h1>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Back to Chat
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-8">
          {/* Info Section */}
          <section className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h2 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                What does this migration do?
              </h2>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This tool migrates your existing data from browser localStorage to the new SQLite database.
                Your projects, chats, messages, and settings will be copied to the database for better
                performance and reliability.
              </p>
            </div>
          </section>

          {/* Current Data Section */}
          {localStorageData && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Data Found in localStorage</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-3xl font-bold text-primary">{localStorageData.projects}</div>
                  <div className="text-sm text-muted-foreground">Projects</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-3xl font-bold text-primary">{localStorageData.chats}</div>
                  <div className="text-sm text-muted-foreground">Chats</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-3xl font-bold text-primary">
                    {localStorageData.settings ? <Check className="h-8 w-8 mx-auto text-green-500" /> : <X className="h-8 w-8 mx-auto text-gray-400" />}
                  </div>
                  <div className="text-sm text-muted-foreground">Settings</div>
                </div>
              </div>
            </section>
          )}

          {/* Migration Action */}
          <section className="space-y-4">
            <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg">
              {status === "idle" && (
                <>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="p-3 bg-muted rounded-lg">
                      <Database className="h-8 w-8" />
                    </div>
                    <ArrowRight className="h-6 w-6" />
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Database className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Migrate from localStorage to SQLite database
                  </p>
                  <Button onClick={handleMigrate} size="lg">
                    Start Migration
                  </Button>
                </>
              )}

              {status === "loading" && (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Migrating data...</p>
                </>
              )}

              {status === "success" && results && (
                <>
                  <Check className="h-12 w-12 text-green-500" />
                  <h3 className="text-lg font-semibold text-green-600">Migration Complete!</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{results.projects.migrated}</span> projects migrated
                      {results.projects.skipped > 0 && (
                        <span className="text-muted-foreground"> ({results.projects.skipped} skipped)</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">{results.chats.migrated}</span> chats migrated
                      {results.chats.skipped > 0 && (
                        <span className="text-muted-foreground"> ({results.chats.skipped} skipped)</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">{results.messages.migrated}</span> messages migrated
                    </div>
                    <div>
                      Settings: {results.settings.migrated ? (
                        <span className="text-green-500">Migrated</span>
                      ) : (
                        <span className="text-muted-foreground">Not found</span>
                      )}
                    </div>
                  </div>
                  <Link href="/">
                    <Button>Go to Chat</Button>
                  </Link>
                </>
              )}

              {status === "error" && (
                <>
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                  <h3 className="text-lg font-semibold text-red-600">Migration Failed</h3>
                  {errorMessage && (
                    <p className="text-sm text-red-500">{errorMessage}</p>
                  )}
                  <Button onClick={handleMigrate} variant="outline">
                    Retry Migration
                  </Button>
                </>
              )}
            </div>
          </section>

          {/* Warning */}
          <section className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    Note
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    This migration will not delete your localStorage data. You can safely migrate and
                    verify everything works before manually clearing localStorage if desired.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

