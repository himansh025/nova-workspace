import { NextResponse } from "next/server";
import { getSprints, getActiveSprint, getVelocityHistory, startSprint } from "@/server/sprintData";
import { db } from "@/server/db";

export async function GET() {
  try {
    const sprints = getSprints();
    const activeSprint = getActiveSprint();
    const velocityHistory = getVelocityHistory();
    const allTasks = db.getTasks();

    // Map tasks into active sprint tasks vs backlog tasks
    const activeTaskIds = new Set(activeSprint?.taskIds || []);
    const sprintTasks = allTasks.filter((t) => activeTaskIds.has(t.id));
    const backlogTasks = allTasks.filter((t) => !activeTaskIds.has(t.id));

    // Calculate metrics
    const avgVelocity = velocityHistory.length > 0
      ? Math.round(velocityHistory.reduce((acc, curr) => acc + curr.completedPoints, 0) / velocityHistory.length)
      : 38;

    return NextResponse.json({
      success: true,
      sprints,
      activeSprint,
      velocityHistory,
      avgVelocity,
      sprintTasks,
      backlogTasks,
      allTasks
    });
  } catch (error) {
    console.error("Error fetching sprints:", error);
    return NextResponse.json({ error: "Failed to fetch sprints" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, sprintId } = body;

    if (action === "start" && sprintId) {
      const started = startSprint(sprintId);
      return NextResponse.json({ success: true, sprint: started });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in sprints action:", error);
    return NextResponse.json({ error: "Failed to process sprint action" }, { status: 500 });
  }
}
