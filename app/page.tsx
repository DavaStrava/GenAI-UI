"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ChatContainer } from "@/components/chat/chat-container"
import { type Message } from "@/components/chat/chat-message"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatHeader } from "@/components/chat/chat-header"
import { ProjectSidebar } from "@/components/projects/project-sidebar"
import { ChatList } from "@/components/chats/chat-list"
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
  const [chatListRefresh, setChatListRefresh] = useState(0)
  const { provider, model, temperature, maxTokens, getCurrentApiKey } = useLLM()
  const { activeProject } = useProject()
  const savingRef = useRef(false)

  // Save chat when messages change (debounced)
  useEffect(() => {
    if (!activeProject || messages.length === 0 || savingRef.current) return

    const timeoutId = setTimeout(() => {
      savingRef.current = true
      try {
        if (currentChatId) {
          // Update existing chat
          updateChat(activeProject.id, currentChatId, {
            messages,
            llmProvider: provider,
            llmModel: model,
            temperature,
            maxTokens,
          })
        } else {
          // Create new chat if we have messages but no chat ID
          const firstUserMessage = messages.find((m) => m.role === "user")
          if (firstUserMessage) {
            const chatName = generateChatName(firstUserMessage.content)
            const newChat = createChat(activeProject.id, {
              projectId: activeProject.id,
              name: chatName,
              messages,
              llmProvider: provider,
              llmModel: model,
              temperature,
              maxTokens,
            })
            setCurrentChatId(newChat.id)
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
  }, [messages, activeProject, currentChatId, provider, model, temperature, maxTokens])

  // Load chat when selected
  const handleSelectChat = useCallback((chat: Chat) => {
    setMessages(chat.messages)
    setCurrentChatId(chat.id)
    // Restore chat parameters if they exist
    // Note: We could restore temperature/maxTokens to context here if needed
  }, [])

  // Create new chat
  const handleNewChat = useCallback(() => {
    setMessages([])
    setCurrentChatId(null)
  }, [])

  // Reset chat when project changes
  useEffect(() => {
    setMessages([])
    setCurrentChatId(null)
  }, [activeProject?.id])

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
  }, [])

  // Update chat name when first message is sent
  useEffect(() => {
    if (
      currentChatId &&
      activeProject &&
      messages.length === 1 &&
      messages[0].role === "user"
    ) {
      const chatName = generateChatName(messages[0].content)
      updateChat(activeProject.id, currentChatId, { name: chatName })
    }
  }, [messages, currentChatId, activeProject])

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader onClear={handleClear} messageCount={messages.length} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex">
          <ProjectSidebar />
          <div className="w-64 border-r bg-muted/20 flex flex-col">
            <div className="p-2 border-b">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Chats
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChatList
                selectedChatId={currentChatId}
                onSelectChat={handleSelectChat}
                onCreateNewChat={handleNewChat}
                refreshTrigger={chatListRefresh}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <ChatContainer messages={messages} isLoading={isLoading} />
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}

