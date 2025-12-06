"use client"

import { useProject } from "@/lib/contexts/project-context"
import { getChats, deleteChat, renameChat, type Chat } from "@/lib/storage/chats"
import { useState, useEffect } from "react"
import { MessageSquare, MoreVertical, Edit2, Trash2 } from "lucide-react"
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
  const [chats, setChats] = useState<Chat[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [contextMenuId, setContextMenuId] = useState<string | null>(null)

  const refreshChats = () => {
    if (activeProject) {
      const projectChats = getChats(activeProject.id)
      setChats(projectChats)
    } else {
      setChats([])
    }
  }

  useEffect(() => {
    if (activeProject) {
      const projectChats = getChats(activeProject.id)
      setChats(projectChats)
    } else {
      setChats([])
    }
  }, [activeProject, refreshTrigger])

  const handleDelete = (chatId: string) => {
    if (!activeProject) return
    if (confirm("Are you sure you want to delete this chat?")) {
      deleteChat(activeProject.id, chatId)
      refreshChats()
      if (selectedChatId === chatId) {
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

  const handleSaveRename = (chatId: string) => {
    if (!activeProject || !editingName.trim()) return
    renameChat(activeProject.id, chatId, editingName.trim())
    refreshChats()
    setEditingId(null)
    setEditingName("")
  }

  const handleCancelRename = () => {
    setEditingId(null)
    setEditingName("")
  }

  if (!activeProject) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No project selected
      </div>
    )
  }

  return (
    <div className="p-2 space-y-1">
      <button
        onClick={onCreateNewChat}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent font-medium"
      >
        <MessageSquare className="h-4 w-4" />
        New Chat
      </button>

      {chats.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground text-center">
          No chats yet. Start a new conversation!
        </div>
      ) : (
        chats.map((chat) => {
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
                <div className="p-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleSaveRename(chat.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveRename(chat.id)
                      } else if (e.key === "Escape") {
                        handleCancelRename()
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border border-input bg-background rounded focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => onSelectChat(chat)}
                  className={`w-full flex items-start justify-between px-2 py-1.5 rounded text-sm hover:bg-accent group/item ${
                    isSelected ? "bg-accent font-medium" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0 text-left">
                    <div className="truncate">{chat.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(chat.updatedAt, { addSuffix: true })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {chat.llmProvider} / {chat.llmModel}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setContextMenuId(contextMenuId === chat.id ? null : chat.id)
                    }}
                    className="p-1 hover:bg-accent rounded opacity-0 group-hover/item:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </button>
                </button>
              )}

              {showContextMenu && !isEditing && (
                <div className="absolute left-full ml-1 top-0 w-40 bg-background border border-border rounded-md shadow-lg z-10">
                  <button
                    onClick={() => handleRename(chat)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-t-md"
                  >
                    <Edit2 className="h-3 w-3" />
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(chat.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-red-600 rounded-b-md"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

