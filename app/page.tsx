"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ChatContainer } from "@/components/chat/chat-container"
import { type Message } from "@/components/chat/chat-message"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatHeader } from "@/components/chat/chat-header"
import { ProjectSidebar, type SidebarChat } from "@/components/projects/project-sidebar"
import { useLLM } from "@/lib/contexts/llm-context"
import { useProject } from "@/lib/contexts/project-context"

// Helper to generate chat name from first message
function generateChatName(firstMessage: string): string {
  const maxLength = 50
  const trimmed = firstMessage.trim()
  if (trimmed.length <= maxLength) {
    return trimmed
  }
  return trimmed.slice(0, maxLength - 3) + "..."
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [currentChatProjectId, setCurrentChatProjectId] = useState<string | null>(null)
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null)
  const [chatListRefresh, setChatListRefresh] = useState(0)
  const { provider, model, temperature, maxTokens, getCurrentApiKey } = useLLM()
  const { activeProject, projects, setActiveProject } = useProject()
  const savingRef = useRef(false)

  // Save chat when messages change (debounced)
  useEffect(() => {
    if (messages.length === 0 || savingRef.current) return

    const timeoutId = setTimeout(async () => {
      savingRef.current = true
      try {
        if (currentChatId) {
          // Update existing chat
          await fetch(`/api/chats/${currentChatId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              llmProvider: provider,
              llmModel: model,
              temperature,
              maxTokens,
            }),
          })

          // Add messages to chat
          const existingMessages = await fetch(`/api/chats/${currentChatId}/messages`).then(r => r.json())
          const existingIds = new Set(existingMessages.map((m: any) => m.id))
          
          for (const msg of messages) {
            if (!existingIds.has(msg.id)) {
              await fetch(`/api/chats/${currentChatId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  role: msg.role,
                  content: msg.content,
                }),
              })
            }
          }
        } else {
          // Create new chat
          const projectId = pendingProjectId !== null ? pendingProjectId : null
          const firstUserMessage = messages.find((m) => m.role === "user")
          if (firstUserMessage) {
            const chatName = generateChatName(firstUserMessage.content)
            
            const response = await fetch("/api/chats", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: chatName,
                projectId,
                llmProvider: provider,
                llmModel: model,
                temperature,
                maxTokens,
              }),
            })

            if (response.ok) {
              const newChat = await response.json()
              setCurrentChatId(newChat.id)
              setCurrentChatProjectId(projectId)
              setPendingProjectId(null)

              // Add messages to the new chat
              for (const msg of messages) {
                await fetch(`/api/chats/${newChat.id}/messages`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    role: msg.role,
                    content: msg.content,
                  }),
                })
              }

              setChatListRefresh((prev) => prev + 1)
            }
          }
        }
      } catch (error) {
        console.error("Error saving chat:", error)
      } finally {
        savingRef.current = false
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [messages, currentChatId, currentChatProjectId, pendingProjectId, provider, model, temperature, maxTokens])

  // Clear chat when project changes or is deselected
  useEffect(() => {
    if (pendingProjectId === null) {
      setMessages([])
      setCurrentChatId(null)
      setCurrentChatProjectId(null)
    }
  }, [activeProject?.id, pendingProjectId])

  // Load chat when selected from the list
  const handleSelectChat = useCallback((chat: SidebarChat) => {
    const mappedMessages: Message[] = chat.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.timestamp),
      }))
    setMessages(mappedMessages)
    setCurrentChatId(chat.id)
    setCurrentChatProjectId(chat.projectId)
  }, [])

  // Create new independent chat
  const handleNewChat = useCallback(() => {
    setMessages([])
    setCurrentChatId(null)
    setCurrentChatProjectId(null)
    setPendingProjectId(null)
  }, [])

  // Create new project-specific chat
  const handleNewProjectChat = useCallback((projectId: string) => {
    setPendingProjectId(projectId)
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setActiveProject(project)
    }
    setMessages([])
    setCurrentChatId(null)
    setCurrentChatProjectId(null)
  }, [projects, setActiveProject])

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    const apiKey = await getCurrentApiKey()

    if (!apiKey) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Please configure your API key in Settings before sending messages.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({
            role,
            content,
          })),
          provider,
          model,
          apiKey,
          temperature,
          maxTokens,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No reader available")
      }

      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n").filter((line) => line.trim() !== "")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              break
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                throw new Error(parsed.error)
              }
              if (parsed.content) {
                assistantMessage.content += parsed.content
                setMessages((prev) => {
                  const updated = [...prev]
                  const lastMessage = updated[updated.length - 1]
                  if (lastMessage?.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...lastMessage,
                      content: assistantMessage.content,
                    }
                  }
                  return updated
                })
              }
            } catch (e) {
              if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                throw e
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          error instanceof Error
            ? `Error: ${error.message}`
            : "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [messages, provider, model, temperature, maxTokens, getCurrentApiKey])

  const handleClear = useCallback(() => {
    setMessages([])
    setCurrentChatId(null)
    setCurrentChatProjectId(null)
  }, [])

  // Update chat name when first message is sent
  useEffect(() => {
    if (
      currentChatId &&
      messages.length === 1 &&
      messages[0].role === "user"
    ) {
      const chatName = generateChatName(messages[0].content)
      fetch(`/api/chats/${currentChatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: chatName }),
      }).catch(console.error)
    }
  }, [messages, currentChatId])

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader onClear={handleClear} messageCount={messages.length} />
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar
          onNewProjectChat={handleNewProjectChat}
          selectedChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onCreateNewChat={handleNewChat}
          chatListRefresh={chatListRefresh}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <ChatContainer messages={messages} isLoading={isLoading} />
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
