import { NextRequest, NextResponse } from "next/server"
import * as projectsDb from "@/lib/db/projects"

// Use Node.js runtime for Prisma (SQLite doesn't work with Edge)
export const runtime = "nodejs"

/**
 * GET /api/projects - Get all projects
 */
export async function GET() {
  try {
    const projects = await projectsDb.getProjects()
    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects - Create a new project
 */
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json()

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      )
    }

    const project = await projectsDb.createProject(name)
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}

