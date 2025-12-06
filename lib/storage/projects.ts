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
      // Create default project if none exist
      const defaultProject: Project = {
        id: "default",
        name: "Default Project",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      saveProjects([defaultProject])
      return [defaultProject]
    }

    const parsed = JSON.parse(stored)
    return parsed.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }))
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
  
  // Don't allow deleting the last project
  if (projects.length <= 1) {
    throw new Error("Cannot delete the last project")
  }

  const filtered = projects.filter((p) => p.id !== projectId)
  saveProjects(filtered)
}

/**
 * Rename a project
 */
export function renameProject(projectId: string, newName: string): void {
  updateProject(projectId, { name: newName })
}

