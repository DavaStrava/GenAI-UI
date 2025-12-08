import { prisma } from "./client"
import type { Project } from "@/lib/generated/prisma"

/**
 * Get all projects from the database
 */
export async function getProjects(): Promise<Project[]> {
  return prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
  })
}

/**
 * Get a project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
  return prisma.project.findUnique({
    where: { id },
  })
}

/**
 * Create a new project
 */
export async function createProject(name: string): Promise<Project> {
  return prisma.project.create({
    data: { name },
  })
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  data: { name?: string }
): Promise<Project> {
  return prisma.project.update({
    where: { id },
    data,
  })
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  await prisma.project.delete({
    where: { id },
  })
}

/**
 * Rename a project
 */
export async function renameProject(id: string, name: string): Promise<Project> {
  return updateProject(id, { name })
}

