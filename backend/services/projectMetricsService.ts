import { TaskModel } from "../models/Task";
import type { IProjectDocument } from "../models/Project";

function parseTaskPoints(estimate?: string): number {
  const n = parseInt(estimate?.replace(/\D/g, "") || "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export interface ProjectComputedMetrics {
  progressPercent: number;
  cycleTime: string;
  velocity: string;
}

export async function computeProjectMetrics(
  organizationId: string,
  projectIds: string[]
): Promise<Map<string, ProjectComputedMetrics>> {
  const map = new Map<string, ProjectComputedMetrics>();
  if (projectIds.length === 0) return map;

  const tasks = await TaskModel.find({
    organizationId,
    projectId: { $in: projectIds },
  }).lean();

  const byProject = new Map<string, typeof tasks>();
  for (const id of projectIds) {
    byProject.set(id, []);
    map.set(id, {
      progressPercent: 0,
      cycleTime: "--",
      velocity: "0 pts",
    });
  }
  for (const t of tasks) {
    const list = byProject.get(t.projectId);
    if (list) list.push(t);
  }

  for (const [projectId, projectTasks] of byProject) {
    const total = projectTasks.length;
    const doneTasks = projectTasks.filter((t) => t.status === "done");
    const doneCount = doneTasks.length;

    const progressPercent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    let completedPoints = 0;
    for (const t of doneTasks) {
      completedPoints += parseTaskPoints(t.estimate) || 3;
    }
    const velocity = `${completedPoints} pts`;

    let cycleTime = "--";
    if (doneTasks.length > 0) {
      const totalMs = doneTasks.reduce((acc, t) => {
        const created = new Date(t.createdAt).getTime();
        const updated = new Date(t.updatedAt).getTime();
        return acc + Math.max(0, updated - created);
      }, 0);
      const avgDays = totalMs / (doneTasks.length * 1000 * 60 * 60 * 24);
      cycleTime = `${avgDays < 0.1 ? avgDays.toFixed(2) : avgDays.toFixed(1)}d`;
    }

    map.set(projectId, { progressPercent, cycleTime, velocity });
  }

  return map;
}

export function applyMetricsToProjects(
  projects: IProjectDocument[],
  metrics: Map<string, ProjectComputedMetrics>
) {
  return projects.map((p) => {
    const m = metrics.get(p.id);
    if (!m) return p;
    const doc = typeof p.toObject === "function" ? p.toObject() : { ...p };
    return {
      ...doc,
      progressPercent: m.progressPercent,
      cycleTime: m.cycleTime,
      velocity: m.velocity,
    };
  });
}
