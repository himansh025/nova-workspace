import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { TaskPriority, TaskStatus } from "@/server/types";
import { broadcastEvent } from "@/server/events";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId") || undefined;
    const status = (searchParams.get("status") as TaskStatus) || undefined;
    const priority = (searchParams.get("priority") as TaskPriority) || undefined;
    const assigneeId = searchParams.get("assigneeId") || undefined;
    const search = searchParams.get("search") || undefined;

    const tasks = db.getTasks({
      projectId,
      status,
      priority,
      assigneeId,
      search
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const newTask = db.createTask({
      projectId: body.projectId || "prj-1",
      title: body.title,
      description: body.description || "",
      priority: body.priority || "medium",
      status: body.status || "backlog",
      assigneeId: body.assigneeId,
      tags: body.tags || ["Feature"],
      branch: body.branch,
      estimate: body.estimate || "3 pts"
    });

    broadcastEvent({
      type: "task_created",
      category: "tasks",
      title: "New Issue Created",
      message: `${newTask.assignee.name} created ${newTask.key}: ${newTask.title}`,
      link: "/app/tasks",
      meta: { taskId: newTask.id, key: newTask.key },
    });

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
