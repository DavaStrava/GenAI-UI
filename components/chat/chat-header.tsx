"use client"

import { Button } from "@/components/ui/button"
import { Trash2, Sparkles } from "lucide-react"

interface ChatHeaderProps {
  onClear: () => void
  messageCount: number
}

export function ChatHeader({ onClear, messageCount }: ChatHeaderProps) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">GenAI Chat</h1>
          {messageCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {messageCount} message{messageCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {messageCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

