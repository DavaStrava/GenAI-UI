"use client"

import { useProject } from "@/lib/contexts/project-context"
import { getChats, getIndependentChats, deleteChat, renameChat, type Chat } from "@/lib/storage/chats"
import { useState, useEffect } from "react"
import { MessageSquare, MoreVertical, Edit2, Trash2, Plus, Folder, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ChatListProps {
  selectedChatId: string | null
  onSelectChat: (chat: Chat) => void
  onCreateNewChat: () => void
  refreshTrigger?: number
}

export function ChatList({
  selectedChatId,
  onSelectChat,
  onCreateNewChat,
  refreshTrigger,
}: ChatListProps) {
  const { activeProject } = useProject()
  const [projectChats, setProjectChats] = useState<Chat[]>([])
  const [independentChats, setIndependentChats] = useState<Chat[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [contextMenuId, setContextMenuId] = useState<string | null>(null)

  const refreshChats = () => {
    if (activeProject) {
      // When a project is active, only load project chats
      const project = getChats(activeProject.id)
      setProjectChats(project)
      setIndependentChats([])
    } else {
      // When no project is active, only load independent chats
      const independent = getIndependentChats()
      setIndependentChats(independent)
      setProjectChats([])
    }
  }

  useEffect(() => {
    refreshChats()
  }, [activeProject, refreshTrigger])

  const handleDelete = (chat: Chat) => {
    const projectId = chat.projectId
    if (confirm("Are you sure you want to delete this chat?")) {
      deleteChat(projectId, chat.id)
      refreshChats()
      if (selectedChatId === chat.id) {
        onCreateNewChat()
      }
    }
    setContextMenuId(null)
  }

  const handleRename = (chat: Chat) => {
    setEditingId(chat.id)
    setEditingName(chat.name)
    setContextMenuId(null)
  }

  const handleSaveRename = (chat: Chat) => {
    if (!editingName.trim()) return
    const projectId = chat.projectId
    renameChat(projectId, chat.id, editingName.trim())
    refreshChats()
    setEditingId(null)
    setEditingName("")
  }

  const handleCancelRename = () => {
    setEditingId(null)
    setEditingName("")
  }

  // Render a single chat item
  const renderChatItem = (chat: Chat) => {
    const isSelected = selectedChatId === chat.id
    const isEditing = editingId === chat.id
    const showContextMenu = contextMenuId === chat.id

    return (
      <div
        key={chat.id}
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
              onBlur={() => handleSaveRename(chat)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveRename(chat)
                } else if (e.key === "Escape") {
                  handleCancelRename()
                }
              }}
              className="w-full px-3 py-1.5 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={() => onSelectChat(chat)}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setContextMenuId(chat.id)
            }}
            className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all group/item ${
              isSelected
                ? "bg-primary/10 border border-primary/20 shadow-sm"
                : "hover:bg-accent/50 border border-transparent"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              <MessageCircle className={`h-4 w-4 ${
                isSelected ? "text-primary" : "text-muted-foreground"
              }`} />
            </div>
            <div className="flex-1 min-w-0 text-left space-y-1">
              <div className={`truncate text-sm leading-tight ${
                isSelected ? "font-semibold text-foreground" : "font-medium text-foreground"
              }`}>
                {chat.name}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(chat.updatedAt, { addSuffix: true })}</span>
                <span>•</span>
                <span className="truncate">{chat.llmProvider}/{chat.llmModel}</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setContextMenuId(contextMenuId === chat.id ? null : chat.id)
              }}
              className="p-1.5 hover:bg-accent rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </button>
        )}

        {showContextMenu && !isEditing && (
          <>
            {/* Backdrop to close menu when clicking outside */}
            <div
              className="fixed inset-0 z-[40]"
              onClick={() => setContextMenuId(null)}
              onContextMenu={(e) => {
                e.preventDefault()
                setContextMenuId(null)
              }}
            />
            {/* Context menu */}
            <div className="absolute right-0 top-0 w-44 bg-popover border border-border rounded-lg shadow-lg z-[50] py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRename(chat)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(chat)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // Show either project chats or independent chats, never both
  const currentChats = activeProject ? projectChats : independentChats
  const hasAnyChats = currentChats.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3 border-b">
        <button
          onClick={onCreateNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-3">
        {!hasAnyChats ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No chats yet</p>
            <p className="text-xs text-muted-foreground">Start a new conversation to get started</p>
          </div>
        ) : (
          <div>
            {/* Section header */}
            <div className="flex items-center gap-2 px-3 mb-3">
              {activeProject ? (
                <>
                  <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {activeProject.name}
                  </h3>
                </>
              ) : (
                <>
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Chat History
                  </h3>
                </>
              )}
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted-foreground/60">{currentChats.length}</span>
            </div>
            {/* Chat items */}
            <div className="space-y-1.5">
              {currentChats.map(renderChatItem)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

