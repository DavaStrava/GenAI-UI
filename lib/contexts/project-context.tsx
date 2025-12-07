"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  renameProject,
  type Project,
} from "@/lib/storage/projects"

interface ProjectContextType {
  projects: Project[]
  activeProject: Project | null
  setActiveProject: (project: Project | null) => void
  createNewProject: (name: string) => Project
  updateProjectById: (projectId: string, updates: Partial<Project>) => void
  deleteProjectById: (projectId: string) => void
  renameProjectById: (projectId: string, newName: string) => void
  refreshProjects: () => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProjectState] = useState<Project | null>(null)

  const refreshProjects = () => {
    const loadedProjects = getProjects()
    setProjects(loadedProjects)

    // Only update active project if current one no longer exists
    // Don't auto-select first project - allow null (no project selected)
    if (activeProject && !loadedProjects.find((p) => p.id === activeProject.id)) {
      // Current active project was deleted, clear it
      setActiveProjectState(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("genai_active_project_id")
      }
    } else if (activeProject) {
      // Update active project with latest data
      const updated = loadedProjects.find((p) => p.id === activeProject.id)
      if (updated) {
        setActiveProjectState(updated)
      }
    }
  }

  useEffect(() => {
    const loadedProjects = getProjects()
    setProjects(loadedProjects)

    // Don't restore active project from localStorage - always start with no project selected
    // This ensures independent chats are shown by default
    if (typeof window !== "undefined") {
      localStorage.removeItem("genai_active_project_id")
    }
    // Don't auto-select first project - allow null (no project selected)
  }, [])

  const setActiveProject = (project: Project | null) => {
    setActiveProjectState(project)
    // Store active project ID in localStorage for persistence
    if (typeof window !== "undefined") {
      if (project) {
        localStorage.setItem("genai_active_project_id", project.id)
      } else {
        localStorage.removeItem("genai_active_project_id")
      }
    }
  }

  const createNewProject = (name: string): Project => {
    const newProject = createProject(name)
    refreshProjects()
    // Don't auto-select the new project - let user choose when to select it
    // setActiveProject(newProject)
    return newProject
  }

  const updateProjectById = (projectId: string, updates: Partial<Project>) => {
    updateProject(projectId, updates)
    refreshProjects()
  }

  const deleteProjectById = (projectId: string) => {
    deleteProject(projectId)
    refreshProjects()
    // If deleted project was active, clear it (don't auto-select another)
    if (activeProject?.id === projectId) {
      setActiveProject(null)
    }
  }

  const renameProjectById = (projectId: string, newName: string) => {
    renameProject(projectId, newName)
    refreshProjects()
  }

  // This is now handled in the initial useEffect

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
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

