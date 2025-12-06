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

    // Set active project if none is set or if current one no longer exists
    if (!activeProject || !loadedProjects.find((p) => p.id === activeProject.id)) {
      setActiveProjectState(loadedProjects[0] || null)
    } else {
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

    // Set active project if none is set or if current one no longer exists
    if (!activeProject || !loadedProjects.find((p) => p.id === activeProject.id)) {
      setActiveProjectState(loadedProjects[0] || null)
    } else {
      // Update active project with latest data
      const updated = loadedProjects.find((p) => p.id === activeProject.id)
      if (updated) {
        setActiveProjectState(updated)
      }
    }
  }, [])

  const setActiveProject = (project: Project | null) => {
    setActiveProjectState(project)
    // Store active project ID in localStorage for persistence
    if (project && typeof window !== "undefined") {
      localStorage.setItem("genai_active_project_id", project.id)
    }
  }

  const createNewProject = (name: string): Project => {
    const newProject = createProject(name)
    refreshProjects()
    setActiveProject(newProject)
    return newProject
  }

  const updateProjectById = (projectId: string, updates: Partial<Project>) => {
    updateProject(projectId, updates)
    refreshProjects()
  }

  const deleteProjectById = (projectId: string) => {
    deleteProject(projectId)
    refreshProjects()
    // If deleted project was active, switch to first available
    if (activeProject?.id === projectId) {
      const remaining = getProjects()
      setActiveProject(remaining[0] || null)
    }
  }

  const renameProjectById = (projectId: string, newName: string) => {
    renameProject(projectId, newName)
    refreshProjects()
  }

  // Restore active project from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && projects.length > 0 && !activeProject) {
      const savedActiveId = localStorage.getItem("genai_active_project_id")
      if (savedActiveId) {
        const project = projects.find((p) => p.id === savedActiveId)
        if (project) {
          setActiveProjectState(project)
        }
      }
    }
  }, [projects.length, activeProject])

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

