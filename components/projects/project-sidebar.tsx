"use client"

import { useState } from "react"
import { useProject } from "@/lib/contexts/project-context"
import { Button } from "@/components/ui/button"
import { Plus, MoreVertical, Edit2, Trash2 } from "lucide-react"
import { NewProjectModal } from "./new-project-modal"

export function ProjectSidebar() {
  const {
    projects,
    activeProject,
    setActiveProject,
    createNewProject,
    deleteProjectById,
    renameProjectById,
  } = useProject()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [contextMenuId, setContextMenuId] = useState<string | null>(null)

  const handleCreateProject = (name: string) => {
    createNewProject(name)
  }

  const handleDelete = (projectId: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        deleteProjectById(projectId)
      } catch (error: any) {
        alert(error.message || "Failed to delete project")
      }
    }
    setContextMenuId(null)
  }

  const handleRename = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setEditingId(projectId)
      setEditingName(project.name)
      setContextMenuId(null)
    }
  }

  const handleSaveRename = (projectId: string) => {
    if (editingName.trim()) {
      renameProjectById(projectId, editingName.trim())
    }
    setEditingId(null)
    setEditingName("")
  }

  const handleCancelRename = () => {
    setEditingId(null)
    setEditingName("")
  }

  return (
    <>
      <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold mb-2">Projects</h2>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {projects.map((project) => {
            const isActive = activeProject?.id === project.id
            const isEditing = editingId === project.id
            const showContextMenu = contextMenuId === project.id

            return (
              <div
                key={project.id}
                className="group relative"
                onBlur={(e) => {
                  // Close context menu when clicking outside
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setContextMenuId(null)
                  }
                }}
              >
                {isEditing ? (
                  <div className="p-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleSaveRename(project.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveRename(project.id)
                        } else if (e.key === "Escape") {
                          handleCancelRename()
                        }
                      }}
                      className="w-full px-2 py-1 text-sm border border-input bg-background rounded focus:outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveProject(project)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-accent ${
                      isActive ? "bg-accent font-medium" : ""
                    }`}
                  >
                    <span className="truncate">{project.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setContextMenuId(contextMenuId === project.id ? null : project.id)
                        }}
                        className="p-1 hover:bg-accent rounded"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </button>
                )}

                {showContextMenu && !isEditing && (
                  <div className="absolute right-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-10">
                    <button
                      onClick={() => handleRename(project.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-t-md"
                    >
                      <Edit2 className="h-4 w-4" />
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-red-600 rounded-b-md"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </>
  )
}

