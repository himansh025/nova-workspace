import { Task } from "@/types";

export function buildMyAssigneeIds(
  user: { id?: string; email?: string } | null | undefined,
  team: { id: string; email?: string }[]
): Set<string> {
  const ids = new Set<string>();
  if (user?.id) ids.add(user.id);
  const me = team.find((m) => m.email?.toLowerCase() === user?.email?.toLowerCase());
  if (me?.id) ids.add(me.id);
  return ids;
}

export function isTaskCreator(
  task: Task,
  user: { id?: string } | null | undefined
): boolean {
  return Boolean(task.creatorUserId && user?.id && task.creatorUserId === user.id);
}

export function isTaskAssignee(task: Task, assigneeIds: Set<string>): boolean {
  const assigneeId = task.assignee?.id;
  if (!assigneeId || assigneeId === "unassigned") return false;
  return assigneeIds.has(assigneeId);
}

export function canModifyTask(
  task: Task,
  opts: {
    isAdmin: boolean;
    user: { id?: string; email?: string } | null | undefined;
    assigneeIds: Set<string>;
    canUpdateTasks: boolean;
  }
): boolean {
  if (opts.isAdmin) return true;
  if (!opts.canUpdateTasks) return false;
  if (isTaskCreator(task, opts.user)) return true;
  return isTaskAssignee(task, opts.assigneeIds);
}

export function canDeleteTask(
  task: Task,
  opts: {
    isAdmin: boolean;
    user: { id?: string; email?: string } | null | undefined;
    assigneeIds: Set<string>;
    canDeleteTasks: boolean;
  }
): boolean {
  if (opts.isAdmin) return true;
  if (isTaskCreator(task, opts.user)) return true;
  if (!opts.canDeleteTasks) return false;
  return isTaskAssignee(task, opts.assigneeIds);
}
