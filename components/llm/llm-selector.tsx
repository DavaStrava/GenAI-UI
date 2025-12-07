"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useLLM } from "@/lib/contexts/llm-context"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown, Sparkles } from "lucide-react"
import { getApiKey } from "@/lib/storage/settings"

export function LLMSelector() {
  const { provider, model, setProvider, setModel, availableProviders, getCurrentApiKey } = useLLM()
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Prevent hydration errors by only rendering conditional content on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    // Use capture phase to catch events before they bubble
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [isOpen])

  const currentProvider = availableProviders.find((p) => p.id === provider)
  const currentApiKey = isMounted ? getCurrentApiKey() : undefined
  const hasApiKey = !!currentApiKey

  const handleProviderChange = (providerId: string) => {
    setProvider(providerId)
    setIsOpen(false)
  }

  const handleModelChange = (modelId: string) => {
    setModel(modelId)
    setIsOpen(false)
  }


  if (!currentProvider) {
    return null
  }

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">
          {currentProvider.name} / {model}
        </span>
        <span className="sm:hidden">{model}</span>
        {isMounted && !hasApiKey && (
          <span className="h-2 w-2 rounded-full bg-yellow-500" title="API key not configured" />
        )}
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && isMounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div 
            ref={dropdownRef}
            className="fixed w-64 bg-background border border-border rounded-lg shadow-lg z-[9999]"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                Provider
              </div>
              {availableProviders.map((p) => {
                const hasKey = isMounted ? !!getApiKey(p.id) : false
                const isSelected = p.id === provider
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProviderChange(p.id)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors cursor-pointer ${
                      isSelected ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{p.name}</span>
                      {isMounted && !hasKey && (
                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                )
              })}
            </div>

            <div className="border-t border-border p-2 space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                Model
              </div>
              {currentProvider.models.map((m) => {
                const isSelected = m === model
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleModelChange(m)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors cursor-pointer ${
                      isSelected ? "bg-accent" : ""
                    }`}
                  >
                    <span className="text-xs font-mono">{m}</span>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                )
              })}
            </div>

            {isMounted && !hasApiKey && (
              <div className="border-t border-border p-2">
                <div className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                  ⚠️ API key not configured. Please configure it in Settings.
                </div>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

