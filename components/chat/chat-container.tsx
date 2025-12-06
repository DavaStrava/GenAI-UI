"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage, type Message } from "./chat-message"

interface ChatContainerProps {
  messages: Message[]
  isLoading?: boolean
}

export function ChatContainer({ messages, isLoading }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <ScrollArea className="flex-1 h-full">
      <div ref={scrollRef} className="flex flex-col min-h-full">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center space-y-4 max-w-md">
              <h2 className="text-2xl font-semibold">Welcome to GenAI Chat</h2>
              <p className="text-muted-foreground">
                Start a conversation by typing a message below. I&apos;m here to help
                with any questions you might have.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex w-full gap-3 px-4 py-6 bg-muted/30">
                <div className="h-8 w-8 shrink-0 rounded-full bg-secondary flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold">Assistant</p>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </ScrollArea>
  )
}

