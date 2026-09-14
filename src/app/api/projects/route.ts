import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  try {
    const projects = db.getProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }
    const newProject = db.createProject({
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: body.description || "",
      sprint: body.sprint || "Sprint 1",
      progressPercent: 0,
      cycleTime: "1.0d",
      velocity: "Baseline",
      activeBranch: "main@init",
      repository: body.repository || "github.com/nova-arch/repo"
    });
    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
