"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

// Project type matching the Prisma model
export interface Project {
  id: string
  name: string
  createdAt: Date | string
  updatedAt: Date | string
}

interface ProjectContextType {
  projects: Project[]
  activeProject: Project | null
  isLoading: boolean
  setActiveProject: (project: Project | null) => void
  createNewProject: (name: string) => Promise<Project>
  updateProjectById: (projectId: string, updates: Partial<Project>) => Promise<void>
  deleteProjectById: (projectId: string) => Promise<void>
  renameProjectById: (projectId: string, newName: string) => Promise<void>
  refreshProjects: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProjectState] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const loadedProjects = await response.json()
        setProjects(loadedProjects)

        // Only update active project if current one no longer exists
        if (activeProject && !loadedProjects.find((p: Project) => p.id === activeProject.id)) {
          setActiveProjectState(null)
          if (typeof window !== "undefined") {
            localStorage.removeItem("genai_active_project_id")
          }
        } else if (activeProject) {
          const updated = loadedProjects.find((p: Project) => p.id === activeProject.id)
          if (updated) {
            setActiveProjectState(updated)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }, [activeProject])

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/projects")
        if (response.ok) {
          const loadedProjects = await response.json()
          setProjects(loadedProjects)
        }
      } catch (error) {
        console.error("Error loading projects:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProjects()

    // Don't restore active project from localStorage - always start with no project selected
    if (typeof window !== "undefined") {
      localStorage.removeItem("genai_active_project_id")
    }
  }, [])

  const setActiveProject = (project: Project | null) => {
    setActiveProjectState(project)
    if (typeof window !== "undefined") {
      if (project) {
        localStorage.setItem("genai_active_project_id", project.id)
      } else {
        localStorage.removeItem("genai_active_project_id")
      }
    }
  }

  const createNewProject = async (name: string): Promise<Project> => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      throw new Error("Failed to create project")
    }

    const newProject = await response.json()
    await refreshProjects()
    return newProject
  }

  const updateProjectById = async (projectId: string, updates: Partial<Project>) => {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error("Failed to update project")
    }

    await refreshProjects()
  }

  const deleteProjectById = async (projectId: string) => {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error("Failed to delete project")
    }

    await refreshProjects()

    if (activeProject?.id === projectId) {
      setActiveProject(null)
    }
  }

  const renameProjectById = async (projectId: string, newName: string) => {
    await updateProjectById(projectId, { name: newName })
  }

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        isLoading,
        setActiveProject,
        createNewProject,
        updateProjectById,
        deleteProjectById,
        renameProjectById,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider")
  }
  return context
}
