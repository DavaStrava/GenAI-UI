"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => void
}

export function NewProjectModal({
  isOpen,
  onClose,
  onCreate,
}: NewProjectModalProps) {
  const [name, setName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsCreating(true)
    try {
      onCreate(name.trim())
      setName("")
      onClose()
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">New Project</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || isCreating}>
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}




