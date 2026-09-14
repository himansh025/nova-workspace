import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { broadcastEvent } from "@/server/events";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = db.getTaskById(id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ task });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = db.updateTask(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Broadcast realtime event
    broadcastEvent({
      type: "task_updated",
      category: "tasks",
      title: "Task Updated",
      message: `${updated.assignee.name} updated ${updated.key} (${body.status ? `moved to ${body.status.replace("_", " ")}` : updated.title})`,
      link: "/app/tasks",
      meta: { taskId: updated.id, key: updated.key, status: updated.status },
    });

    return NextResponse.json({ task: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const success = db.deleteTask(id);
    if (!success) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    broadcastEvent({
      type: "task_deleted",
      category: "tasks",
      title: "Task Removed",
      message: `Task ${id} was deleted from workspace backlog`,
      link: "/app/tasks",
      meta: { taskId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
