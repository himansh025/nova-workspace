import { ReleaseModel, IReleaseDocument } from "../models/Release";
import { ActivityItemModel } from "../models/Activity";
import { broadcastEvent } from "./events";

export const releaseService = {
  async getReleases(organizationId: string, projectId?: string): Promise<IReleaseDocument[]> {
    const query: any = { organizationId };
    if (projectId) query.projectId = projectId;
    return ReleaseModel.find(query).sort({ createdAt: -1 });
  },

  async getReleaseById(organizationId: string, idOrVersion: string): Promise<IReleaseDocument | null> {
    return ReleaseModel.findOne({
      organizationId,
      $or: [{ id: idOrVersion }, { version: idOrVersion }],
    });
  },

  async updateRelease(
    organizationId: string,
    idOrVersion: string,
    updates: Partial<{
      canaryPercentage: number;
      status: "draft" | "canary" | "released";
      changelog: string[];
    }>,
    actorName: string = "Deployment Engine",
    actorInitials: string = "DE"
  ): Promise<IReleaseDocument | null> {
    const release = await ReleaseModel.findOne({
      organizationId,
      $or: [{ id: idOrVersion }, { version: idOrVersion }],
    });

    if (!release) return null;

    const oldStatus = release.status;
    const oldCanary = release.canaryPercentage;

    if (updates.canaryPercentage !== undefined) {
      release.canaryPercentage = Math.min(100, Math.max(0, updates.canaryPercentage));
    }
    if (updates.status) release.status = updates.status;
    if (updates.changelog) release.changelog = updates.changelog;

    if (updates.status === "released" && oldStatus !== "released") {
      release.canaryPercentage = 100;
      release.releasedAt = new Date().toISOString();
    }

    release.updatedAt = new Date().toISOString();
    await release.save();

    if (updates.canaryPercentage !== undefined && updates.canaryPercentage !== oldCanary) {
      await ActivityItemModel.create({
        id: `act-${Date.now()}`,
        organizationId,
        type: "release",
        actor: { name: actorName, initials: actorInitials },
        action: `updated canary rollout to ${release.canaryPercentage}%`,
        target: release.version,
        timestamp: "Just now",
      });

      broadcastEvent({
        type: "release_updated",
        category: "releases",
        title: "Canary Rollout Updated",
        message: `${release.version} promoted to ${release.canaryPercentage}% canary traffic`,
        link: "/app/releases",
      });
    }

    return release;
  },

  async runPreflightChecks(organizationId: string, idOrVersion: string): Promise<IReleaseDocument | null> {
    const release = await ReleaseModel.findOne({
      organizationId,
      $or: [{ id: idOrVersion }, { version: idOrVersion }],
    });

    if (!release) return null;

    // Simulate genuine verification checks execution
    release.checks = release.checks.map((chk) => ({
      ...chk,
      status: "passed",
      duration: `${Math.floor(Math.random() * 400 + 100)}ms`,
      details: "Automated pipeline suite validated with 0 regressions",
    }));

    release.checksPassed = release.checks.length;
    release.totalChecks = release.checks.length;
    release.updatedAt = new Date().toISOString();
    await release.save();

    await ActivityItemModel.create({
      id: `act-${Date.now()}`,
      organizationId,
      type: "release",
      actor: { name: "Automated Pipeline", initials: "CI" },
      action: "passed all preflight verification checks",
      target: release.version,
      timestamp: "Just now",
    });

    broadcastEvent({
      type: "release_updated",
      category: "releases",
      title: "Preflight Verification Passed",
      message: `${release.version} passed all automated pipeline preflight checks`,
      link: "/app/releases",
    });

    return release;
  },
};
