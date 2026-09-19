import { NextResponse } from "next/server";
import { getSprintById, assignTaskToSprint } from "@/server/sprintData";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sprint = getSprintById(id);
    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, sprint });
  } catch (error) {
    console.error("Error fetching sprint:", error);
    return NextResponse.json({ error: "Failed to fetch sprint" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { taskId, action } = body;

    if (action === "assign" && taskId) {
      const updatedSprint = assignTaskToSprint(taskId, id);
      return NextResponse.json({ success: true, sprint: updatedSprint });
    }

    if (action === "unassign" && taskId) {
      const updatedSprint = assignTaskToSprint(taskId, null);
      return NextResponse.json({ success: true, sprint: updatedSprint });
    }

    return NextResponse.json({ error: "Invalid action or parameters" }, { status: 400 });
  } catch (error) {
    console.error("Error updating sprint:", error);
    return NextResponse.json({ error: "Failed to update sprint" }, { status: 500 });
  }
}
