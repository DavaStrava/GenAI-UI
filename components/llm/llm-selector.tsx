"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useLLM } from "@/lib/contexts/llm-context"
import { getAllProviders } from "@/lib/llm/provider-factory"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function LLMSelector() {
  const { provider, model, setProvider, setModel } = useLLM()
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const providers = getAllProviders()
  const currentProvider = providers.find((p) => p.id === provider)
  const currentModel = currentProvider?.models.find((m) => m.id === model)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      })
    }
  }

  const handleToggle = () => {
    if (!isOpen) {
      updateDropdownPosition()
    }
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition()
      const handleResize = () => updateDropdownPosition()
      window.addEventListener("resize", handleResize)
      window.addEventListener("scroll", handleResize, true)
      return () => {
        window.removeEventListener("resize", handleResize)
        window.removeEventListener("scroll", handleResize, true)
      }
    }
  }, [isOpen])

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="outline"
        size="sm"
        onClick={handleToggle}
        className="gap-2 min-w-[200px] justify-between"
      >
        <span className="truncate">
          {currentProvider?.name} - {currentModel?.name || model}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && isMounted && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={dropdownRef}
            className="fixed w-64 bg-background border rounded-md shadow-lg max-h-[400px] overflow-auto z-[9999]"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {providers.map((p) => (
              <div key={p.id} className="p-1">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                  {p.name}
                </div>
                {p.models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setProvider(p.id)
                      setModel(m.id)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors",
                      provider === p.id && model === m.id && "bg-accent font-medium"
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
