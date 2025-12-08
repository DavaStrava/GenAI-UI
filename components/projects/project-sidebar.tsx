"use client"

import { useState } from "react"
import { useProject, type Project } from "@/lib/contexts/project-context"
import { Button } from "@/components/ui/button"
import { Plus, MoreVertical, Edit2, Trash2, MessageSquare, Folder, Loader2 } from "lucide-react"
import { NewProjectModal } from "./new-project-modal"
import { ChatList } from "@/components/chats/chat-list"

// Chat type for the sidebar
export interface SidebarChat {
  id: string
  projectId: string | null
  name: string
  llmProvider: string
  llmModel: string
  temperature?: number
  maxTokens?: number
  createdAt: Date | string
  updatedAt: Date | string
  messages: Array<{
    id: string
    role: string
    content: string
    timestamp: Date | string
  }>
}

interface ProjectSidebarProps {
  onNewProjectChat?: (projectId: string) => void
  selectedChatId: string | null
  onSelectChat: (chat: SidebarChat) => void
  onCreateNewChat: () => void
  chatListRefresh?: number
}

export function ProjectSidebar({
  onNewProjectChat,
  selectedChatId,
  onSelectChat,
  onCreateNewChat,
  chatListRefresh,
}: ProjectSidebarProps) {
  const {
    projects,
    activeProject,
    isLoading,
    setActiveProject,
    createNewProject,
    deleteProjectById,
    renameProjectById,
  } = useProject()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [contextMenuId, setContextMenuId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateProject = async (name: string) => {
    setIsCreating(true)
    try {
      await createNewProject(name)
    } catch (error) {
      console.error("Failed to create project:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (projectId: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProjectById(projectId)
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

  const handleSaveRename = async (projectId: string) => {
    if (editingName.trim()) {
      try {
        await renameProjectById(projectId, editingName.trim())
      } catch (error) {
        console.error("Failed to rename project:", error)
      }
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
      <div className="w-72 border-r bg-background flex flex-col h-full">
        {/* Projects Section - 1/3 of height */}
        <div className="flex flex-col h-1/3 border-b">
          <div className="p-4 border-b shrink-0">
            <h2 className="text-sm font-semibold mb-3 text-foreground">Projects</h2>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={() => setIsModalOpen(true)}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              New Project
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Loader2 className="h-8 w-8 text-muted-foreground/40 animate-spin mb-2" />
                <p className="text-xs text-muted-foreground">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Folder className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">No projects yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Create one to get started</p>
              </div>
            ) : (
              projects.map((project) => {
                const isActive = activeProject?.id === project.id
                const isEditing = editingId === project.id
                const showContextMenu = contextMenuId === project.id

                return (
                  <div
                    key={project.id}
                    className="group relative"
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setContextMenuId(null)
                      }
                    }}
                  >
                    {isEditing ? (
                      <div className="px-3 py-2">
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
                          className="w-full px-3 py-1.5 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (isActive) {
                              setActiveProject(null)
                            } else {
                              setActiveProject(project)
                            }
                          }}
                          className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            isActive
                              ? "bg-primary/10 border border-primary/20 text-foreground font-medium shadow-sm"
                              : "hover:bg-accent/50 border border-transparent text-foreground"
                          }`}
                        >
                          <Folder className={`h-4 w-4 shrink-0 ${
                            isActive ? "text-primary" : "text-muted-foreground"
                          }`} />
                          <span className="truncate text-left">{project.name}</span>
                        </button>
                        {onNewProjectChat && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onNewProjectChat(project.id)
                            }}
                            className="p-2 hover:bg-accent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="New Chat in Project"
                          >
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setContextMenuId(contextMenuId === project.id ? null : project.id)
                          }}
                          className="p-2 hover:bg-accent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    )}

                    {showContextMenu && !isEditing && (
                      <div className="absolute right-0 mt-1 w-44 bg-popover border border-border rounded-lg shadow-lg z-10 py-1">
                        {onNewProjectChat && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onNewProjectChat(project.id)
                              setContextMenuId(null)
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            New Chat
                          </button>
                        )}
                        <button
                          onClick={() => handleRename(project.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors ${
                            onNewProjectChat ? "" : ""
                          }`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Rename
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Chat History Section - 2/3 of height */}
        <div className="flex flex-col h-2/3">
          <ChatList
            selectedChatId={selectedChatId}
            onSelectChat={onSelectChat}
            onCreateNewChat={onCreateNewChat}
            refreshTrigger={chatListRefresh}
          />
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
