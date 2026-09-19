import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, presetId, projectId = "prj-1" } = body;

    const project = db.getProjectById(projectId) || db.getProjects()[0];
    const tasks = db.getTasks({ projectId: project.id });
    const specs = db.getSpecs({ projectId: project.id });
    const releases = db.getReleases(project.id);
    const activeRelease = releases[0];

    const urgentTasks = tasks.filter((t) => t.priority === "urgent" && t.status !== "done");
    const reviewTasks = tasks.filter((t) => t.status === "review");
    const doneTasks = tasks.filter((t) => t.status === "done");
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress");

    // Handle preset queries or natural language
    if (presetId === "summarize" || prompt?.toLowerCase().includes("summarize")) {
      const completionRate = Math.round((doneTasks.length / (tasks.length || 1)) * 100);
      return NextResponse.json({
        id: `msg-${Date.now()}`,
        label: "Summarize Project Status",
        summary: `${project.name} (${project.sprint}) is tracking at ${completionRate}% completion rate with a cycle time of ${project.cycleTime}.`,
        bullets: [
          `${doneTasks.length} issues completed across current cycle, including ${doneTasks.map((t) => t.key).slice(0, 3).join(", ")}`,
          `${inProgressTasks.length} active tasks currently in flight; ${reviewTasks.length} pull requests pending architectural sign-off`,
          `Active git branch synced at ${project.activeBranch} with telemetry velocity ${project.velocity}`,
          `Architecture specs: ${specs.filter((s) => s.status === "approved").length} approved, ${specs.filter((s) => s.status === "review").length} under active review`
        ],
        actionRequired: urgentTasks.length > 0
          ? `Resolve urgent blocker ${urgentTasks[0].key} (${urgentTasks[0].title}) assigned to ${urgentTasks[0].assignee.name}`
          : "All active milestones are tracking ahead of schedule for canary release.",
        citations: tasks.slice(0, 3).map((t) => ({ key: t.key, title: t.title }))
      });
    }

    if (presetId === "find-blockers" || prompt?.toLowerCase().includes("blocker")) {
      return NextResponse.json({
        id: `msg-${Date.now()}`,
        label: "Find Release Blockers",
        summary: `Detected ${urgentTasks.length + (reviewTasks.length > 1 ? 1 : 0)} potential velocity bottlenecks across ${project.name}:`,
        bullets: [
          ...urgentTasks.map(
            (t) => `${t.key}: ${t.title} (Priority: P0 Urgent • Assignee: ${t.assignee.name})`
          ),
          ...reviewTasks.slice(0, 2).map(
            (t) => `${t.key}: PR awaiting secondary architectural review on branch \`${t.branch || "main"}\``
          )
        ],
        actionRequired: urgentTasks.length > 0
          ? `Priority escalation: Coordinate with ${urgentTasks[0].assignee.name} to unblock ${urgentTasks[0].key}.`
          : "No critical P0 blockers preventing deployment.",
        citations: urgentTasks.map((t) => ({ key: t.key, title: t.title }))
      });
    }

    if (presetId === "draft-release" || prompt?.toLowerCase().includes("release")) {
      return NextResponse.json({
        id: `msg-${Date.now()}`,
        label: "Draft Release Update",
        summary: `${project.name} ${activeRelease?.version || "v2.4.0"} Automated Release Changelog:`,
        bullets: [
          ...doneTasks.map((t) => `Completed ${t.key}: ${t.title} [${t.tags.join(", ")}]`),
          `Pre-flight integrity: ${activeRelease?.checksPassed || 5}/${activeRelease?.totalChecks || 5} automated checks passed`,
          `Canary rollout status: Currently serving ${activeRelease?.canaryPercentage || 25}% live edge traffic`
        ],
        actionRequired: "Release candidate ready for 100% General Availability promotion via Release Console.",
        citations: doneTasks.map((t) => ({ key: t.key, title: t.title }))
      });
    }

    if (presetId === "group-issues" || prompt?.toLowerCase().includes("group")) {
      // Group open issues by tags
      const tagClusters: Record<string, string[]> = {};
      tasks.forEach((t) => {
        t.tags.forEach((tag) => {
          if (!tagClusters[tag]) tagClusters[tag] = [];
          tagClusters[tag].push(`${t.key} (${t.title.slice(0, 35)}...)`);
        });
      });

      const topTags = Object.entries(tagClusters)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 3);

      return NextResponse.json({
        id: `msg-${Date.now()}`,
        label: "Group Related Issues",
        summary: `Synthesized ${tasks.length} open workspace issues into ${topTags.length} primary domain clusters:`,
        bullets: topTags.map(
          ([tag, items]) => `Cluster "${tag}" (${items.length} issues): ${items.slice(0, 2).join(", ")}`
        ),
        actionRequired: "Applied automated squad labels across backlog items.",
        citations: tasks.slice(0, 4).map((t) => ({ key: t.key, title: t.title }))
      });
    }

    // Default intelligent response grounded in live context
    const query = prompt || "How is the project progressing?";
    const matchingTasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
    );

    return NextResponse.json({
      id: `msg-${Date.now()}`,
      label: "NOVA Context Intelligence",
      summary: `Analysis of ${project.name} state regarding "${query}":`,
      bullets: [
        `Grounded across ${tasks.length} tracked issues, ${specs.length} architecture specs, and 4 repositories.`,
        matchingTasks.length > 0
          ? `Found ${matchingTasks.length} directly related issues: ${matchingTasks.map((t) => `${t.key} [${t.status}]`).join(", ")}.`
          : `Active sprint velocity is tracking at ${project.velocity} with ${doneTasks.length} closed and ${inProgressTasks.length} in development.`,
        `Latest architectural decision: ${specs[0]?.key || "SPEC-104"} (${specs[0]?.title || "CRDT State Sync"}) is currently ${specs[0]?.status || "approved"}.`
      ],
      actionRequired: "Use ⌘K to quickly navigate to related issues or trigger automated pre-flight checks in Releases.",
      citations: (matchingTasks.length > 0 ? matchingTasks : tasks.slice(0, 3)).map((t) => ({
        key: t.key,
        title: t.title
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: "Context engine query failed" }, { status: 500 });
  }
}
