"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ChatContainer } from "@/components/chat/chat-container"
import { type Message } from "@/components/chat/chat-message"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatHeader } from "@/components/chat/chat-header"
import { ProjectSidebar } from "@/components/projects/project-sidebar"
import { useLLM } from "@/lib/contexts/llm-context"
import { useProject } from "@/lib/contexts/project-context"
import {
  createChat,
  updateChat,
  getChat,
  generateChatName,
  type Chat,
} from "@/lib/storage/chats"

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [currentChatProjectId, setCurrentChatProjectId] = useState<string | null>(null)
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null) // For project-specific chats
  const [chatListRefresh, setChatListRefresh] = useState(0)
  const { provider, model, temperature, maxTokens, getCurrentApiKey } = useLLM()
  const { activeProject, projects, setActiveProject } = useProject()
  const savingRef = useRef(false)

  // Save chat when messages change (debounced)
  // Save to independent storage if no project, or to project if project is selected
  useEffect(() => {
    if (messages.length === 0 || savingRef.current) return

    const timeoutId = setTimeout(() => {
      savingRef.current = true
      try {
        if (currentChatId) {
          // Update existing chat - use the chat's projectId (stored when chat was loaded)
          const projectId = currentChatProjectId
          updateChat(projectId, currentChatId, {
            messages,
            llmProvider: provider,
            llmModel: model,
            temperature,
            maxTokens,
          })
        } else {
          // Create new chat - use pendingProjectId if set (for project chats), otherwise null (independent)
          const projectId = pendingProjectId !== null ? pendingProjectId : null
          const firstUserMessage = messages.find((m) => m.role === "user")
          if (firstUserMessage) {
            const chatName = generateChatName(firstUserMessage.content)
            const newChat = createChat(projectId, {
              name: chatName,
              messages,
              llmProvider: provider,
              llmModel: model,
              temperature,
              maxTokens,
            })
            setCurrentChatId(newChat.id)
            setCurrentChatProjectId(projectId) // Store the projectId for this chat
            setPendingProjectId(null) // Clear pending project ID after chat is created
            setChatListRefresh((prev) => prev + 1) // Trigger chat list refresh
          }
        }
      } catch (error) {
        console.error("Error saving chat:", error)
      } finally {
        savingRef.current = false
      }
    }, 1000) // Debounce by 1 second

    return () => clearTimeout(timeoutId)
  }, [messages, currentChatId, currentChatProjectId, pendingProjectId, provider, model, temperature, maxTokens])

  // Clear chat when project changes or is deselected (but don't clear if we're starting a project chat)
  useEffect(() => {
    // Only clear if we're not in the middle of starting a project-specific chat
    if (pendingProjectId === null) {
      setMessages([])
      setCurrentChatId(null)
      setCurrentChatProjectId(null)
    }
  }, [activeProject?.id, pendingProjectId])

  // Load chat when selected from the list
  const handleSelectChat = useCallback((chat: Chat) => {
    setMessages(chat.messages)
    setCurrentChatId(chat.id)
    setCurrentChatProjectId(chat.projectId) // Store the chat's projectId
    // Restore chat parameters if they exist
    // Note: We could restore temperature/maxTokens to context here if needed
  }, [])

  // Create new independent chat (not associated with any project)
  const handleNewChat = useCallback(() => {
    setMessages([])
    setCurrentChatId(null)
    setCurrentChatProjectId(null)
    setPendingProjectId(null) // Ensure it's an independent chat
  }, [])

  // Create new project-specific chat
  const handleNewProjectChat = useCallback((projectId: string) => {
    // Set pending project ID first to prevent the project change effect from clearing the chat
    setPendingProjectId(projectId)
    // Find and set the active project
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setActiveProject(project)
    }
    // Clear current chat state
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

    const apiKey = getCurrentApiKey()

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
              // If it's an error from the API, show it
              if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                throw e
              }
              // Otherwise ignore JSON parse errors for incomplete chunks
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

  // Update chat name when first message is sent (for both independent and project chats)
  useEffect(() => {
    if (
      currentChatId &&
      messages.length === 1 &&
      messages[0].role === "user"
    ) {
      const projectId = currentChatProjectId
      const chatName = generateChatName(messages[0].content)
      updateChat(projectId, currentChatId, { name: chatName })
    }
  }, [messages, currentChatId, currentChatProjectId])

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

