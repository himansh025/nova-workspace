import { SpecModel, SpecRevisionModel, ISpecDocument } from "../models/Spec";
import { ActivityItemModel } from "../models/Activity";
import { broadcastEvent } from "./events";

export const specService = {
  async getSpecs(organizationId: string, projectId?: string) {
    const query: any = { organizationId };
    if (projectId) query.projectId = projectId;
    return SpecModel.find(query).sort({ updatedAt: -1 });
  },

  async getSpecById(organizationId: string, idOrKey: string): Promise<ISpecDocument | null> {
    return SpecModel.findOne({
      organizationId,
      $or: [{ id: idOrKey }, { key: idOrKey }],
    });
  },

  async getSpecRevisions(organizationId: string, specId: string) {
    return SpecRevisionModel.find({ organizationId, specId }).sort({ revisionNumber: -1 });
  },

  async createSpec(input: {
    organizationId: string;
    projectId?: string;
    title: string;
    summary: string;
    content: string;
    tags?: string[];
    author: { id: string; name: string; initials: string };
  }): Promise<ISpecDocument> {
    const latestSpec = await SpecModel.findOne({ organizationId: input.organizationId })
      .sort({ createdAt: -1 })
      .select("key");

    let nextNum = 101;
    if (latestSpec && latestSpec.key?.startsWith("SPEC-")) {
      const parsed = parseInt(latestSpec.key.replace("SPEC-", ""), 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }

    const specKey = `SPEC-${nextNum}`;
    const now = new Date().toISOString();

    const spec = await SpecModel.create({
      id: `spec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      key: specKey,
      organizationId: input.organizationId,
      projectId: input.projectId || "prj-1",
      title: input.title.trim(),
      summary: input.summary || "",
      content: input.content || "",
      status: "drafting",
      author: input.author,
      tags: input.tags && input.tags.length > 0 ? input.tags : ["Architecture"],
      revisionCount: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Save revision 1
    await SpecRevisionModel.create({
      specId: spec.id,
      organizationId: input.organizationId,
      revisionNumber: 1,
      title: spec.title,
      content: spec.content,
      summary: spec.summary,
      status: spec.status,
      savedBy: input.author,
      savedAt: new Date(),
    });

    await ActivityItemModel.create({
      id: `act-${Date.now()}`,
      organizationId: input.organizationId,
      type: "commit",
      actor: input.author,
      action: "drafted specification",
      target: `${spec.key} (${spec.title})`,
      timestamp: "Just now",
    });

    broadcastEvent({
      type: "system",
      category: "specs",
      title: "Spec Drafted",
      message: `${spec.key}: ${spec.title}`,
      link: "/app/specs",
    });

    return spec;
  },

  async updateSpec(
    organizationId: string,
    idOrKey: string,
    updates: Partial<{
      title: string;
      summary: string;
      content: string;
      status: "drafting" | "review" | "approved";
      tags: string[];
    }>,
    editor: { id: string; name: string; initials: string }
  ): Promise<ISpecDocument | null> {
    const spec = await SpecModel.findOne({
      organizationId,
      $or: [{ id: idOrKey }, { key: idOrKey }],
    });

    if (!spec) return null;

    const oldStatus = spec.status;
    const nextRev = (spec.revisionCount || 1) + 1;

    if (updates.title) spec.title = updates.title.trim();
    if (updates.summary !== undefined) spec.summary = updates.summary;
    if (updates.content !== undefined) spec.content = updates.content;
    if (updates.tags) spec.tags = updates.tags;

    if (updates.status) {
      spec.status = updates.status;
      if (updates.status === "approved" && oldStatus !== "approved") {
        spec.approvedAt = new Date();
        spec.approvedBy = editor;
      }
    }

    spec.revisionCount = nextRev;
    spec.updatedAt = new Date().toISOString();
    await spec.save();

    // Preserve full historical revision
    await SpecRevisionModel.create({
      specId: spec.id,
      organizationId,
      revisionNumber: nextRev,
      title: spec.title,
      content: spec.content,
      summary: spec.summary,
      status: spec.status,
      savedBy: editor,
      savedAt: new Date(),
    });

    if (updates.status === "approved" && oldStatus !== "approved") {
      await ActivityItemModel.create({
        id: `act-${Date.now()}`,
        organizationId,
        type: "spec_approved",
        actor: editor,
        action: "approved specification",
        target: `${spec.key} (${spec.title})`,
        timestamp: "Just now",
      });

      broadcastEvent({
        type: "spec_approved",
        category: "specs",
        title: "Architecture Spec Approved",
        message: `${spec.key} (${spec.title}) was officially approved`,
        link: "/app/specs",
      });
    }

    return spec;
  },

  async deleteSpec(organizationId: string, idOrKey: string): Promise<boolean> {
    const spec = await SpecModel.findOne({
      organizationId,
      $or: [{ id: idOrKey }, { key: idOrKey }],
    });
    if (!spec) return false;

    await Promise.all([
      SpecModel.deleteOne({ _id: spec._id }),
      SpecRevisionModel.deleteMany({ specId: spec.id }),
    ]);

    return true;
  },
};
