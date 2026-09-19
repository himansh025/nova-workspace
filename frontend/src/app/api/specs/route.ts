import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { SpecStatus } from "@/server/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId") || undefined;
    const status = (searchParams.get("status") as SpecStatus) || undefined;

    const specs = db.getSpecs({ projectId, status });
    return NextResponse.json({ specs });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch specs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.summary) {
      return NextResponse.json({ error: "Title and summary are required" }, { status: 400 });
    }

    const newSpec = db.createSpec({
      projectId: body.projectId || "prj-1",
      title: body.title,
      summary: body.summary,
      content: body.content || body.summary,
      tags: body.tags || ["Architecture"],
      authorId: body.authorId
    });

    return NextResponse.json({ spec: newSpec }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create spec" }, { status: 500 });
  }
}
