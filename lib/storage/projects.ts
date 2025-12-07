"use client"

const PROJECTS_KEY = "genai_projects"

export interface Project {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Get all projects from localStorage
 */
export function getProjects(): Project[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const stored = localStorage.getItem(PROJECTS_KEY)
    if (!stored) {
      // Don't auto-create a default project - allow users to chat without projects
      return []
    }

    const parsed = JSON.parse(stored)
    const projects = parsed.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }))

    // Migration: Remove auto-created "Default Project" if it's the only project
    // This allows users to start fresh without any projects
    if (projects.length === 1 && (projects[0].id === "default" || projects[0].name === "Default Project")) {
      // Clear the default project
      localStorage.removeItem(PROJECTS_KEY)
      localStorage.removeItem("genai_active_project_id")
      return []
    }

    return projects
  } catch (error) {
    console.error("Error loading projects:", error)
    return []
  }
}

/**
 * Save projects to localStorage
 */
export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  } catch (error) {
    console.error("Error saving projects:", error)
    throw error
  }
}

/**
 * Get a project by ID
 */
export function getProject(projectId: string): Project | undefined {
  const projects = getProjects()
  return projects.find((p) => p.id === projectId)
}

/**
 * Create a new project
 */
export function createProject(name: string): Project {
  const projects = getProjects()
  const newProject: Project = {
    id: `project-${Date.now()}`,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  saveProjects([...projects, newProject])
  return newProject
}

/**
 * Update a project
 */
export function updateProject(projectId: string, updates: Partial<Project>): void {
  const projects = getProjects()
  const updated = projects.map((p) =>
    p.id === projectId
      ? { ...p, ...updates, updatedAt: new Date() }
      : p
  )
  saveProjects(updated)
}

/**
 * Delete a project
 */
export function deleteProject(projectId: string): void {
  const projects = getProjects()
  const filtered = projects.filter((p) => p.id !== projectId)
  saveProjects(filtered)
}

/**
 * Rename a project
 */
export function renameProject(projectId: string, newName: string): void {
  updateProject(projectId, { name: newName })
}




