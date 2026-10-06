import { ProjectModel } from "../models/Project";

export async function clearOtherDefaultProjects(organizationId: string, exceptProjectId?: string) {
  await ProjectModel.updateMany(
    {
      organizationId,
      ...(exceptProjectId ? { id: { $ne: exceptProjectId } } : {}),
      isDefaultForTasks: true,
    },
    { $set: { isDefaultForTasks: false, updatedAt: new Date().toISOString() } }
  );
}

export async function applyDefaultProjectFlag(
  organizationId: string,
  projectId: string,
  isDefault: boolean
) {
  if (isDefault) {
    await clearOtherDefaultProjects(organizationId, projectId);
    await ProjectModel.updateOne(
      { organizationId, id: projectId },
      { $set: { isDefaultForTasks: true, updatedAt: new Date().toISOString() } }
    );
  } else {
    await ProjectModel.updateOne(
      { organizationId, id: projectId },
      { $set: { isDefaultForTasks: false, updatedAt: new Date().toISOString() } }
    );
  }
}

export async function getDefaultProjectIdForOrg(organizationId: string): Promise<string | null> {
  const marked = await ProjectModel.findOne({ organizationId, isDefaultForTasks: true }).select("id");
  if (marked) return marked.id;

  const first = await ProjectModel.findOne({ organizationId }).sort({ createdAt: 1 }).select("id");
  return first?.id || null;
}
