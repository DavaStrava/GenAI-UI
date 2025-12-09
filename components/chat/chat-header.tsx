"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Sparkles, Settings, ChevronDown, ChevronUp, FileText, Wand2 } from "lucide-react"
import Link from "next/link"
import { LLMSelector } from "@/components/llm/llm-selector"
import { ModelParameters } from "@/components/settings/model-parameters"
import { useLLM } from "@/lib/contexts/llm-context"

interface ChatHeaderProps {
  onClear: () => void
  messageCount: number
  showEditor?: boolean
  onToggleEditor?: () => void
  selectedText?: string | null
  onRefineText?: () => void
}

export function ChatHeader({ 
  onClear, 
  messageCount, 
  showEditor = false, 
  onToggleEditor,
  selectedText,
  onRefineText 
}: ChatHeaderProps) {
  const [showParameters, setShowParameters] = useState(false)
  const { temperature, maxTokens, setTemperature, setMaxTokens } = useLLM()

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">GenAI Chat</h1>
            {messageCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {messageCount} message{messageCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <LLMSelector />
            {onToggleEditor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleEditor}
                className={showEditor ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}
              >
                <FileText className="h-4 w-4 mr-2" />
                Editor
              </Button>
            )}
            {selectedText && onRefineText && (
              <Button
                variant="default"
                size="sm"
                onClick={onRefineText}
                className="gap-2"
              >
                <Wand2 className="h-4 w-4" />
                Refine Selected Text
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowParameters(!showParameters)}
              className="text-muted-foreground hover:text-foreground"
            >
              Parameters
              {showParameters ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </Button>
            <Link href="/settings">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
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
        {showParameters && (
          <div className="border-t px-4 sm:px-6 py-4 max-w-3xl mx-auto w-full">
            <ModelParameters
              temperature={temperature}
              maxTokens={maxTokens}
              onTemperatureChange={setTemperature}
              onMaxTokensChange={setMaxTokens}
            />
          </div>
        )}
      </div>
    </div>
  )
}

